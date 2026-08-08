import { getCompanyPolicy, getLeaveRules, getDepartmentPolicy } from "../tools/policyTool.js";

/**
 * Policy Agent - Validates requested leave against loaded company, departmental, and leave-type rules.
 * 
 * Workflow Step 1: Loads latest uploaded company policy from MongoDB.
 * 
 * Input: Employee Name, Department, Leave Type, Days
 * Output: Applicable HR policy, Policy explanation, Compliance flag
 * 
 * @param {object} input - { name, department, leaveType, days }
 * @returns {Promise<object>} - Policy validation results
 */
export async function runPolicyAgent(input = {}) {
  const { name = "Employee", department = "Engineering", leaveType = "Casual", days = 1 } = input;

  // Load latest company policy dynamically (from MongoDB if uploaded)
  const companyPolicy = await getCompanyPolicy();
  const leaveRules = getLeaveRules(leaveType);
  const deptPolicy = getDepartmentPolicy(department);

  const isWithinMaxDays = days <= leaveRules.maxDaysPerRequest;
  const isWithinCompanyLimit = days <= companyPolicy.maxConsecutiveLeaveDays;
  const isCompliant = isWithinMaxDays && isWithinCompanyLimit;

  let explanation = "";
  if (isCompliant) {
    explanation = `${leaveType} leave request of ${days} day(s) for ${name} in ${department} complies with ${companyPolicy.companyName} (${companyPolicy.policyVersion}) limit of max ${leaveRules.maxDaysPerRequest} days per request.`;
  } else if (!isWithinMaxDays) {
    explanation = `${leaveType} leave request of ${days} day(s) exceeds maximum allowed ${leaveRules.maxDaysPerRequest} days per single request under ${companyPolicy.companyName} guidelines.`;
  } else {
    explanation = `Requested ${days} days exceeds company maximum consecutive limit of ${companyPolicy.maxConsecutiveLeaveDays} days.`;
  }

  return {
    applicablePolicy: {
      leaveType,
      maxAllowedDays: leaveRules.maxDaysPerRequest,
      advanceNoticeRequiredDays: leaveRules.advanceNoticeDays,
      departmentCoverageThresholdPercent: deptPolicy.maxConcurrentAbsencePercent,
      approvalLevel: deptPolicy.approvalLevel,
      policyVersion: companyPolicy.policyVersion,
    },
    policyExplanation: explanation,
    isCompliant,
  };
}

export default runPolicyAgent;
