// backend/models/Patient.js
const mongoose = require('mongoose');
const Counter = require('./Counter');

// ---------------------- Rural Assessment Schema ----------------------
const ruralAssessmentSchema = new mongoose.Schema({
  case_id: { type: String, required: true },
  symptoms: [String],
  classification: { type: String, enum: ['low', 'medium', 'high'] },
  summary: { type: Object },     // AI generated summary
  specialists: [String],
  escalation_reason: String,
  timestamp: { type: Date, default: Date.now }
});

// ---------------------- Main Patient Schema ----------------------
const patientSchema = new mongoose.Schema(
  {
    patientId: { type: String, required: true, unique: true },

    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: true
    },

    personalInfo: {
      firstName: { type: String, required: true },
      lastName:  { type: String, required: true },
      age:       { type: Number, required: true },
      gender:    { type: String, enum: ['male','female','other'], required: true },
      email:     String,
      phone:     { type: String, required: true },
      height:    Number,
      weight:    Number
    },

    conditionType: {
      type: String,
      enum: ['skin','wound','other'],
      default: 'other'
    },

    photos: [
      {
        url: String,
        publicId: String,
        uploadedAt: Date
      }
    ],

    registeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    // ⭐ AI RESULTS (from your first schema)
    skinCareAI: {
      type: Object,
      default: null
    },

    woundCareAI: {
      type: Object,
      default: null
    },

    // ⭐ RuralCare multi-case AI assessment
    ruralCareAssessment: [ruralAssessmentSchema]
  },
  { timestamps: true }
);

// ---------------------- Auto-generate patientId ----------------------
patientSchema.pre('validate', async function(next) {
  if (this.patientId) return next();

  try {
    const c = await Counter.findOneAndUpdate(
      { key: 'patient' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    this.patientId = `PAT${String(c.seq).padStart(6, '0')}`;
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('Patient', patientSchema);
