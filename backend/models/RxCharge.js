const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const RxChargeSchema = new Schema({
  consultationId: { type: Types.ObjectId, ref: 'Consultation', unique: true, required: true },
  prescriptionId: { type: Types.ObjectId, ref: 'Prescription', required: true },
  hospitalId: { type: Types.ObjectId, ref: 'Hospital', index: true, required: true },
  patientId: { type: Types.ObjectId, ref: 'Patient', required: true },
  items: [{
    medicineId: { type: Types.ObjectId, ref: 'Medicine', required: true },
    name: String,
    qty: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    lineTotal: { type: Number, required: true }
  }],
  subtotal: Number,
  taxTotal: Number,
  grandTotal: Number,
  status: { type: String, enum: ['pending','paid','void'], default: 'pending' },
  paymentId: { type: Types.ObjectId, ref: 'Payment' },
  paidAt: Date
}, { timestamps: true });

module.exports = mongoose.models.RxCharge || mongoose.model('RxCharge', RxChargeSchema);
