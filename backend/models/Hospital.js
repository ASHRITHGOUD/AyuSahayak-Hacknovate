// backend/models/Hospital.js
const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  contact: {
    phone: String,
    email: String
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'suspended'],
    default: 'active'
  },
  settings: {
    paymentRequiredBeforeConsult: { type: Boolean, default: true }
  }
}, { timestamps: true });

module.exports = mongoose.model('Hospital', hospitalSchema);
