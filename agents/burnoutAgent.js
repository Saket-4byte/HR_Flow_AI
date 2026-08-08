/**
 * Burnout Agent - Calculates employee burnout score and risk level.
 * 
 * Input: Overtime Hours, Unused Leave, Weekend Work
 * Calculate: Burnout Score (0 - 100)
 * Output: Risk Level (Low / Medium / High), Reason
 * 
 * @param {object} input - { overtime, unusedLeave, weekendWork }
 * @returns {Promise<object>} - Burnout evaluation
 */
export async function runBurnoutAgent(input = {}) {
  const { overtime = 0, unusedLeave = 0, weekendWork = 0 } = input;

  // Calculate quantitative burnout score (0 - 100 scale)
  const overtimeImpact = Math.min(overtime * 2, 40);       // Max 40 points
  const leaveImpact = Math.min(unusedLeave * 1.5, 30);      // Max 30 points
  const weekendImpact = Math.min(weekendWork * 10, 30);     // Max 30 points

  const rawScore = overtimeImpact + leaveImpact + weekendImpact;
  const burnoutScore = Math.min(Math.round(rawScore), 100);

  let riskLevel = "Low";
  let reason = "";

  if (burnoutScore >= 65) {
    riskLevel = "High";
    reason = `Elevated burnout risk detected (Burnout Score: ${burnoutScore}/100). High overtime (${overtime} hrs), accumulated unused leave (${unusedLeave} days), and weekend work (${weekendWork} days). Granting leave is strongly recommended for well-being.`;
  } else if (burnoutScore >= 35) {
    riskLevel = "Medium";
    reason = `Moderate burnout indicators (Burnout Score: ${burnoutScore}/100). Overtime of ${overtime} hrs and ${weekendWork} weekend shifts suggest employee needs rest.`;
  } else {
    riskLevel = "Low";
    reason = `Low burnout risk (Burnout Score: ${burnoutScore}/100). Balanced work schedule observed.`;
  }

  return {
    burnoutScore,
    riskLevel,
    reason,
    metrics: {
      overtimeHours: overtime,
      unusedLeaveDays: unusedLeave,
      weekendDaysWorked: weekendWork,
    },
  };
}

export default runBurnoutAgent;
