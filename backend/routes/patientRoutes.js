const router = require('express').Router();
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { getPatientByRef, updatePatientById } = require('../controllers/patientController');

// Nurse can fetch and edit
router.get('/:ref', authenticate, authorize('nurse'), getPatientByRef);     // ref can be PAT000123 or Mongo _id
router.put('/:id', authenticate, authorize('nurse'), updatePatientById);    // id is Mongo _id

module.exports = router;
