const jwt = require('jsonwebtoken');

const signAccessToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '15m' });

const signRefreshToken = (payload) =>
  jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' });

module.exports = { signAccessToken, signRefreshToken };
