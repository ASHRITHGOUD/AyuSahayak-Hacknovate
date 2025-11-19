const router = require('express').Router();
const { seedAdmin, login, refresh, logout } = require('../controllers/authController');

router.post('/seed-admin', seedAdmin);   // one-time use
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);

module.exports = router;
