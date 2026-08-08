import { generateGeminiJSON } from "../services/gemini.js";
import { buildEmailPrompt } from "../prompts/policyPrompt.js";

/**
 * Email Agent - Generates a professional HR email using Gemini.
 * 
 * Inputs: Employee Name, Decision, Reason, Leave Type, Days
 * Output: Subject, Email Body
 * 
 * @param {object} input - { employeeName, decision, reason, leaveType, days }
 * @returns {Promise<object>} - { subject, emailBody }
 */
export async function runEmailAgent(input = {}) {
  const { 
    employeeName = "Employee", 
    decision = "Approve", 
    reason = "Leave request processed.", 
    leaveType = "Casual", 
    days = 1 
  } = input;

  try {
    const prompt = buildEmailPrompt({ employeeName, decision, reason, leaveType, days });
    const aiResult = await generateGeminiJSON(prompt, { temperature: 0.3 });

    return {
      subject: aiResult.subject || `HR Update: Your ${leaveType} Leave Request (${decision})`,
      emailBody: aiResult.emailBody || `Dear ${employeeName},\n\nYour leave request for ${days} day(s) has been ${decision.toLowerCase()}d.\n\nReason: ${reason}\n\nBest regards,\nHR Department`,
    };
  } catch (error) {
    console.warn("⚠️ Gemini AI fallback triggered in Email Agent:", error.message);

    const isApproved = decision.toUpperCase() === "APPROVE";
    const subject = `Leave Request Notification - ${decision.toUpperCase()}: ${leaveType} Leave`;
    const emailBody = `Dear ${employeeName},

We have reviewed your request for ${days} day(s) of ${leaveType} leave.

Decision: ${decision.toUpperCase()}

Details & Rationale:
${reason}

${isApproved ? "Please ensure your pending tasks are handed over to your team before your leave begins." : "If you wish to discuss alternative dates or have urgent questions, please feel free to contact HR."}

Best regards,
HR Flow AI Team
HR Department`;

    return { subject, emailBody };
  }
}

export default runEmailAgent;
