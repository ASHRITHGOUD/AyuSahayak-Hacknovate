const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const InventorySchema = new Schema({
  hospitalId: { type: Types.ObjectId, ref: 'Hospital', index: true, required: true },
  medicineId: { type: Types.ObjectId, ref: 'Medicine', index: true, required: true },
  quantity: { type: Number, default: 0 }
}, { timestamps: true });

InventorySchema.index({ hospitalId: 1, medicineId: 1 }, { unique: true });

module.exports = mongoose.models.Inventory || mongoose.model('Inventory', InventorySchema);
