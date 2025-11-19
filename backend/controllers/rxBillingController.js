const mongoose = require('mongoose');
const Medicine = require('../models/Medicine');
const Inventory = require('../models/Inventory');
const RxCharge = require('../models/RxCharge');
const Consultation = require('../models/Consultation');
const Prescription = require('../models/Prescription');
const Payment = require('../models/Payment');
const Patient = require('../models/Patient');
const User = require('../models/User');
const Hospital = require('../models/Hospital');
const { audit } = require('../middleware/auditHook');
const razorpay = require('../config/razorpay');
const crypto = require('crypto');
const { sendSMS } = require('../utils/sms/smsService');

function toMapByKey(arr, key) {
  const m = new Map();
  for (const x of arr) m.set(String(x[key]), x);
  return m;
}
async function resolveConsultId(raw, hospitalId, session = null) {
  const input = String(raw || '').trim();
  const query = mongoose.isValidObjectId(input)
    ? { _id: input, hospitalId }
    : { consultationId: input, hospitalId };
  const leanOpt = session ? { session } : undefined;
  const cons = await Consultation.findOne(query).select('_id patientId hospitalId').lean(leanOpt);
  return cons; // null if not found
}


// POST /api/rx/:consultationId/charge/build
async function buildCharge(req, res, next) {
  try {
    const hospitalId = req.user.hospitalId;
    const { consultationId: paramId } = req.params;

    const cons = await resolveConsultId(paramId, hospitalId);
    if (!cons) return res.status(404).json({ message: 'Consultation not found' });

    const rx = await Prescription.findOne({ consultationId: cons._id }).lean();
    if (!rx) return res.status(404).json({ message: 'Prescription not found' });

    try { console.log('buildCharge: start', { consultationId: cons._id.toString(), meds: Array.isArray(rx.medications) ? rx.medications.length : 0 }); } catch (e) {}

    const meds = Array.isArray(rx.medications) ? rx.medications : [];
    const catalog = await Medicine.find({ hospitalId, isActive: true }).lean();
    const byName = new Map(catalog.map(c => [c.name.toLowerCase(), c]));
    const byCode = new Map(catalog.filter(c=>c.code).map(c => [c.code.toLowerCase(), c]));

    const items = [];
    for (const m of meds) {
      const qty = Number(m.qty ?? m.quantity ?? 0);
      if (!Number.isFinite(qty) || qty <= 0) continue;

      const codeKey = m.code ? String(m.code).toLowerCase() : '';
      const nameKey = m.name ? String(m.name).toLowerCase() : '';
      let cat = null;
      if (codeKey && byCode.has(codeKey)) cat = byCode.get(codeKey);
      else if (nameKey && byName.has(nameKey)) cat = byName.get(nameKey);

      if (!cat) {
        return res.status(400).json({ message: `Medicine not in catalog: ${m.name || m.code}` });
      }
      const unitPrice = Number(cat.unitPrice || 0);
      items.push({
        medicineId: cat._id,
        name: cat.name,
        qty,
        unitPrice,
        lineTotal: unitPrice * qty
      });
    }

    const subtotal = items.reduce((s, it) => s + it.lineTotal, 0);
    const taxTotal = 0;
    const grandTotal = subtotal + taxTotal;

    await RxCharge.updateOne(
      { consultationId: cons._id, hospitalId },
      {
        $set: {
          consultationId: cons._id,
          prescriptionId: rx._id,
          hospitalId,
          patientId: cons.patientId,
          items,
          subtotal,
          taxTotal,
          grandTotal,
          status: 'pending'
        }
      },
      { upsert: true }
    );

    await Prescription.updateOne({ _id: rx._id }, { $set: { lockedForNurse: true } });
    await audit(req.user, 'rx_build_charge', 'consultation', cons._id, { items: items.length, total: grandTotal }, req.ip);
    res.json({ subtotal, taxTotal, grandTotal, items });
  } catch (err) { next(err); }
}

// GET /api/rx/:consultationId/charge
async function getCharge(req, res, next) {
  try {
    const input = String(req.params.consultationId || '').trim();
    const hospitalId = req.user.hospitalId;

    // Resolve input to the real consultation _id (ObjectId)
    let cons;
    if (mongoose.isValidObjectId(input)) {
      cons = await Consultation.findOne({ _id: input, hospitalId }).select('_id').lean();
    } else {
      cons = await Consultation.findOne({ consultationId: input, hospitalId }).select('_id').lean();
    }
    if (!cons) return res.status(404).json({ message: 'Consultation not found' });

    // Now query RxCharge with the real ObjectId
    const ch = await RxCharge.findOne({ consultationId: cons._id, hospitalId }).lean();
    if (!ch) return res.status(404).json({ message: 'Charge not found' });

    res.json(ch);
  } catch (err) { next(err); }
}

// POST /api/rx/:consultationId/pay/razorpay/create-order
async function rxCreateOrder(req, res, next) {
  try {
    const { consultationId: paramId } = req.params;
    const hospitalId = req.user.hospitalId;
    const nurseId = req.user.id;

    // resolve human ref
    const cons = await resolveConsultId(paramId, hospitalId);
    if (!cons) return res.status(404).json({ message: 'Consultation not found' });

    const ch = await RxCharge.findOne({ consultationId: cons._id, hospitalId, status: 'pending' }).lean();
    if (!ch) return res.status(404).json({ message: 'Pending charge not found' });
    const amountPaise = Math.max(1, Math.round(Number(ch.grandTotal) * 100));
    const order = await razorpay.orders.create({
      amount: amountPaise, currency: 'INR', receipt: `RX-${paramId}`
    });

    const p = await Payment.create({
      consultationId: ch.consultationId,
      patientId: ch.patientId,
      hospitalId,
      amount: ch.grandTotal,
      kind: 'rx',
      method: 'razorpay',
      status: 'pending',
      razorpayOrderId: order.id,
      createdBy: nurseId
    });

    res.json({ orderId: order.id, amount: amountPaise, currency: 'INR', paymentRecordId: p._id });
  } catch (err) { next(err); }
}

// POST /api/rx/pay/razorpay/verify
async function rxVerifyOrder(req, res, next) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
    if (expected !== razorpay_signature) return res.status(400).json({ message: 'Invalid signature' });

    // No transaction/session logic for standalone MongoDB
    const pay = await Payment.findOne({ razorpayOrderId: razorpay_order_id, kind: 'rx' });
    if (!pay) return res.status(404).json({ message: 'Payment not found' });

    pay.razorpayPaymentId = razorpay_payment_id;
    pay.razorpaySignature = razorpay_signature;
    pay.status = 'completed';
    pay.paidAt = new Date();
    pay.verifiedBy = req.user?.id || pay.createdBy;
    pay.verifiedAt = new Date();
    await pay.save();

    const ch = await RxCharge.findOne({ consultationId: pay.consultationId });
    if (!ch) throw new Error('Charge not found');

    // decrement stock
    for (const it of ch.items) {
      const inv = await Inventory.findOne({ hospitalId: ch.hospitalId, medicineId: it.medicineId });
      if (!inv || inv.quantity < it.qty) throw new Error(`Insufficient stock for ${it.name}`);
      inv.quantity -= it.qty;
      await inv.save();
    }

    ch.status = 'paid';
    ch.paymentId = pay._id;
    ch.paidAt = new Date();
    await ch.save();

    // unlock prescription
    await Prescription.updateOne({ _id: ch.prescriptionId }, { $set: { lockedForNurse: false } });

    // Send SMS to patient about RX payment (online)
    try {
      const consDoc = await Consultation.findById(ch.consultationId).select('consultationId nurseId hospitalId patientId').lean();
      const nurseDoc = await User.findById(req.user?.id || consDoc?.nurseId).select('profile.firstName profile.lastName').lean();
      const hospitalDoc = await Hospital.findById(ch.hospitalId).select('name').lean();

      let patientDoc = await Patient.findById(ch.patientId).select('personalInfo.phone').lean();
      if (!patientDoc && consDoc?.patientId) {
        patientDoc = await Patient.findById(consDoc.patientId).select('personalInfo.phone').lean();
      }

      const amountInRupees = ch.grandTotal ?? pay.amount ?? 0;
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
        const sms = `Paid Rs${amountInRupees} for medicines ${consultShort ? `for ${consultShort}` : ''}. Nurse ${nurseName}, ${hospName} Hosp.`;
        if (to) {
          console.log('SMS: sending to', to, 'raw:', rawPhone, 'msg:', sms);
          const resp = await sendSMS(to, sms);
          console.log('SMS: queued sid', resp?.sid, 'status', resp?.status || 'n/a');
        } else {
          console.warn('SMS: patient has no valid phone; raw:', rawPhone);
        }
      } catch (e) {
        console.error('SMS error (rx verify):', e?.message, e);
      }
    } catch (e) {
      console.error('SMS error (rx verify outer):', e?.message, e);
    }

    res.json({ message: 'Prescription unlocked' });
  } catch (err) { next(err); }
}

// POST /api/rx/:consultationId/pay/cash/initiate
async function rxCashInitiate(req, res, next) {
  try {
    const { consultationId: paramId } = req.params;
    const hospitalId = req.user.hospitalId;
    const nurseId = req.user.id;

    const cons = await resolveConsultId(paramId, hospitalId);
    if (!cons) return res.status(404).json({ message: 'Consultation not found' });

    const ch = await RxCharge.findOne({ consultationId: cons._id, hospitalId, status: 'pending' }).lean();
    if (!ch) return res.status(404).json({ message: 'Pending charge not found' });
    const pay = await Payment.create({
      consultationId: ch.consultationId,
      patientId: ch.patientId,
      hospitalId,
      amount: ch.grandTotal,
      kind: 'rx',
      method: 'cash',
      status: 'pending',
      createdBy: nurseId
    });
    res.json({ paymentId: pay._id });
  } catch (err) { next(err); }
}

// POST /api/rx/pay/cash/verify { paymentId }
async function rxCashVerify(req, res, next) {
  try {
    const { paymentId } = req.body;
    // No transaction/session logic for standalone MongoDB
    const pay = await Payment.findById(paymentId);
    if (!pay || pay.kind !== 'rx') return res.status(404).json({ message: 'Payment not found' });

    const ch = await RxCharge.findOne({ consultationId: pay.consultationId });
    if (!ch || ch.status !== 'pending') return res.status(400).json({ message: 'Charge not pending' });

    // decrement stock
    for (const it of ch.items) {
      const inv = await Inventory.findOne({ hospitalId: ch.hospitalId, medicineId: it.medicineId });
      if (!inv || inv.quantity < it.qty) throw new Error(`Insufficient stock for ${it.name}`);
      inv.quantity -= it.qty;
      await inv.save();
    }

    pay.status = 'completed';
    pay.paidAt = new Date();
    pay.verifiedBy = req.user.id;
    pay.verifiedAt = new Date();
    await pay.save();

    ch.status = 'paid';
    ch.paymentId = pay._id;
    ch.paidAt = new Date();
    await ch.save();

    await Prescription.updateOne({ _id: ch.prescriptionId }, { $set: { lockedForNurse: false } });

    // Send SMS to patient about RX payment (cash)
    try {
      const consDoc = await Consultation.findById(ch.consultationId).select('consultationId nurseId hospitalId patientId').lean();
      const nurseDoc = await User.findById(req.user?.id || ch.createdBy).select('profile.firstName profile.lastName').lean();
      const hospitalDoc = await Hospital.findById(ch.hospitalId).select('name').lean();

      let patientDoc = await Patient.findById(ch.patientId).select('personalInfo.phone').lean();
      if (!patientDoc && consDoc?.patientId) {
        patientDoc = await Patient.findById(consDoc.patientId).select('personalInfo.phone').lean();
      }

      const amountInRupees = ch.grandTotal ?? pay.amount ?? 0;
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
        const sms = `Paid Rs${amountInRupees} for medicines ${consultShort ? `for ${consultShort}` : ''}. Nurse ${nurseName}, ${hospName} Hosp.`;
        if (to) {
          console.log('SMS: sending to', to, 'raw:', rawPhone, 'msg:', sms);
          const resp = await sendSMS(to, sms);
          console.log('SMS: queued sid', resp?.sid, 'status', resp?.status || 'n/a');
        } else {
          console.warn('SMS: patient has no valid phone; raw:', rawPhone);
        }
      } catch (e) {
        console.error('SMS error (rx cash verify):', e?.message, e);
      }
    } catch (e) {
      console.error('SMS error (rx cash outer):', e?.message, e);
    }

    res.json({ message: 'Prescription unlocked' });
  } catch (err) { next(err); }
}

module.exports = {
  buildCharge, getCharge,
  rxCreateOrder, rxVerifyOrder,
  rxCashInitiate, rxCashVerify
};
