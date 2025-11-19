const User = require('../models/User');
const Hospital = require('../models/Hospital');
const bcrypt = require('bcryptjs');
const { signAccessToken, signRefreshToken } = require('../utils/generateToken');
const { audit } = require('../middleware/auditHook');

// Helper to set refresh cookie
function setRefreshCookie(res, token) {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/api/auth/refresh',
  });
}

// POST /api/auth/seed-admin (one-time)
async function seedAdmin(req, res) {
  const { email, password, firstName, lastName, phone } = req.body;
  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ message: 'Admin already exists' });

  const admin = await User.create({
    email,
    password,
    role: 'admin',
    profile: { firstName, lastName, phone },
  });

  await audit({ id: admin._id, role: 'admin' }, 'seed_admin', 'user', admin._id, {}, req.ip);
  res.status(201).json({ message: 'Admin created. Please login.' });
}

// POST /api/auth/login
async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !user.isActive) return res.status(401).json({ message: 'Invalid credentials' });

  const match = await user.comparePassword(password);
  if (!match) return res.status(401).json({ message: 'Invalid credentials' });

  const accessToken = signAccessToken({ id: user._id, role: user.role });
  const refreshToken = signRefreshToken({ id: user._id });
  user.refreshToken = refreshToken;
  await user.save();

  setRefreshCookie(res, refreshToken);
  await audit({ id: user._id, role: user.role }, 'login', 'user', user._id, {}, req.ip);

  res.json({
    accessToken,
    user: {
      id: user._id,
      role: user.role,
      hospitalId: user.hospitalId || null,
      email: user.email,
      profile: user.profile,
    },
  });
}

// POST /api/auth/refresh
const jwt = require('jsonwebtoken');
async function refresh(req, res) {
  const token = req.cookies?.refreshToken;
  if (!token) return res.status(401).json({ message: 'No refresh token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== token || !user.isActive) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const newAccess = signAccessToken({ id: user._id, role: user.role });
    const newRefresh = signRefreshToken({ id: user._id });
    user.refreshToken = newRefresh;
    await user.save();
    setRefreshCookie(res, newRefresh);

    res.json({ accessToken: newAccess });
  } catch (e) {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
}

// POST /api/auth/logout
async function logout(req, res) {
  const token = req.cookies?.refreshToken;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
      const user = await User.findById(decoded.id);
      if (user) {
        user.refreshToken = null;
        await user.save();
        await audit({ id: user._id, role: user.role }, 'logout', 'user', user._id, {}, req.ip);
      }
    } catch (e) {}
  }
  res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
  res.json({ message: 'Logged out' });
}

module.exports = { seedAdmin, login, refresh, logout };
