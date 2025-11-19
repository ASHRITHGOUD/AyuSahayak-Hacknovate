// backend/routes/nurseRoutes.js
const router = require('express').Router();
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const upload  = require('../middleware/upload');
const { getNurseStats } = require('../controllers/nurseController');
const {
  createPatient,
  listPatients,
  startOrQueueConsultation,
  listConsultationsByNurse,
  startVideoForConsultation

} = require('../controllers/nurseController');

router.post('/patients', authenticate, authorize('nurse'), upload.array('photos', 6), createPatient);

router.get('/patients', authenticate, authorize('nurse'), listPatients);

router.post('/consultations', authenticate, authorize('nurse'), startOrQueueConsultation);
router.get('/consultations', authenticate, authorize('nurse'), listConsultationsByNurse);

router.post('/consultations/:id/video/start', authenticate, authorize('nurse'), startVideoForConsultation);
router.get('/stats', authenticate, authorize('nurse'), getNurseStats);
module.exports = router;
