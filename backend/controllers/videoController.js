const mongoose = require('mongoose');
const Consultation = require('../models/Consultation');

exports.getVideoRoom = async (req, res, next) => {
  try {
    const { ref } = req.params;
    const hospitalId = req.user.hospitalId;
    const byId = mongoose.isValidObjectId(ref)
      ? await Consultation.findOne({ _id: ref, hospitalId }).select('consultationId video').lean()
      : null;
    const cons = byId || await Consultation.findOne({ consultationId: ref, hospitalId }).select('consultationId video').lean();
    if (!cons) return res.status(404).json({ message: 'Consultation not found' });
    res.json({
      consultationId: cons.consultationId,
      video: cons.video || { enabled: false, room: null }
    });
  } catch (e) { next(e); }
};
