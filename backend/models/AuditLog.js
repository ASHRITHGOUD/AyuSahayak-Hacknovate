const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userRole: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true
  },
  entity: {
    type: String, // e.g., 'user', 'patient', 'prescription', 'payment'
    required: true
  },
  entityId: mongoose.Schema.Types.ObjectId,
  details: mongoose.Schema.Types.Mixed,
  ipAddress: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
