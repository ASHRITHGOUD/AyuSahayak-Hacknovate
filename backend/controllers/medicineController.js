const Medicine = require('../models/Medicine');
const Inventory = require('../models/Inventory');

// POST /api/medicine
// body: { hospitalId, code?, name, form?, strength?, unitPrice, gstPct? }
async function createMedicine(req, res, next) {
  try {
    let { hospitalId, code, name, form, strength, unitPrice, gstPct } = req.body;
    // Infer from token if not provided
    hospitalId = hospitalId && hospitalId !== 'SELF' ? hospitalId : req.user?.hospitalId;
    if (!hospitalId || !name || unitPrice == null) {
      return res.status(400).json({ message: 'hospitalId, name, unitPrice are required' });
    }
    const doc = await Medicine.create({ hospitalId, code, name, form, strength, unitPrice, gstPct });
    res.status(201).json(doc);
  } catch (err) { next(err); }
}

// PATCH /api/medicine/:id
async function updateMedicine(req, res, next) {
  try {
    const { id } = req.params;
    const upd = await Medicine.findByIdAndUpdate(id, { $set: req.body }, { new: true });
    if (!upd) return res.status(404).json({ message: 'Not found' });
    res.json(upd);
  } catch (err) { next(err); }
}

// POST /api/inventory/set
// body: { hospitalId, medicineId, quantity }
async function setInventory(req, res, next) {
  try {
    let { hospitalId, medicineId, quantity } = req.body;
    hospitalId = hospitalId && hospitalId !== 'SELF' ? hospitalId : req.user?.hospitalId;
    if (!hospitalId || !medicineId) return res.status(400).json({ message: 'hospitalId, medicineId required' });
    const inv = await Inventory.findOneAndUpdate(
      { hospitalId, medicineId },
      { $set: { quantity: Number(quantity || 0) } },
      { upsert: true, new: true }
    );
    res.json(inv);
  } catch (err) { next(err); }
}

// GET /api/medicine/catalog?hospitalId=...
// Optional q filter by name
async function listCatalog(req, res, next) {
  try {
    let { hospitalId, q } = req.query;
    const inferredId = hospitalId && hospitalId !== 'SELF' ? hospitalId : req.user?.hospitalId;
    if (!inferredId) return res.status(400).json({ message: 'hospitalId required' });

    const filter = { hospitalId: inferredId, isActive: true };
    if (q) filter.name = { $regex: String(q), $options: 'i' };

    const items = await Medicine.find(filter)
      .select('code name form strength unitPrice gstPct')
      .sort({ name: 1 })
      .lean();

    res.json(items);
  } catch (err) { next(err); }
}

// GET /api/inventory/by-medicine?hospitalId=...
// returns { [medicineId]: quantity }
async function getInventoryMap(req, res, next) {
  try {
    let { hospitalId } = req.query;
    hospitalId = hospitalId && hospitalId !== 'SELF' ? hospitalId : req.user?.hospitalId;
    if (!hospitalId) return res.status(400).json({ message: 'hospitalId required' });

    const rows = await Inventory.find({ hospitalId }).select('medicineId quantity').lean();
    const map = {};
    for (const r of rows) map[String(r.medicineId)] = r.quantity || 0;
    res.json(map);
  } catch (err) { next(err); }
}

module.exports = { createMedicine, updateMedicine, setInventory, listCatalog, getInventoryMap };

