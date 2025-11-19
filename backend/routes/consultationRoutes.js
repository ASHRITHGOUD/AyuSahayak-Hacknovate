const router = require('express').Router();
const { authenticate } = require('../middleware/authMiddleware');
const { getVideoRoom } = require('../controllers/videoController');

// Allow nurse or doctor; auth only checks token
router.get('/video-room/:ref', authenticate, getVideoRoom);
module.exports = router;
