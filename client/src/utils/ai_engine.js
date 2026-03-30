/**
 * AI Engine for Emotional Energy OS
 * Handles Burnout Prediction and Emotional Correlation
 */

export const calculateBurnoutRisk = (logs, fitbitLogs) => {
  if (logs.length < 3) return 0;

  // Analysis Factor 1: Average Energy Level (Lower energy = Higher risk)
  const avgEnergy = logs.reduce((acc, log) => acc + log.energyLevel, 0) / logs.length;
  const energyFactor = Math.max(0, (5 - avgEnergy) * 20); // Up to 60 points

  // Analysis Factor 2: BPM Stability
  // High average BPM (>90 resting) adds risk
  const avgBpm = fitbitLogs.reduce((acc, log) => acc + log.value, 0) / fitbitLogs.length;
  const bpmFactor = avgBpm > 95 ? 20 : (avgBpm > 85 ? 10 : 0);

  // Analysis Factor 3: Emotion Volatility (Frequent 'Stressed' logs)
  const stressedCount = logs.filter(l => l.emotion === 'Stressed').length;
  const volatilityFactor = (stressedCount / logs.length) * 20;

  const totalRisk = Math.min(100, energyFactor + bpmFactor + volatilityFactor);
  return Math.round(totalRisk);
};

export const getDeepInsights = (logs, fitbitLogs) => {
  if (logs.length === 0) return "Not enough data for insights yet. Keep logging!";

  const stressedLogs = logs.filter(l => l.emotion === 'Stressed');
  if (stressedLogs.length > 0) {
    return "Correlation Alert: Your stress peaks coincide with heart rate spikes above 100 BPM. Consider taking a break at those times.";
  }

  return "Insight: Your energy is most stable when your heart rate stays between 65 and 80 BPM.";
};
