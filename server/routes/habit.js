const express = require('express');
const router = express.Router();
const Habit = require('../models/Habit');

// Get all habits for a user
router.get('/:userId', async (req, res) => {
  try {
    const habits = await Habit.find({ user: req.params.userId });
    res.json(habits);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch habits' });
  }
});

// Add a new habit type
router.post('/add', async (req, res) => {
  try {
    const { userId, name } = req.body;
    const newHabit = new Habit({ user: userId, name });
    await newHabit.save();
    res.json(newHabit);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add habit' });
  }
});

// Log a habit occurrence
router.post('/log', async (req, res) => {
  try {
    const { habitId, value, energyAtTime } = req.body;
    const habit = await Habit.findById(habitId);
    habit.logs.push({ value, energyAtTime });
    await habit.save();
    res.json(habit);
  } catch (err) {
    res.status(500).json({ error: 'Failed to log habit' });
  }
});

module.exports = router;
