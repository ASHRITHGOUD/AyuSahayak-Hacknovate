const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  consultationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Consultation', required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  medications: [{
    name: { type: String, required: true },
    code: { type: String }, 
    qty: { type: Number, default: 1 }, 
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
    duration: { type: String, required: true },
    instructions: String
  }],
  notes: String,
  digitalSignature: {
    doctorName: String,
    qualification: String,
    signedAt: Date
  },
  isUnlocked: { type: Boolean, default: false },
  lockedForNurse: { type: Boolean, default: true }

}, { timestamps: true });

// IMPORTANT: idempotent export to avoid OverwriteModelError
module.exports = mongoose.models.Prescription || mongoose.model('Prescription', prescriptionSchema);
