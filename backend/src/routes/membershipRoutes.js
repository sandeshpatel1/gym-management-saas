const express = require('express');
const { getPlans, createPlan, updatePlan, deletePlan } = require('../controllers/membershipController');
const { protect, authorize, requireCompanyScope } = require('../middleware/auth');

const router = express.Router();

router.use(protect, requireCompanyScope);

router.get('/', getPlans);
router.post('/', authorize('owner'), createPlan);
router.put('/:id', authorize('owner'), updatePlan);
router.delete('/:id', authorize('owner'), deletePlan);

module.exports = router;
