const express = require('express');
const router = express.Router();
const EnergyLog = require('../models/EnergyLog');
const User = require('../models/User');
const { auth: authenticateToken, checkRole } = require('../middleware/auth');
const logger = require('../utils/logger');

// MoodSphere - Get mood clusters (mocked logic for grouping)
router.get('/mood-clusters/:userId', async (req, res) => {
  try {
    const logs = await EnergyLog.find({ user: req.params.userId });
    // Grouping by emotion
    const clusters = logs.reduce((acc, log) => {
      acc[log.emotion] = (acc[log.emotion] || 0) + 1;
      return acc;
    }, {});
    res.json(clusters);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch clusters' });
  }
});

// Energy Forecast - Get predicted levels based on historical averages
router.get('/forecast/:userId', authenticateToken, async (req, res) => {
  try {
    const logs = await EnergyLog.find({ userId: req.params.userId });
    
    // Aggregate average energy by hour of day
    const hourAverages = logs.reduce((acc, log) => {
      const hour = new Date(log.createdAt).getHours();
      if (!acc[hour]) acc[hour] = { sum: 0, count: 0 };
      acc[hour].sum += log.energyLevel;
      acc[hour].count++;
      return acc;
    }, {});

    const forecast = Array.from({ length: 24 }).map((_, i) => ({
      hour: i,
      predictedLevel: hourAverages[i] ? (hourAverages[i].sum / hourAverages[i].count) : 5.0
    }));

    res.json(forecast);
  } catch (err) {
    res.status(500).json({ error: 'Failed' });
  }
});

// Community Vibe - Real dynamic global energy average & mood distribution
router.get('/community-vibe', async (req, res) => {
  try {
    const [avgRes, countRes, moodAgg] = await Promise.all([
      EnergyLog.aggregate([{ $group: { _id: null, avg: { $sum: "$energyLevel" }, count: { $sum: 1 } } }]),
      User.estimatedDocumentCount(),
      EnergyLog.aggregate([{ $group: { _id: "$emotion", count: { $sum: 1 } } }])
    ]);
    
    const avg = avgRes[0] ? (avgRes[0].avg / avgRes[0].count) : 7.0;
    res.json({ 
      averageEnergy: avg.toFixed(1), 
      totalUsers: countRes,
      moods: moodAgg.map(m => ({ _id: m._id, count: m.count }))
    });
  } catch (err) {
    logger.error('Community Vibe Error:', err);
    res.status(500).json({ error: 'System busy' });
  }
});

// GET: Anonymized Organizational Wellness Trends (Admin/Manager Only)
router.get('/admin/org-trends', authenticateToken, checkRole(['Admin', 'Manager']), async (req, res) => {
  try {
    const orgId = req.user.organization;
    if (!orgId) return res.status(400).json({ message: "No organization associated" });

    const [moodAgg, memberCount] = await Promise.all([
      EnergyLog.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' },
        { $match: { 'user.organization': orgId } },
        { $group: { _id: '$emotion', count: { $sum: 1 } } }
      ]),
      User.countDocuments({ organization: orgId })
    ]);

    const formattedMoods = { Happy: 0, Calm: 0, Stressed: 0, Neutral: 0 };
    moodAgg.forEach(item => { if (formattedMoods.hasOwnProperty(item._id)) formattedMoods[item._id] = item.count; });

    // Calculate High-Risk (Burnout) Count - Average energy < 3 in last 48h
    const burnoutRes = await EnergyLog.aggregate([
      { $match: { createdAt: { $gt: new Date(Date.now() - 48*60*60*1000) } } },
      { $group: { _id: '$userId', avgEnergy: { $avg: '$energyLevel' } } },
      { $match: { avgEnergy: { $lt: 4 } } }
    ]);

    res.json({
      status: 'success',
      data: {
        moodTrends: formattedMoods,
        totalLogs: moodAgg.reduce((acc, curr) => acc + curr.count, 0),
        totalMembers: memberCount,
        burnoutAlerts: burnoutRes.length
      }
    });
  } catch (err) {
    logger.error('Org Analytics Error:', err);
    res.status(500).json({ message: "Analytics processing failed" });
  }
});

// GET: Export health history (JSON)
router.get('/export/:userId', authenticateToken, async (req, res) => {
  try {
    const logs = await EnergyLog.find({ user: req.params.userId }).sort({ createdAt: -1 });
    // In a real industry app, we would also export FitbitData and Mindfulness sessions.
    
    res.setHeader('Content-disposition', 'attachment; filename=emotional_energy_export.json');
    res.setHeader('Content-type', 'application/json');
    res.write(JSON.stringify(logs, null, 2));
    res.end();
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate export' });
  }
});

module.exports = router;
