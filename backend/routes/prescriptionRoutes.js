const router = require('express').Router();
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { createPrescription, getByConsultation } = require('../controllers/prescriptionController');

router.post('/', authenticate, authorize('doctor'), createPrescription);
router.get('/by-consultation/:ref', authenticate, getByConsultation);

module.exports = router;
