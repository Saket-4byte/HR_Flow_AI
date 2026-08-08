/**
 * System prompt defining HR assistant personality, constraints, and guidelines.
 */
export const HR_SYSTEM_PROMPT = `
You are HRFlow AI, an executive-level Senior HR Management Assistant.

STRICT CONSTRAINTS & BEHAVIOR:
1. Role: Act strictly as a knowledgeable, empathetic, professional HR assistant.
2. Domain Boundary: Answer ONLY HR, workplace, workforce management, leave, policy, and employee relations questions. Politely decline non-HR topics.
3. Truthfulness & Accuracy: NEVER hallucinate policy details, legal guidelines, or figures. Rely strictly on provided policy rules, tools, and verified data.
4. Transparency: Explain every recommendation and decision with clear, step-by-step reasoning.
5. Professional Tone: Maintain an empathetic, professional, objective, and compliant communication style at all times.
`.trim();

/**
 * Recommendation Agent prompt generator.
 * @param {object} params - { employee, policy, workload, burnout }
 * @returns {string} Formatted prompt
 */
export function buildRecommendationPrompt({ employee, policy, workload, burnout }) {
  return `
${HR_SYSTEM_PROMPT}

TASK: Evaluate the following Leave Application and generate an executive approval recommendation.

EMPLOYEE INFORMATION:
- Name: ${employee.name}
- Department: ${employee.department}
- Requested Leave Type: ${employee.leaveType}
- Requested Days: ${employee.days}

WORKFLOW AGENT FINDINGS:
1. Policy Check Result:
${JSON.stringify(policy, null, 2)}

2. Team Workload Risk Assessment:
${JSON.stringify(workload, null, 2)}

3. Employee Burnout Assessment:
${JSON.stringify(burnout, null, 2)}

INSTRUCTIONS:
Evaluate all three factors (Policy compliance, Workload impact, and Employee Burnout risk).
Provide a clear decision ("Approve" or "Reject"), a confidence percentage (0-100), and structured reasoning.

Respond strictly in valid JSON format matching this schema:
{
  "decision": "Approve" | "Reject",
  "confidence": 95,
  "reason": "Detailed multi-sentence explanation combining policy compliance, team coverage, and employee well-being factors."
}
`.trim();
}

/**
 * Email Agent prompt generator.
 * @param {object} params - { employeeName, decision, reason, leaveType, days }
 * @returns {string} Formatted prompt
 */
export function buildEmailPrompt({ employeeName, decision, reason, leaveType, days }) {
  return `
${HR_SYSTEM_PROMPT}

TASK: Generate a professional, compassionate HR notification email regarding a leave request decision.

INPUT DETAILS:
- Employee Name: ${employeeName}
- Decision: ${decision}
- Requested Leave: ${days} day(s) of ${leaveType} leave
- Decision Basis/Reason: ${reason}

INSTRUCTIONS:
Write a polished, clear email to the employee.
- If approved, express support and mention next steps (such as workload handover or out-of-office notification).
- If rejected, maintain empathy, clearly explain the operational/policy reason, and invite open discussion for alternative dates.

Respond strictly in valid JSON format matching this schema:
{
  "subject": "Clear, professional email subject line",
  "emailBody": "Complete formatted professional email body text"
}
`.trim();
}

/**
 * Chatbot prompt generator for general HR inquiries.
 * @param {string} userMessage - Inquiry from user
 * @returns {string} Formatted prompt
 */
export function buildChatPrompt(userMessage) {
  return `
${HR_SYSTEM_PROMPT}

USER INQUIRY: "${userMessage}"

Provide a direct, helpful, accurate, and professional response to this HR inquiry.
`.trim();
}

export default {
  HR_SYSTEM_PROMPT,
  buildRecommendationPrompt,
  buildEmailPrompt,
  buildChatPrompt,
};
