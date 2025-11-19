const router = require('express').Router();
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const c = require('../controllers/rxBillingController');

// doctor builds/refreshes charge from Rx
router.post('/:consultationId/charge/build', authenticate, authorize('doctor'), c.buildCharge);

// nurse/doctor can read the charge; nurse pays to unlock
router.get('/:consultationId/charge', authenticate, authorize('doctor','nurse'), c.getCharge);

// payments – nurse
router.post('/:consultationId/pay/razorpay/create-order', authenticate, authorize('nurse'), c.rxCreateOrder);
router.post('/pay/razorpay/verify', authenticate, authorize('nurse','hospital_owner','admin'), c.rxVerifyOrder);

router.post('/:consultationId/pay/cash/initiate', authenticate, authorize('nurse'), c.rxCashInitiate);
router.post('/pay/cash/verify', authenticate, authorize('nurse','hospital_owner','admin'), c.rxCashVerify);

module.exports = router;
