// backend/controllers/prescriptionController.js
const mongoose = require('mongoose');
const User = require('../models/User');
const Consultation = require('../models/Consultation');
const Prescription = require('../models/Prescription');
const { audit } = require('../middleware/auditHook');
const { buildCharge } = require('./rxBillingController');

// helper: resolve a consultation by ref within hospital scope (if available via req.user)
async function resolveConsultationByRef(ref, hospitalId) {
  const cleaned = String(ref || '').trim();
  if (!cleaned) return null;

  if (mongoose.isValidObjectId(cleaned)) {
    return await Consultation.findOne(hospitalId
      ? { _id: cleaned, hospitalId }
      : { _id: cleaned }
    ).lean();
  }
  // human ID like CON000123
  return await Consultation.findOne(hospitalId
    ? { consultationId: cleaned, hospitalId }
    : { consultationId: cleaned }
  ).lean();
}

// POST /api/prescriptions
// body: { consultationRef, medications:[{name,dosage,frequency,duration,instructions}], notes }
async function createPrescription(req, res, next) {
  try {
    const doctor = await User.findById(req.user.id);
    if (!doctor || doctor.role !== 'doctor') return res.status(403).json({ message: 'Forbidden' });

    const hospitalId = doctor.hospitalId;
    const { consultationRef, medications = [], notes = '' } = req.body;

    // Basic validation: medications must be provided and each must have required fields and positive quantity
    if (!Array.isArray(medications) || medications.length === 0) {
      return res.status(400).json({ message: 'At least one medication is required' });
    }
    for (const m of medications) {
      const qty = Number(m.qty ?? m.quantity ?? 0);
      if (!m || !m.name || !m.dosage || !m.frequency || !m.duration) {
        return res.status(400).json({ message: 'Each medication must include name, dosage, frequency and duration' });
      }
      if (!Number.isFinite(qty) || qty <= 0) {
        return res.status(400).json({ message: `Invalid quantity for medicine: ${m.name || m.code || ''}` });
      }
    }

    const cons = await resolveConsultationByRef(consultationRef, hospitalId);
    if (!cons) return res.status(404).json({ message: 'Consultation not found' });
    if (String(cons.doctorId) !== String(doctor._id) || cons.status !== 'in_progress') {
      return res.status(400).json({ message: 'Consultation must be in progress by you' });
    }

    // Upsert single prescription per consultation
    const prescription = await Prescription.findOneAndUpdate(
      { consultationId: cons._id },
      {
        $set: {
          consultationId: cons._id,
          patientId: cons.patientId,
          doctorId: doctor._id,
          medications,
          notes,
          digitalSignature: {
            doctorName: `${doctor.profile.firstName} ${doctor.profile.lastName}`,
            qualification: doctor.profile.qualification || '',
            signedAt: new Date()
          },
          // IMPORTANT: prescriptions are locked for nurse until Rx charge is paid
          lockedForNurse: true
        }
      },
      { new: true, upsert: true }
    );

    await audit(req.user, 'create_prescription', 'prescription', prescription._id, { consultationId: cons._id }, req.ip);
    res.status(201).json({ id: prescription._id });
    // after prescription is saved, trigger bill build (non-blocking)
// after prescription is saved, trigger bill build (non-blocking, in-process)
try {
  const fakeReq = {
    user: req.user,
    params: { consultationId: String(cons._id) },
    ip: req.ip
  };
  const fakeRes = { json() {}, status() { return this; } };
  await buildCharge(fakeReq, fakeRes, (e) => {
    if (e) console.warn('buildCharge error', e?.message);
  });
} catch (e) {
  // log only; do not block Rx save
  console.warn('RX build trigger failed:', e?.message);
}


  } catch (err) { next(err); }
}

// GET /api/prescriptions/by-consultation/:ref
async function getByConsultation(req, res, next) {
  try {
    const ref = String(req.params.ref || '').trim();

    // If your auth middleware sets hospitalId, use it for scoping
    const hospitalId = req.user?.hospitalId || null;
    const cons = await resolveConsultationByRef(ref, hospitalId);
    if (!cons) return res.status(404).json({ message: 'Consultation not found' });

    const rx = await Prescription.findOne({ consultationId: cons._id })
      .select('lockedForNurse medications notes digitalSignature createdAt updatedAt')
      .lean();

    if (!rx) return res.status(404).json({ message: 'Prescription not found' });

    // Gate only nurses by lock flag
    if (req.user.role === 'nurse' && rx.lockedForNurse) {
      return res.status(403).json({ message: 'Prescription locked. Pay hospital bill to unlock.' });
    }

    return res.json(rx);
  } catch (err) { next(err); }
}

module.exports = { createPrescription, getByConsultation };
