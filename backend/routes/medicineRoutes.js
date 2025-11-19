const router = require('express').Router();
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const c = require('../controllers/medicineController');

router.post('/medicine', authenticate, authorize('hospital_owner','admin'), c.createMedicine);
router.patch('/medicine/:id', authenticate, authorize('hospital_owner','admin'), c.updateMedicine);
router.post('/inventory/set', authenticate, authorize('hospital_owner','admin'), c.setInventory);
router.get('/medicine/catalog', authenticate, authorize('doctor','nurse','hospital_owner','admin'), c.listCatalog);
router.get('/inventory/by-medicine', authenticate, authorize('hospital_owner','admin'),c.getInventoryMap);

module.exports = router;
