// backend/controllers/nurseUploadController.js
const cloudinary = require('../config/cloudinary');
const Consultation = require('../models/Consultation');
const User = require('../models/User');
const { audit } = require('../middleware/auditHook');
const streamifier = require('streamifier');

function uploadBufferToCloudinary(buffer, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (err, result) => err ? reject(err) : resolve(result)
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

// POST /api/nurse/consultations/:id/images
async function addConsultationImages(req, res, next) {
  try {
    const nurse = await User.findById(req.user.id);
    const hospitalId = nurse.hospitalId;
    const { id } = req.params;

    const consultation = await Consultation.findOne({ _id: id, hospitalId, nurseId: nurse._id });
    if (!consultation) return res.status(404).json({ message: 'Consultation not found' });

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const uploads = [];
    for (const f of req.files) {
      const result = await uploadBufferToCloudinary(f.buffer, `ayusahayak/${consultation.consultationId}`);
      uploads.push({
        url: result.secure_url,
        publicId: result.public_id,
        uploadedAt: new Date()
      });
    }

    consultation.images = consultation.images || [];
    consultation.images.push(...uploads);
    await consultation.save();

    await audit(req.user, 'upload_consult_images', 'consultation', consultation._id, { count: uploads.length }, req.ip);
    res.json({ count: uploads.length, images: uploads });
  } catch (err) {
    next(err);
  }
}

module.exports = { addConsultationImages };
