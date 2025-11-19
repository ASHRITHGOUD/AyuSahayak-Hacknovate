const mongoose = require('mongoose');
const User = require('../models/User');
const Consultation = require('../models/Consultation');
const Patient = require('../models/Patient');
const Payment = require('../models/Payment');
const Inventory = require('../models/Inventory');
const Medicine = require('../models/Medicine');

const LOW_STOCK_THRESHOLD = 5;

async function getOwnerDashboardStats(req, res, next) {
  try {
    const hospitalId = req.user.hospitalId;

    // Counts
    const [activeStaff, totalPatients, totalConsultations, revenue] = await Promise.all([
      User.countDocuments({ hospitalId, isActive: true, role: { $in: ['doctor', 'nurse'] } }),
      Patient.countDocuments({ hospitalId }),
      Consultation.countDocuments({ hospitalId }),
      Payment.aggregate([
        { $match: { hospitalId: hospitalId, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]).then(r => r[0]?.total || 0)
    ]);

    // Inventory stats
    // Find all inventory with 0 stock (out of stock)
    const outStock = await Inventory.aggregate([
      { $match: { hospitalId: hospitalId, quantity: { $eq: 0 } } },
      { $lookup: { from: 'medicines', localField: 'medicineId', foreignField: '_id', as: 'medinfo' }},
      { $unwind: '$medinfo' },
      { $project: { code: '$medinfo.code', name: '$medinfo.name', form: '$medinfo.form', strength: '$medinfo.strength' } }
    ]);

    // Inventory with 1 <= qty <= LOW_STOCK_THRESHOLD (low stock)
    const lowStock = await Inventory.aggregate([
      { $match: { hospitalId: hospitalId, quantity: { $gt: 0, $lte: LOW_STOCK_THRESHOLD } } },
      { $lookup: { from: 'medicines', localField: 'medicineId', foreignField: '_id', as: 'medinfo' }},
      { $unwind: '$medinfo' },
      { $project: { code: '$medinfo.code', name: '$medinfo.name', form: '$medinfo.form', strength: '$medinfo.strength', quantity: 1 } }
    ]);

    res.json({
      activeStaff,
      totalPatients,
      totalConsultations,
      revenue,
      outOfStock: outStock,
      lowStock
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getOwnerDashboardStats };
