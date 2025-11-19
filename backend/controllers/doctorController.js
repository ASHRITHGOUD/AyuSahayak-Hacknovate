const mongoose = require('mongoose');
const User = require('../models/User');
const Consultation = require('../models/Consultation');
const Hospital = require('../models/Hospital');
const Prescription = require('../models/Prescription');
const { audit } = require('../middleware/auditHook');
const Patient = require('../models/Patient');
const buildConsultationCompletedEmail = require('../utils/email/templates/consultationCompleted');


// GET /api/doctor/consultations?status=in_queue
async function listQueue(req, res, next) {
  try {
    const doctor = await User.findById(req.user.id);
    const hospitalId = doctor.hospitalId;
    const status = (req.query.status || 'in_queue'); 
    const cons = await Consultation.find({
      hospitalId,
      status,
      $or: [{ payReady: true }, { payReady: { $exists: false } }]
    })
      .sort({ priority: -1, createdAt: 1 })
      .select('consultationId status priority createdAt patientId')
      .lean();

    const patientIds = cons.map(c => c.patientId);
    const patients = await Patient.find({ _id: { $in: patientIds } })
      .select('personalInfo.firstName personalInfo.lastName personalInfo.age personalInfo.gender conditionType photos')
      .lean();

    const pm = new Map(patients.map(p => [String(p._id), p]));
    const out = cons.map(c => {
      const p = pm.get(String(c.patientId));
      const firstPhoto = p?.photos?.[0]?.url || null;
      return {
        id: c._id,
        consultationId: c.consultationId,
        status: c.status,
        priority: c.priority,
        createdAt: c.createdAt,
        patient: p ? {
          name: `${p.personalInfo.firstName} ${p.personalInfo.lastName}`,
          age: p.personalInfo.age,
          gender: p.personalInfo.gender,
          conditionType: p.conditionType,
          photo: firstPhoto
        } : null
      };
    });

    res.json(out);
  } catch (err) { next(err); }
}

// GET /api/doctor/consultations/in-progress
async function listInProgress(req, res, next) {
  try {
    const doctor = await User.findById(req.user.id);
    const hospitalId = doctor.hospitalId;
    const list = await Consultation.find({ hospitalId, status: 'in_progress', doctorId: doctor._id })
      .sort({ startedAt: 1 })
      .select('consultationId status priority startedAt createdAt')
      .lean();
    res.json(list.map(c => ({
      id: c._id,
      consultationId: c.consultationId,
      status: c.status,
      priority: c.priority,
      startedAt: c.startedAt,
      createdAt: c.createdAt
    })));
  } catch (err) { next(err); }
}



// PATCH /api/doctor/consultations/:id/accept
async function acceptConsultation(req, res, next) {
  try {
    const doctorId = req.user.id;
    const doctor = await User.findById(doctorId);
    const hospitalId = doctor.hospitalId;
    const { id } = req.params;

    const updated = await Consultation.findOneAndUpdate(
    { _id: id, hospitalId, status: 'in_queue', payReady: true },
    { $set: { status: 'in_progress', doctorId, startedAt: new Date() } },
    { new: true }
  );

    if (!updated) return res.status(409).json({ message: 'Already taken or not in queue' });

    await audit(req.user, 'accept_consult', 'consultation', updated._id, {}, req.ip);
    res.json({ message: 'Accepted', id: updated._id, status: updated.status });
  } catch (err) { next(err); }
}

// PATCH /api/doctor/consultations/:id/decline { reason }
async function declineConsultation(req, res, next) {
  try {
    const doctor = await User.findById(req.user.id);
    const hospitalId = doctor.hospitalId;
    const { id } = req.params;
    const { reason } = req.body;

    const updated = await Consultation.findOneAndUpdate(
      { _id: id, hospitalId, status: { $in: ['in_queue','in_progress'] } },
      { $set: { status: 'declined', declineReason: reason || 'no reason' } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Consultation not found' });

    await audit(req.user, 'decline_consult', 'consultation', updated._id, { reason }, req.ip);
    res.json({ message: 'Declined', id: updated._id, status: updated.status });
  } catch (err) { next(err); }
}

// PATCH /api/doctor/consultations/:id/complete
async function completeConsultation(req, res, next) {
  try {
    const doctorId = req.user.id;
    const doctor = await User.findById(doctorId);
    const hospitalId = doctor.hospitalId;
    const { id } = req.params;

    // 1) Ensure the consultation is in progress for this doctor
    const cons = await Consultation.findOne({
      _id: id,
      hospitalId,
      status: 'in_progress',
      doctorId
    }).select('_id').lean();

    if (!cons) {
      return res.status(404).json({ message: 'Consultation not in progress for this doctor' });
    }

    // 2) Require a prescription to exist before completion
    const rx = await Prescription.findOne({ consultationId: cons._id }).select('_id').lean();
    if (!rx) {
      return res.status(400).json({ message: 'Add a prescription before completing this consultation' });
    }

    // 3) Complete the consultation
const updated = await Consultation.findOneAndUpdate(
  { _id: cons._id },
  { $set: { status: 'completed', completedAt: new Date() } },
  { new: true }
);

await audit(req.user, 'complete_consult', 'consultation', updated._id, {}, req.ip);
// Build/refresh Rx bill automatically on completion (non-blocking)
try {
  const { buildCharge } = require('./rxBillingController');
  const fakeReq = { user: req.user, params: { consultationId: String(updated._id) }, ip: req.ip };
  const fakeRes = { json() {}, status() { return this; } };
  await buildCharge(fakeReq, fakeRes, (e)=>{ if (e) console.warn('buildCharge error', e?.message); });
} catch (e) {
  console.warn('RX build trigger on consult complete failed:', e?.message);
}


// Build and send email
try {
  const [patient, nurse, hospital, rx, payment] = await Promise.all([
    require('../models/Patient').findById(updated.patientId)
      .select('personalInfo.firstName personalInfo.lastName personalInfo.email')
      .lean(),
    User.findById(updated.nurseId)
      .select('profile.firstName profile.lastName')
      .lean(),
    Hospital.findById(updated.hospitalId)
      .select('name address.street address.city address.state address.pincode')
      .lean(),
    Prescription.findOne({ consultationId: updated._id })
      .select('medications notes digitalSignature')
      .lean(),
    require('../models/Payment').findOne({ consultationId: updated._id, status: 'completed' })
      .sort({ paidAt: -1 }).select('amount paidAt').lean()
  ]);

  const to = patient?.personalInfo?.email;
  if (to) {
    const html = buildConsultationCompletedEmail({
      consultationId: updated.consultationId,
      completedAt: updated.completedAt,
      patientName: `${patient.personalInfo.firstName} ${patient.personalInfo.lastName}`,
      doctorName: `${doctor.profile.firstName} ${doctor.profile.lastName}`,
      doctorQualification: doctor.profile.qualification || rx?.digitalSignature?.qualification || '',
      doctorRegNo: doctor?.doctor?.regNo || '',
      doctorSignatureUrl: doctor?.doctor?.signature?.url || '',
      nurseName: nurse ? `${nurse.profile.firstName} ${nurse.profile.lastName}` : '',
      hospitalName: hospital?.name || '',
      hospitalAddress: [hospital?.address?.street, hospital?.address?.city, hospital?.address?.state, hospital?.address?.pincode]
        .filter(Boolean).join(', '),
      paymentAmount: payment?.amount ?? null,
      paymentDate: payment?.paidAt || null,
      medications: rx?.medications || [],
      notes: rx?.notes || ''
    });

    const { sendEmail } = require('../utils/email/emailService');
    await sendEmail({
      to,
      subject: `Your Consultation Summary — ${updated.consultationId}`,
      html
    });
  }
} catch (e) {
  console.error('Completion email failed:', e?.message);
}

res.json({ message: 'Completed', id: updated._id, status: updated.status });

  } catch (err) {
    next(err);
  }
}

// GET /api/doctor/consultations/:id/details
// GET /api/doctor/consultations/:id/details
// GET /api/doctor/consultations/:id/details
async function getConsultationDetails(req, res, next) {
  try {
    const doctor = await User.findById(req.user.id);
    const hospitalId = doctor.hospitalId;
    const { id } = req.params;

    const cons = await Consultation.findOne({ _id: id, hospitalId })
      .select(
        'consultationId patientId chiefComplaint conditionType createdAt nurseId images status doctorId startedAt video'
      )
      .lean();

    if (!cons)
      return res.status(404).json({ message: 'Consultation not found' });

    // 🚀 Pull all fields including AI + ruralCareAssessment
    const patient = await Patient.findById(cons.patientId).lean();

    // Fallback compatibility support
    const woundAI = patient?.woundCareAI || patient?.wound_result || null;
    const skinAI  = patient?.skinCareAI  || patient?.skin_result  || null;

    res.json({
      consultation: {
        id: cons._id,
        consultationId: cons.consultationId,
        chiefComplaint: cons.chiefComplaint || '',
        conditionType: cons.conditionType || '',
        status: cons.status,
        createdAt: cons.createdAt,
        startedAt: cons.startedAt || null
      },

      video: cons.video || { enabled: false, room: null },

      patient: patient
        ? {
            id: patient._id,
            patientId: patient.patientId,
            name: `${patient.personalInfo?.firstName || ''} ${patient.personalInfo?.lastName || ''}`.trim(),
            age: patient.personalInfo?.age,
            gender: patient.personalInfo?.gender,
            height: patient.personalInfo?.height || null,
            weight: patient.personalInfo?.weight || null,
            phone: patient.personalInfo?.phone || null,

            conditionType: patient.conditionType || 'other',
            photos: Array.isArray(patient.photos) ? patient.photos : [],

            // ⭐ AI RESULTS
            skinCareAI: skinAI,
            woundCareAI: woundAI,

            hasAI: !!skinAI || !!woundAI,
            aiSummary: woundAI || skinAI,

            // ⭐ RuralCare multi-case results
            ruralCases: patient.ruralCareAssessment || []
          }
        : null,

      consultationImages: Array.isArray(cons.images) ? cons.images : []
    });
  } catch (err) {
    next(err);
  }
}


module.exports = { listQueue, acceptConsultation, declineConsultation, completeConsultation, listInProgress ,getConsultationDetails};
