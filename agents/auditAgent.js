import crypto from "crypto";

/**
 * Audit Agent - Creates audit object for compliance, governance, and audit tracking.
 * 
 * Inputs: Complete workflow state (employee, policy, workload, burnout, recommendation, email)
 * Output: Audit log object with Timestamp, Employee, Decision, Policy Used, Reason, Confidence
 * 
 * @param {object} input - Complete state
 * @returns {Promise<object>} - Audit record object
 */
export async function runAuditAgent(input = {}) {
  const { employee = {}, policy = {}, recommendation = {} } = input;

  const auditRecord = {
    auditId: `AUD-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    timestamp: new Date().toISOString(),
    employee: employee.name || "Unknown",
    department: employee.department || "General",
    leaveDetails: {
      type: employee.leaveType || "Casual",
      days: employee.days || 0,
    },
    decision: recommendation.decision || "Pending",
    policyUsed: policy.applicablePolicy || {},
    policyExplanation: policy.policyExplanation || "",
    reason: recommendation.reason || "Processed by HRFlow AI Workflow",
    confidence: recommendation.confidence ? `${recommendation.confidence}%` : "90%",
    status: "RECORDED",
  };

  console.log(`📌 [AUDIT LOG ${auditRecord.auditId}] Decision: ${auditRecord.decision} for ${auditRecord.employee} (${auditRecord.timestamp})`);

  return auditRecord;
}

export default runAuditAgent;
