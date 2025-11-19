// backend/routes/nurseUploadRoutes.js
const router = require('express').Router();
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const upload  = require('../middleware/upload');
const { addConsultationImages } = require('../controllers/nurseUploadController');

router.post(
  '/consultations/:id/images',
  authenticate,
  authorize('nurse'),
  upload.array('files', 6),
  addConsultationImages
);

module.exports = router;
