const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

/**
 * Generate a wellness insight or response based on user data.
 */
async function generateWellnessInsight(prompt) {
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini AI Error:", error);
    return "I'm having trouble connecting to my AI core right now. Focus on your breathing and I'll be back soon.";
  }
}

/**
 * Generate a personalized empathetic notification message.
 */
async function generateEmpatheticMessage(mood, bpm, context = "") {
  const prompt = `You are an empathetic wellness coach for an app called Emotional Energy OS. 
  The user just logged a mood of "${mood}" and their heart rate is ${bpm} BPM. ${context}
  Provide a short, supportive, and actionable 1-sentence message for a notification. 
  Keep it under 100 characters. No hashtags.`;
  
  return await generateWellnessInsight(prompt);
}

/**
 * Generate a weekly health and social energy report.
 */
async function generateSocialReport(energyLogs, fitbitLogs) {
  const logSummary = energyLogs.map(l => `${l.emotion} (${l.energyLevel}/10)`).join(', ');
  const bpmSummary = fitbitLogs.length > 0 ? `Avg BPM around ${Math.round(fitbitLogs.reduce((a, b) => a + b.value, 0) / fitbitLogs.length)}` : "No heart rate data";
  
  const prompt = `Analyze this user's emotional energy data: ${logSummary}. ${bpmSummary}. 
  Provide a 3-sentence high-level wellness report. 
  First sentence: summarize their dominant energy state. 
  Second sentence: identify a potential burnout risk or strength. 
  Third sentence: give one specific actionable advice.`;
  
  return await generateWellnessInsight(prompt);
}

/**
 * Generate a 24-hour energy forecast.
 */
async function generateEnergyForecast(energyLogs, fitbitLogs) {
  const prompt = `Based on these logs: ${JSON.stringify(energyLogs.slice(-10))}, 
  predict the user's energy levels for the next 24 hours in 3-hour intervals. 
  Output ONLY a JSON array of 8 objects with "time" (string) and "level" (number 1-10) keys.`;
  
  const result = await generateWellnessInsight(prompt);
  try {
    // Clean up markdown code blocks if Gemini includes them
    const jsonStr = result.replace(/```json|```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (e) {
    // Fallback if AI fails to output valid JSON
    return Array.from({ length: 8 }).map((_, i) => ({ time: `${i*3}:00`, level: 5 + Math.sin(i) * 2 }));
  }
}

module.exports = { 
  generateWellnessInsight, 
  generateEmpatheticMessage, 
  generateSocialReport, 
  generateEnergyForecast 
};
