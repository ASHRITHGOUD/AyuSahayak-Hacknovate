const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).lean();
    if (!user || !user.isActive) return res.status(401).json({ message: 'Unauthorized' });

    req.user = { id: user._id, role: user.role, hospitalId: user.hospitalId || null };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

module.exports = { authenticate };
