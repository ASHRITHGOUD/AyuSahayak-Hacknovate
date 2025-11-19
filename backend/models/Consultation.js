// backend/models/Consultation.js
const mongoose = require('mongoose');
const Counter = require('./Counter');

const consultationSchema = new mongoose.Schema({
  consultationId: { type: String, required: true, unique: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
  nurseId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  chiefComplaint: { type: String, required: true },
  conditionType: { type: String, enum: ['skin', 'wound', 'other'], required: true },
  images: [{ url: String, publicId: String, uploadedAt: Date }],
  vitals: {
    bloodPressure: String,
    heartRate: Number,
    temperature: Number,
    respiratoryRate: Number,
    oxygenSaturation: Number
  },
  reports: [{ url: String, publicId: String, fileName: String }],
  status: { type: String, enum: ['pending', 'in_queue', 'in_progress', 'completed', 'declined'], default: 'pending' },
  priority: { type: String, enum: ['normal','urgent'], default: 'normal' },
  payReady: { type: Boolean, default: false },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  doctorNotes: String,
  declineReason: String,
  startedAt: Date,
  completedAt: Date,
  video: {
  enabled: { type: Boolean, default: false },
  room: { type: String }, // e.g., patient-PAT000123 or consult-CON000123
  startedAt: { type: Date }
},



}, { timestamps: true });

// Auto-generate consultationId
consultationSchema.pre('validate', async function(next) {
  if (this.consultationId) return next();
  try {
    const c = await Counter.findOneAndUpdate(
      { key: 'consultation' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.consultationId = `CON${String(c.seq).padStart(6, '0')}`;
    next();
  } catch (e) { next(e); }
});

module.exports = mongoose.model('Consultation', consultationSchema);
