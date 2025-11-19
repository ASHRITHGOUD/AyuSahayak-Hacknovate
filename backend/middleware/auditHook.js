const AuditLog = require('../models/AuditLog');

async function audit(actor, action, entity, entityId, details = {}, ipAddress) {
  try {
    await AuditLog.create({
      userId: actor?.id,
      userRole: actor?.role,
      action,
      entity,
      entityId,
      details,
      ipAddress,
    });
  } catch (e) {
    // avoid throwing from audit path
    console.warn('Audit failed', e.message);
  }
}

module.exports = { audit };
