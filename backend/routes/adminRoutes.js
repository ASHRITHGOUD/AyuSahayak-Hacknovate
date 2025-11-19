const router = require('express').Router();
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { createHospital, listHospitals, updateHospitalStatus,getAdminStats } = require('../controllers/adminController');

router.post('/hospitals', authenticate, authorize('admin'), createHospital);
router.get('/hospitals', authenticate, authorize('admin'), listHospitals);
router.patch('/hospitals/:id/status', authenticate, authorize('admin'), updateHospitalStatus);
router.get('/stats', authenticate, authorize('admin'), getAdminStats);

module.exports = router;
