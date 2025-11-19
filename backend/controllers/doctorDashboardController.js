const mongoose = require('mongoose');
const Consultation = require('../models/Consultation');
const Patient = require('../models/Patient');

async function getDoctorDashboardStats(req, res, next) {
  try {
    const doctorId = req.user.id;
    const doctor = await require('../models/User').findById(doctorId).select('hospitalId').lean();
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

    const hospitalId = doctor.hospitalId;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      inQueue,
      inProgress,
      completedToday,
      totalConsultations,
      declined,
      totalPatients
    ] = await Promise.all([
      Consultation.countDocuments({ hospitalId, status: 'in_queue' }),
      Consultation.countDocuments({ hospitalId, status: 'in_progress', doctorId }),
      Consultation.countDocuments({
        hospitalId,
        doctorId,
        status: 'completed',
        completedAt: { $gte: startOfToday }
      }),
      Consultation.countDocuments({ hospitalId, doctorId }),
      Consultation.countDocuments({ hospitalId, doctorId, status: 'declined' }),
      Patient.countDocuments({ hospitalId })
    ]);

    res.json({
      inQueue,
      inProgress,
      completedToday,
      totalConsultations,
      declined,
      totalPatients
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getDoctorDashboardStats };
