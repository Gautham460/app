const express = require('express');
const router = express.Router();
const EnergyLog = require('../models/EnergyLog');
const FitbitData = require('../models/FitbitData');

// Get aggregated anonymous wellbeing data
router.get('/pulse', async (req, res) => {
  try {
    // 1. Average Energy Pulse (past 24h)
    const averageEnergy = await EnergyLog.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } },
      { $group: { _id: null, avg: { $avg: "$energyLevel" } } }
    ]);

    // 2. Mood Distribution
    const moodDistribution = await EnergyLog.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } },
      { $group: { _id: "$emotion", count: { $sum: 1 } } }
    ]);

    // 3. Aggregate Community BPM (Average the latest bpm logs across all users)
    const communityBpm = await FitbitData.aggregate([
      { $unwind: "$heartRateLogs" },
      { $group: { _id: null, avg: { $avg: "$heartRateLogs.value" } } }
    ]);

    res.json({
      energyPulse: averageEnergy[0]?.avg || 7.5,
      moods: moodDistribution,
      communityPulse: communityBpm[0]?.avg || 72
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pulse data' });
  }
});

module.exports = router;
