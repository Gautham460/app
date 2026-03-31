const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const { generateWellnessInsight } = require('../services/gemini');
const User = require('../models/User');

// Configure Gmail SMTP transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Emotion metadata for styling emails
const emotionMeta = {
  Happy:     { emoji: '😊', color: '#10b981', advice: 'leverage this peak state' },
  Calm:      { emoji: '😌', color: '#3b82f6', advice: 'ideal for deep focused work' },
  Stressed:  { emoji: '😰', color: '#ef4444', advice: 'take a mindfulness break now' },
  Exhausted: { emoji: '😴', color: '#8b5cf6', advice: 'rest and recharge immediately' },
};

/**
 * POST /api/notify/emotion-email
 * Body: { userId, email, emotion, bpm, energyLevel }
 * Sends an emotion-triggered email with AI insight + to-do list
 */
router.post('/emotion-email', async (req, res) => {
  try {
    const { userId, email, emotion, bpm, energyLevel } = req.body;
    if (!email || !emotion) {
      return res.status(400).json({ error: 'email and emotion are required' });
    }

    const meta = emotionMeta[emotion] || emotionMeta['Calm'];

    // Generate AI insight + to-do list from Gemini
    const aiPrompt = `You are an empathetic wellness coach for "Emotional Energy OS". 
The user's current emotional state is: "${emotion}" with a heart rate of ${bpm} BPM and energy level ${energyLevel}/10.
1. Write one warm, empathetic sentence acknowledging their state (max 80 chars).
2. Generate exactly 3 specific actionable to-do items tailored to this emotional state.
Format your response EXACTLY as:
INSIGHT: <your insight sentence>
TODO1: <action 1>
TODO2: <action 2>
TODO3: <action 3>`;

    const aiResponse = await generateWellnessInsight(aiPrompt);

    // Parse AI response
    const insightMatch = aiResponse.match(/INSIGHT:\s*(.+)/);
    const todo1Match   = aiResponse.match(/TODO1:\s*(.+)/);
    const todo2Match   = aiResponse.match(/TODO2:\s*(.+)/);
    const todo3Match   = aiResponse.match(/TODO3:\s*(.+)/);

    const insight = insightMatch ? insightMatch[1].trim() : `Your ${emotion} state has been detected. Take care of yourself!`;
    const todos = [
      todo1Match ? todo1Match[1].trim() : 'Take 5 deep breaths',
      todo2Match ? todo2Match[1].trim() : 'Drink a glass of water',
      todo3Match ? todo3Match[1].trim() : 'Step away from your screen for 5 minutes',
    ];

    const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    // Build beautiful HTML email
    const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:16px;overflow:hidden;">
        
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,${meta.color},#1e293b);padding:32px;text-align:center;">
          <div style="font-size:64px;margin-bottom:8px;">${meta.emoji}</div>
          <h1 style="color:#fff;margin:0;font-size:28px;font-weight:800;">Emotional Energy OS</h1>
          <p style="color:rgba(255,255,255,0.7);margin:8px 0 0;">Wellness Alert • ${now}</p>
        </td></tr>

        <!-- Emotion Banner -->
        <tr><td style="padding:24px 32px 0;">
          <div style="background:${meta.color}22;border:1px solid ${meta.color}55;border-radius:12px;padding:20px;text-align:center;">
            <p style="color:rgba(255,255,255,0.6);margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:2px;">Current Emotional State</p>
            <h2 style="color:${meta.color};margin:0;font-size:36px;font-weight:900;">${emotion} ${meta.emoji}</h2>
            <p style="color:rgba(255,255,255,0.5);margin:8px 0 0;font-size:13px;">Heart Rate: <strong style="color:#fff;">${bpm} BPM</strong> &nbsp;|&nbsp; Energy: <strong style="color:#fff;">${energyLevel}/10</strong></p>
          </div>
        </td></tr>

        <!-- AI Insight -->
        <tr><td style="padding:24px 32px 0;">
          <div style="border-left:4px solid ${meta.color};padding:16px 20px;background:#0f172a;border-radius:0 8px 8px 0;">
            <p style="color:${meta.color};margin:0 0 6px;font-size:11px;text-transform:uppercase;font-weight:700;">AI Wellness Coach</p>
            <p style="color:#e2e8f0;margin:0;font-size:15px;line-height:1.6;">"${insight}"</p>
          </div>
        </td></tr>

        <!-- To-Do List -->
        <tr><td style="padding:24px 32px 0;">
          <p style="color:rgba(255,255,255,0.6);margin:0 0 12px;font-size:12px;text-transform:uppercase;letter-spacing:2px;">Your Personalized Action Plan</p>
          ${todos.map((todo, i) => `
          <div style="display:flex;align-items:flex-start;margin-bottom:12px;background:#0f172a;border-radius:10px;padding:14px 16px;">
            <div style="width:28px;height:28px;background:${meta.color};border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;font-size:13px;flex-shrink:0;margin-right:12px;">${i+1}</div>
            <p style="color:#e2e8f0;margin:0;font-size:14px;line-height:1.5;padding-top:4px;">${todo}</p>
          </div>`).join('')}
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:32px;text-align:center;">
          <p style="color:rgba(255,255,255,0.3);margin:0;font-size:12px;">
            Sent by Emotional Energy OS • Powered by Gemini AI<br>
            <a href="https://emotional-energy-os.onrender.com" style="color:#6366f1;">Visit Dashboard</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    // Send the email
    await transporter.sendMail({
      from: `"Emotional Energy OS" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `${meta.emoji} ${emotion} State Detected — Your Wellness Action Plan`,
      html: htmlBody,
    });

    console.log(`📧 Emotion email sent to ${email} for state: ${emotion}`);
    res.json({ success: true, message: `Email sent to ${email}` });

  } catch (err) {
    console.error('Email notification error:', err);
    res.status(500).json({ error: 'Failed to send notification email', detail: err.message });
  }
});

/**
 * POST /api/notify/todo-email
 * Sends a standalone to-do list email based on energy level
 */
router.post('/todo-email', async (req, res) => {
  try {
    const { email, energyLevel, emotion } = req.body;

    const prompt = `Generate a prioritized to-do list of 5 tasks for someone feeling "${emotion}" with energy level ${energyLevel}/10.
Format each task as: TASK: <task description>
Make tasks specific, achievable in 30 mins or less, and suited to this energy level.`;

    const aiResponse = await generateWellnessInsight(prompt);
    const tasks = [...aiResponse.matchAll(/TASK:\s*(.+)/g)].map(m => m[1].trim());

    const htmlBody = `
<body style="background:#0f172a;font-family:Arial,sans-serif;padding:40px;">
  <h2 style="color:#a78bfa;">📋 Your Energy-Optimized To-Do List</h2>
  <p style="color:#94a3b8;">Based on your ${emotion} state (Energy: ${energyLevel}/10)</p>
  <ol style="color:#e2e8f0;">
    ${tasks.map(t => `<li style="margin-bottom:12px;">${t}</li>`).join('')}
  </ol>
  <p style="color:#475569;font-size:12px;">Sent by Emotional Energy OS</p>
</body>`;

    await transporter.sendMail({
      from: `"Emotional Energy OS" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `📋 Your Personalized To-Do List — ${emotion} Mode`,
      html: htmlBody,
    });

    res.json({ success: true, tasks });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send to-do email', detail: err.message });
  }
});

module.exports = router;
