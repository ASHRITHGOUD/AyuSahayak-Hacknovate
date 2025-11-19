// backend/routes/doctorRoutes.js
const router = require('express').Router();
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
  listQueue,
  acceptConsultation,
  declineConsultation,
  completeConsultation,
  listInProgress,
  getConsultationDetails
} = require('../controllers/doctorController');
const { getDoctorDashboardStats } = require('../controllers/doctorDashboardController');


router.get('/consultations', authenticate, authorize('doctor'), listQueue);
router.patch('/consultations/:id/accept', authenticate, authorize('doctor'), acceptConsultation);


router.patch('/consultations/:id/decline', authenticate, authorize('doctor'), declineConsultation);
router.get('/consultations/in-progress', authenticate, authorize('doctor'), listInProgress);
router.patch('/consultations/:id/complete', authenticate, authorize('doctor'), completeConsultation);
router.get('/consultations/:id/details', authenticate, authorize('doctor'), getConsultationDetails);

router.get('/dashboard/stats', authenticate, authorize('doctor'), getDoctorDashboardStats);

module.exports = router;

