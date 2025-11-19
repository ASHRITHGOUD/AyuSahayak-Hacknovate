// backend/routes/paymentRoutes.js
const router = require('express').Router();
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
  createOrderForConsultation,
  verifyPaymentForConsultation,
  devMarkPaid,
  initiateCashPayment,
  verifyCashPayment

} = require('../controllers/paymentController');


// Nurse triggers order creation for a consultation
router.post('/orders', authenticate, authorize('nurse'), createOrderForConsultation);

// Razorpay callback (you can call from client after success, or configure webhook)
router.post('/verify', verifyPaymentForConsultation); // open endpoint; we verify signature
router.post('/dev/mark-paid', authenticate, authorize('nurse'), devMarkPaid);
router.post('/cash/initiate', authenticate, authorize('nurse'), initiateCashPayment);
router.post('/cash/verify', authenticate, authorize('nurse'), verifyCashPayment);

//aliases
// router.post('/create-order', authenticate, authorize('nurse'), createOrderForConsultation);
// router.post('/verify-payment', verifyPaymentForConsultation);

module.exports = router;
