// backend/controllers/paymentController.js
const mongoose=require('mongoose');
const crypto = require('crypto');
const razorpay = require('../config/razorpay');
const User = require('../models/User');
const Consultation = require('../models/Consultation');
const Payment = require('../models/Payment');
const Hospital = require('../models/Hospital');
const { audit } = require('../middleware/auditHook');
const { sendSMS } = require('../utils/sms/smsService');

async function resolveConsultationId(ref, hospitalId) {
  if (!ref) return null;
  const clean = String(ref).trim();
  // Try ObjectId first
  if (mongoose.isValidObjectId(clean)) {
    const c = await Consultation.findOne({ _id: clean, hospitalId }).select('_id').lean();
    return c ? c._id : null;
  }
  // Otherwise try human consultationId like CON000001
  const c2 = await Consultation.findOne({ consultationId: clean, hospitalId }).select('_id').lean();
  return c2 ? c2._id : null;
}

// POST /api/payments/cash/initiate { consultationRef, amountInRupees }
async function initiateCashPayment(req, res, next) {
  try {
    const nurse = await User.findById(req.user.id);
    const hospitalId = nurse.hospitalId;
    const { consultationRef, amountInRupees } = req.body;

    if (!amountInRupees || Number(amountInRupees) <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const consId = await (async function resolve(ref) {
      // reuse your resolveConsultationId helper
      return await (await (async () => {
        if (!ref) return null;
        const clean = String(ref).trim();
        if (mongoose.isValidObjectId(clean)) {
          const c = await Consultation.findOne({ _id: clean, hospitalId }).select('_id').lean();
          return c ? c._id : null;
        }
        const c2 = await Consultation.findOne({ consultationId: clean, hospitalId }).select('_id').lean();
        return c2 ? c2._id : null;
      })());
    })(consultationRef);
    if (!consId) return res.status(404).json({ message: 'Consultation not found for this hospital' });

    const cons = await Consultation.findById(consId).select('patientId hospitalId').lean();

    const payment = await Payment.create({
      consultationId: consId,
      patientId: cons.patientId,
      hospitalId,
      amount: Number(amountInRupees),
      method: 'cash',
      status: 'pending',
      createdBy: nurse._id
    });

    await audit(req.user, 'cash_initiate', 'payment', payment._id, { consultationRef, amountInRupees }, req.ip);
    res.json({ paymentId: payment._id });
  } catch (err) { next(err); }
}

// POST /api/payments/cash/verify { paymentId, receiptNo? }
async function verifyCashPayment(req, res, next) {
  try {
    const nurse = await User.findById(req.user.id);
    const hospitalId = nurse.hospitalId;
    const { paymentId } = req.body;

    if (!mongoose.isValidObjectId(paymentId)) {
      return res.status(400).json({ message: 'Invalid paymentId' });
    }

    const payment = await Payment.findById(paymentId);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    if (String(payment.hospitalId) !== String(hospitalId)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    if (payment.status === 'completed') {
      return res.json({ message: 'Already verified', consultationId: payment.consultationId });
    }
    if (payment.method !== 'cash') {
      return res.status(400).json({ message: 'Not a cash payment' });
    }

    // mark payment as completed
    payment.status = 'completed';
    payment.paidAt = new Date();
    payment.verifiedBy = nurse._id;
    payment.verifiedAt = new Date();
    await payment.save();

    // flip consultation.payReady = true (doctor visibility)
    await Consultation.updateOne(
      { _id: payment.consultationId, hospitalId: payment.hospitalId },
      { $set: { payReady: true } }
    );

    await audit(req.user, 'cash_verify', 'payment', payment._id, {}, req.ip);
    // Send SMS to patient about cash payment (same as online flow)
    try {
      const consDoc = await Consultation.findById(payment.consultationId)
        .select('consultationId nurseId hospitalId patientId')
        .lean();

      const nurseDoc = await User.findById(consDoc?.nurseId).select('profile.firstName profile.lastName').lean();
      const hospitalDoc = await Hospital.findById(consDoc?.hospitalId).select('name').lean();

      const Patient = require('../models/Patient');
      let patientDoc = await Patient.findById(payment.patientId).select('personalInfo.phone').lean();
      if (!patientDoc && consDoc?.patientId) {
        patientDoc = await Patient.findById(consDoc.patientId).select('personalInfo.phone').lean();
      }

      const amountInRupees = payment.amount ?? 0;
      const consultShort = consDoc?.consultationId;
      const nurseName = (nurseDoc && (nurseDoc.profile?.firstName || nurseDoc.profile?.lastName))
        ? `${(nurseDoc.profile?.firstName || '')} ${(nurseDoc.profile?.lastName || '')}`.trim().split(/\s+/)[0]
        : 'Nurse';
      const hospName = (hospitalDoc?.name || 'Hospital').slice(0, 20);

      function normalizeE164Indian(raw) {
        const s = String(raw || '').trim();
        if (/^\+[1-9]\d{7,14}$/.test(s)) return s;
        const digits = s.replace(/[^\d]/g, '');
        if (/^[6-9]\d{9}$/.test(digits)) return `+91${digits}`;
        if (digits.startsWith('91') && digits.length === 12) return `+${digits}`;
        if (/^\d{10,15}$/.test(digits)) return `+${digits}`;
        return '';
      }

      try {
        const rawPhone = patientDoc?.personalInfo?.phone;
        const to = normalizeE164Indian(rawPhone);
        const sms = `Paid Rs${amountInRupees} for ${consultShort}. Nurse ${nurseName}, ${hospName} Hosp.`;
        if (to) {
          console.log('SMS: sending to', to, 'raw:', rawPhone, 'msg:', sms);
          const resp = await sendSMS(to, sms);
          console.log('SMS: queued sid', resp?.sid, 'status', resp?.status || 'n/a');
        } else {
          console.warn('SMS: patient has no valid phone; raw:', rawPhone);
        }
      } catch (e) {
        console.error('SMS error:', e?.message, e);
      }
    } catch (e) {
      console.error('SMS error (cash verify):', e?.message, e);
    }

    res.json({ message: 'Cash payment verified', consultationId: payment.consultationId });
  } catch (err) { next(err); }
}

// POST /api/payments/orders { consultationRef, amountInRupees }
async function createOrderForConsultation(req, res, next) {
  try {
    const nurse = await User.findById(req.user.id);
    const hospitalId = nurse.hospitalId;
    const { consultationRef, amountInRupees } = req.body;

    const consId = await resolveConsultationId(consultationRef, hospitalId);
    if (!consId) return res.status(404).json({ message: 'Consultation not found for this hospital' });

    const cons = await Consultation.findOne({ _id: consId }).lean();

    const amountPaise = Math.max(1, Math.round(Number(amountInRupees) * 100));
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: `CONS-${cons.consultationId}`
    });

    const payment = await Payment.create({
      consultationId: consId,
      patientId: cons.patientId,
      hospitalId,
      amount: amountPaise / 100,
      razorpayOrderId: order.id,
      status: 'pending'
    });

    await audit(req.user, 'create_payment_order', 'payment', payment._id, { orderId: order.id }, req.ip);
    res.json({ orderId: order.id, amount: amountPaise, currency: 'INR', paymentRecordId: payment._id });
  } catch (err) { next(err); }
}


// POST /api/payments/verify
// body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
async function verifyPaymentForConsultation(req, res, next) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expected !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid signature' });
    }

    const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
    if (!payment) return res.status(404).json({ message: 'Payment record not found' });

    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.status = 'completed';
    payment.paidAt = new Date();
    await payment.save();

    // Mark consultation as payReady
    await Consultation.updateOne(
  { _id: payment.consultationId, hospitalId: payment.hospitalId },
  { $set: { payReady: true } }
);
  
// Fetch docs for SMS
const consDoc = await Consultation.findById(payment.consultationId)
  .select('consultationId nurseId hospitalId patientId')
  .lean();

const nurse = await User.findById(consDoc.nurseId).select('profile.firstName profile.lastName').lean();
const hospital = await Hospital.findById(consDoc.hospitalId).select('name').lean();

// Patients are stored in Patient collection (not User)
const Patient = require('../models/Patient');

let patientDoc = await Patient.findById(payment.patientId)
  .select('personalInfo.phone')
  .lean();

// Fallback: if Payment.patientId was missing, try from consultation
if (!patientDoc && consDoc?.patientId) {
  patientDoc = await Patient.findById(consDoc.patientId)
    .select('personalInfo.phone')
    .lean();
}

// Build minimal ASCII message
const amountInRupees = payment.amount ?? 0;
const consultShort = consDoc.consultationId;
const nurseName = (nurse && (nurse.profile?.firstName || nurse.profile?.lastName))
  ? `${(nurse.profile?.firstName || '')} ${(nurse.profile?.lastName || '')}`.trim().split(/\s+/)[0]
  : 'Nurse';
const hospName = (hospital?.name || 'Hospital').slice(0, 20);

// Normalize to E.164 (India)
function normalizeE164Indian(raw) {
  const s = String(raw || '').trim();

  // Already valid E.164: + followed by 8–15 digits (no leading zero)
  if (/^\+[1-9]\d{7,14}$/.test(s)) return s;

  // Strip all non-digits
  const digits = s.replace(/[^\d]/g, '');

  // Indian 10-digit mobile -> +91XXXXXXXXXX
  if (/^[6-9]\d{9}$/.test(digits)) return `+91${digits}`;

  // 91 + 10 digits without '+'
  if (digits.startsWith('91') && digits.length === 12) return `+${digits}`;

  // Generic 10–15 digits -> add '+'
  if (/^\d{10,15}$/.test(digits)) return `+${digits}`;

  return '';
}


try {
  const rawPhone = patientDoc?.personalInfo?.phone;
  const to = normalizeE164Indian(rawPhone);
  const sms = `Paid Rs${amountInRupees} for ${consultShort}. Nurse ${nurseName}, ${hospName} Hosp.`;
  if (to) {
    console.log('SMS: sending to', to, 'raw:', rawPhone, 'msg:', sms);
    const resp = await sendSMS(to, sms);
    console.log('SMS: queued sid', resp?.sid, 'status', resp?.status || 'n/a');
  } else {
    console.warn('SMS: patient has no valid phone; raw:', rawPhone);
  }
} catch (e) {
  console.error('SMS error:', e?.message, e);
}




    await audit({ id: payment.patientId, role: 'system' }, 'verify_payment', 'payment', payment._id, {}, null);
    res.json({ message: 'Payment verified', consultationId: payment.consultationId });
  } catch (err) { next(err); }
}
// DEV ONLY: mark paid without signature
async function devMarkPaid(req, res, next) {
  try {
    const { consultationRef } = req.body;
    // dev endpoint has no auth context; if you want to restrict, require nurse auth and get hospitalId from req.user
    // For now, try both ways:
    const c = await Consultation.findOne({
      $or: [
        { _id: mongoose.isValidObjectId(consultationRef) ? consultationRef.trim() : undefined },
        { consultationId: String(consultationRef || '').trim() }
      ]
    }).lean();
    if (!c) return res.status(404).json({ message: 'Consultation not found' });

    const pay = await Payment.findOne({ consultationId: c._id });
    if (!pay) return res.status(404).json({ message: 'Payment not found, create order first' });

    pay.status = 'completed';
    pay.paidAt = new Date();
    await pay.save();

    await Consultation.updateOne({ _id: c._id }, { $set: { payReady: true } });
    res.json({ message: 'Marked paid (dev)', consultationId: c._id });
  } catch (err) { next(err); }
}


// module.exports.devMarkPaid = devMarkPaid;
module.exports = { createOrderForConsultation, verifyPaymentForConsultation,devMarkPaid ,   initiateCashPayment, verifyCashPayment};
