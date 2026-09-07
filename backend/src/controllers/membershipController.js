const asyncHandler = require('express-async-handler');
const MembershipPlan = require('../models/MembershipPlan');

// @route GET /api/membership-plans
const getPlans = asyncHandler(async (req, res) => {
  const plans = await MembershipPlan.find({ company: req.user.company }).sort({ price: 1 });
  res.json({ success: true, count: plans.length, data: plans });
});

// @route POST /api/membership-plans
const createPlan = asyncHandler(async (req, res) => {
  const { name, description, durationInDays, price, features, category, maxSessionsPerWeek } =
    req.body;

  if (!name || !durationInDays || price === undefined) {
    res.status(400);
    throw new Error('name, durationInDays and price are required');
  }

  const plan = await MembershipPlan.create({
    company: req.user.company,
    name,
    description,
    durationInDays,
    price,
    features,
    category,
    maxSessionsPerWeek,
  });

  res.status(201).json({ success: true, data: plan });
});

// @route PUT /api/membership-plans/:id
const updatePlan = asyncHandler(async (req, res) => {
  const plan = await MembershipPlan.findOne({ _id: req.params.id, company: req.user.company });
  if (!plan) {
    res.status(404);
    throw new Error('Plan not found');
  }
  Object.assign(plan, req.body);
  await plan.save();
  res.json({ success: true, data: plan });
});

// @route DELETE /api/membership-plans/:id  (soft delete via isActive)
const deletePlan = asyncHandler(async (req, res) => {
  const plan = await MembershipPlan.findOneAndUpdate(
    { _id: req.params.id, company: req.user.company },
    { isActive: false },
    { new: true }
  );
  if (!plan) {
    res.status(404);
    throw new Error('Plan not found');
  }
  res.json({ success: true, message: 'Plan deactivated', data: plan });
});

module.exports = { getPlans, createPlan, updatePlan, deletePlan };
