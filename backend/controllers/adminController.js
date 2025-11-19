// backend/controllers/adminController.js
const User = require('../models/User');
const Hospital = require('../models/Hospital');
const { sendEmail } = require('../utils/email/emailService');
const { audit } = require('../middleware/auditHook');
const Patient = require('../models/Patient');
const Payment = require('../models/Payment');


// POST /api/admin/hospitals
async function createHospital(req, res, next) {
  try {
    const { name, owner, contact, address, paymentRequiredBeforeConsult = true, tempPassword } = req.body;

    // 1) Create owner (no hospitalId yet)
    const ownerUser = await User.create({
      email: owner.email,
      password: tempPassword || Math.random().toString(36).slice(-10),
      role: 'hospital_owner',
      profile: {
        firstName: owner.firstName,
        lastName: owner.lastName,
        phone: owner.phone
      }
    });

    // 2) Create hospital with ownerId set
    const hospital = await Hospital.create({
      name,
      address: address || {},
      contact: contact || {},
      settings: { paymentRequiredBeforeConsult },
      ownerId: ownerUser._id
    });

    // 3) Set hospitalId on owner
    ownerUser.hospitalId = hospital._id;
    await ownerUser.save();

    // 4) Email (non-blocking)
    try {
      await sendEmail({
        to: owner.email,
        subject: 'Your AyuSahayak Hospital Owner Account',
        html: `<p>Dear ${owner.firstName},</p>
               <p>Your hospital owner account has been created.</p>
               <p>Email: <b>${owner.email}</b><br/>Password: <b>${tempPassword || 'Provided separately'}</b></p>
               <p>Please login and change your password.</p>`
      });
    } catch (e) {
      console.warn('Email failed:', e.message);
    }

    await audit(req.user, 'create_hospital', 'hospital', hospital._id, { owner: owner.email }, req.ip);
    res.status(201).json({ message: 'Hospital and owner created', hospitalId: hospital._id, ownerId: ownerUser._id });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/hospitals
async function listHospitals(req, res, next) {
  try {
    const hospitals = await Hospital.find({}).sort({ createdAt: -1 }).lean();
    const owners = await User.find({ role: 'hospital_owner' }).select('_id email').lean();
    const ownerById = new Map(owners.map(o => [String(o._id), o]));
    const result = hospitals.map(h => ({
      _id: h._id,
      name: h.name,
      status: h.status,
      createdAt: h.createdAt,
      ownerEmail: ownerById.get(String(h.ownerId))?.email || ''
    }));
    res.json(result);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/admin/hospitals/:id/status
async function updateHospitalStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const hospital = await Hospital.findByIdAndUpdate(id, { status }, { new: true });
    if (!hospital) return res.status(404).json({ message: 'Hospital not found' });

    await audit(req.user, 'update_hospital_status', 'hospital', hospital._id, { status }, req.ip);
    res.json({ message: 'Updated', status: hospital.status });
  } catch (err) {
    next(err);
  }
}
// GET /api/admin/stats
// GET /api/admin/stats
async function getAdminStats(req, res, next) {
  try {
    const [hospitalsCount, doctorsCount, nursesCount] = await Promise.all([
      Hospital.countDocuments({}),
      User.countDocuments({ role: 'doctor' }),
      User.countDocuments({ role: 'nurse' })
    ]);

    const revenueAgg = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;

    const patientsAgg = await Patient.aggregate([
      { $group: { _id: '$hospitalId', count: { $sum: 1 } } }
    ]);

    const revenuePerHospitalAgg = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: '$hospitalId', total: { $sum: '$amount' } } }
    ]);

    const hospitalIds = [
      ...new Set([
        ...patientsAgg.map(p => String(p._id)),
        ...revenuePerHospitalAgg.map(r => String(r._id))
      ])
    ].filter(Boolean);

    const hospitals = await Hospital.find({ _id: { $in: hospitalIds } })
      .select('_id name')
      .lean();
    const hospMap = new Map(hospitals.map(h => [String(h._id), h.name]));

    const patientsPerHospital = patientsAgg.map(p => ({
      hospitalId: String(p._id),
      hospitalName: hospMap.get(String(p._id)) || 'Unknown Hospital',
      count: p.count
    }));

    const revenuePerHospital = revenuePerHospitalAgg.map(r => ({
      hospitalId: String(r._id),
      hospitalName: hospMap.get(String(r._id)) || 'Unknown Hospital',
      total: r.total
    }));

    res.json({
      hospitalsCount,
      doctorsCount,
      nursesCount,
      totalRevenue,
      patientsPerHospital,
      revenuePerHospital
    });
  } catch (err) {
    next(err);
  }
}


module.exports = { createHospital, listHospitals, updateHospitalStatus ,getAdminStats};
