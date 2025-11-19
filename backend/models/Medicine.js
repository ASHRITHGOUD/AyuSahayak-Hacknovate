const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const MedicineSchema = new Schema({
  hospitalId: { type: Types.ObjectId, ref: 'Hospital', index: true, required: true },
  code: { type: String, trim: true },     // optional unique code per hospital
  name: { type: String, required: true },
  form: { type: String },                  // tablet/syrup/ointment
  strength: { type: String },              // 500mg, 5mg/5ml
  unitPrice: { type: Number, required: true }, // rupees
  gstPct: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.models.Medicine || mongoose.model('Medicine', MedicineSchema);
