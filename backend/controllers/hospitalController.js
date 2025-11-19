// backend/controllers/hospitalController.js
const User = require('../models/User');
const Hospital = require('../models/Hospital');
const { sendEmail } = require('../utils/email/emailService');
const { audit } = require('../middleware/auditHook');
const cloudinary = require('../config/cloudinary');
const upload = require('../middleware/upload');



// GET /api/hospital/me
// Returns the hospital of the logged-in hospital_owner
async function getMyHospital(req, res, next) {
  try {
    const owner = await User.findById(req.user.id).select('role hospitalId').lean();
    if (!owner || owner.role !== 'hospital_owner') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    if (!owner.hospitalId) {
      return res.status(404).json({ message: 'Hospital not found' });
    }

    const hospital = await Hospital.findById(owner.hospitalId)
      .select('name address.street address.city address.state address.pincode')
      .lean();

    if (!hospital) return res.status(404).json({ message: 'Hospital not found' });
    res.json(hospital);
  } catch (err) { next(err); }
}

// POST /api/hospital/users  { role: 'nurse'|'doctor', email, tempPassword, firstName, lastName, phone, qualification?, specialization? }
async function createStaffUser(req, res, next) {
  try {
    console.log('createStaffUser keys:', Object.keys(req.body), 'file?', !!req.file);
    if (!req.body) return res.status(400).json({ message: 'Missing form body' });
    const ownerId = req.user.id;
    const owner = await User.findById(ownerId);
    if (!owner || owner.role !== 'hospital_owner') return res.status(403).json({ message: 'Forbidden' });

    const hospitalId = owner.hospitalId;
    if (!hospitalId) return res.status(400).json({ message: 'Owner has no hospitalId' });

    const { role, email, tempPassword, firstName, lastName, phone, qualification, specialization, regNo } = req.body;
    if (!['nurse','doctor'].includes(role)) return res.status(400).json({ message: 'Invalid role' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already in use' });

    /// Helper once, above its use
function uploadBufferToCloudinary(buf, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image', format: 'jpg' },
      (err, res) => err ? reject(err) : resolve(res)
    );
    stream.end(buf);
  });
}

// Upload signature only for doctor
let doctorSignature;
if (role === 'doctor') {
  if (req.file) {
    // Optional content-type check
    const mime = req.file.mimetype || '';
    if (!/^image\/jpe?g$/i.test(mime)) {
      return res.status(400).json({ message: 'Signature must be a JPG image' });
    }
    const result = await uploadBufferToCloudinary(
      req.file.buffer,
      `ayusahayak/signatures/${hospitalId}`
    );
    doctorSignature = { url: result.secure_url, publicId: result.public_id };
  } else {
    // Signature optional; skip if not provided
    doctorSignature = undefined;
  }
}


    const user = await User.create({
      email,
      password: tempPassword || Math.random().toString(36).slice(-10),
      role,
      hospitalId,
      profile: { firstName, lastName, phone, qualification: qualification || '', specialization: specialization || '' },
      doctor: role === 'doctor' ? { regNo: regNo || '', signature: doctorSignature } : undefined,
      isActive: true,
      createdBy: ownerId
    });

    try {
      await sendEmail({
        to: email,
        subject: `Your ${role} account at AyuSahayak`,
        html: `<p>Hi ${firstName},</p>
               <p>Your ${role} account has been created.</p>
               <p>Email: <b>${email}</b><br/>Password: <b>${tempPassword || 'Provided separately'}</b></p>
               <p>Please login and change your password.</p>`
      });
    } catch (e) { console.warn('Email failed:', e.message); }

    await audit(req.user, 'create_staff_user', 'user', user._id, { role, email }, req.ip);
    res.status(201).json({ message: 'User created', id: user._id });
  } catch (err) { next(err); }
}


// GET /api/hospital/users
async function listStaffUsers(req, res, next) {
  try {
    const owner = await User.findById(req.user.id);
    const hospitalId = owner.hospitalId;
    const users = await User.find({
      hospitalId,
      role: { $in: ['nurse', 'doctor'] }
    }).select('email role isActive createdAt profile.firstName profile.lastName').sort({ createdAt: -1 }).lean();

    res.json(users.map(u => ({
      id: u._id,
      email: u.email,
      role: u.role,
      name: `${u.profile.firstName} ${u.profile.lastName}`,
      isActive: u.isActive,
      createdAt: u.createdAt
    })));
  } catch (err) {
    next(err);
  }
}

// PATCH /api/hospital/users/:id/status { isActive: true|false }
async function toggleUserActive(req, res, next) {
  try {
    const owner = await User.findById(req.user.id);
    const hospitalId = owner.hospitalId;
    const { id } = req.params;
    const { isActive } = req.body;

    const user = await User.findOneAndUpdate(
      { _id: id, hospitalId, role: { $in: ['nurse', 'doctor'] } },
      { isActive: !!isActive },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });

    await audit(req.user, 'toggle_user_active', 'user', user._id, { isActive: user.isActive }, req.ip);
    res.json({ message: 'Updated', isActive: user.isActive });
  } catch (err) {
    next(err);
  }
}
// DELETE /api/hospital/users/:id
async function deleteStaffUser(req, res, next) {
  try {
    const owner = await User.findById(req.user.id);
    const hospitalId = owner.hospitalId;
    const { id } = req.params;

    const user = await User.findOne({ _id: id, hospitalId, role: { $in: ['nurse','doctor'] } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Optionally delete signature from Cloudinary
    const publicId = user?.doctor?.signature?.publicId;
    if (publicId) {
      try { await cloudinary.uploader.destroy(publicId); } catch (e) { console.warn('Cloudinary destroy failed:', e.message); }
    }

    await User.deleteOne({ _id: user._id });
    await audit(req.user, 'delete_staff_user', 'user', user._id, {}, req.ip);
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
}


module.exports = { createStaffUser, listStaffUsers, toggleUserActive,deleteStaffUser , getMyHospital};
