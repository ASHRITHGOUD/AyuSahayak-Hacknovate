const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['admin', 'hospital_owner', 'doctor', 'nurse'], required: true },
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: function () {
      return this.role === 'doctor' || this.role === 'nurse';
    }
  },

  // Profile is already present; keep as-is
  profile: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phone: { type: String, required: true },
    qualification: String,
    specialization: String
  },

  // Doctor-specific fields: do NOT conflict with existing profile fields
  doctor: {
    regNo: String,
    signature: {
      url: String,      // https URL of JPG signature
      publicId: String  // Cloudinary public id or storage key (optional)
    }
  },

  isActive: { type: Boolean, default: true },
  refreshToken: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);
