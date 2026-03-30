const express = require('express');
const router = express.Router();
const MindfulnessSession = require('../models/MindfulnessSession');

// Get session history for a user
router.get('/:userId', async (req, res) => {
  try {
    const sessions = await MindfulnessSession.find({ user: req.params.userId }).sort({ createdAt: -1 });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Log a new session
router.post('/log', async (req, res) => {
  try {
    const { userId, duration, moodBefore, moodAfter } = req.body;
    const newSession = new MindfulnessSession({
      user: userId,
      duration,
      moodBefore,
      moodAfter
    });
    await newSession.save();
    res.json(newSession);
  } catch (err) {
    res.status(500).json({ error: 'Failed to log session' });
  }
});

module.exports = router;
