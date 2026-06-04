const express = require('express');
const router = express.Router();
const { createGoal, getGoals, manageGoalFunds, deleteGoal } = require('../controllers/goalController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, createGoal)
  .get(protect, getGoals);

router.route('/:id/fund')
  .patch(protect, manageGoalFunds);

router.route('/:id')
  .delete(protect, deleteGoal);

module.exports = router;