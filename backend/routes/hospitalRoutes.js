// backend/routes/hospitalRoutes.js
const router = require('express').Router();
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const upload = require('../middleware/upload');

const {
  createStaffUser,
  listStaffUsers,
  toggleUserActive,
  deleteStaffUser,
  getMyHospital
} = require('../controllers/hospitalController');
const { getOwnerDashboardStats } = require('../controllers/ownerDashboardController');

router.get('/owner/dashboard', authenticate, authorize('hospital_owner'), getOwnerDashboardStats);

// Owner creates nurse/doctor for their hospital
router.post(
  '/users',
  authenticate,
  authorize('hospital_owner'),
  upload.single('signature'),       // add this line
  createStaffUser
);


router.get('/me', authenticate, authorize('hospital_owner'), getMyHospital);
// Owner lists nurses/doctors in their hospital
router.get('/users', authenticate, authorize('hospital_owner'), listStaffUsers);

// Owner activates/suspends a staff account
router.patch('/users/:id/status', authenticate, authorize('hospital_owner'), toggleUserActive);

// Delete staff account
router.delete('/users/:id', authenticate, authorize('hospital_owner'), deleteStaffUser);


module.exports = router;
