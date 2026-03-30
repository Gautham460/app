const express = require('express');
const router = express.Router();
const EnergyLog = require('../models/EnergyLog');

// Get all logs for a user
router.get('/:userId', async (req, res) => {
  try {
    const logs = await EnergyLog.find({ user: req.params.userId }).sort({ createdAt: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// Create a new energy log
router.post('/', async (req, res) => {
  try {
    const { userId, energyLevel, emotion, notes } = req.body;
    const newLog = new EnergyLog({
      user: userId,
      energyLevel,
      emotion,
      notes
    });
    const savedLog = await newLog.save();
    
    // Broadcast real-time update
    const io = req.app.get('socketio');
    io.emit('new_log', newLog);
    
    res.json(newLog);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create log' });
  }
});

module.exports = router;
