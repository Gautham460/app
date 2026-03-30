const express = require('express');
const router = express.Router();
const { 
  generateWellnessInsight, 
  generateEmpatheticMessage, 
  generateSocialReport, 
  generateEnergyForecast 
} = require('../services/gemini');
const EnergyLog = require('../models/EnergyLog');
const FitbitData = require('../models/FitbitData');

// Wellness Coach Chat Endpoint
router.post('/chat', async (req, res) => {
  try {
    const { userId, message, history } = req.body;
    
    // Fetch recent logs to provide context to Gemini
    const logs = await EnergyLog.find({ user: userId }).sort({ createdAt: -1 }).limit(5);
    const context = logs.map(l => `${l.emotion} energy ${l.energyLevel}/10 on ${l.createdAt.toDateString()}`).join(', ');

    const prompt = `User: ${message}\n\nRecent context: ${context}\n\nRespond as an empathetic wellness coach.`;
    const insight = await generateWellnessInsight(prompt);
    
    res.json({ response: insight });
  } catch (err) {
    res.status(500).json({ error: 'AI failed to respond' });
  }
});

// Empathy Trigger Endpoint (returns a message for a given state)
router.post('/empathize', async (req, res) => {
  try {
    const { mood, bpm, context } = req.body;
    const message = await generateEmpatheticMessage(mood, bpm, context);
    res.json({ message });
  } catch (err) {
    res.status(500).json({ error: 'AI failed to empathize' });
  }
});

// Generate complex social health report
router.get('/report/:userId', async (req, res) => {
  try {
    const logs = await EnergyLog.find({ user: req.params.userId }).sort({ createdAt: -1 }).limit(20);
    const fitbit = await FitbitData.findOne({ user: req.params.userId });
    const heartLogs = fitbit ? fitbit.heartRateLogs.slice(-50) : [];
    
    const report = await generateSocialReport(logs, heartLogs);
    res.json({ report });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// Generate 24h energy forecast
router.get('/forecast/:userId', async (req, res) => {
  try {
    const logs = await EnergyLog.find({ user: req.params.userId }).sort({ createdAt: -1 }).limit(10);
    const fitbit = await FitbitData.findOne({ user: req.params.userId });
    const heartLogs = fitbit ? fitbit.heartRateLogs.slice(-20) : [];

    const forecast = await generateEnergyForecast(logs, heartLogs);
    res.json(forecast);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate forecast' });
  }
});

module.exports = router;
