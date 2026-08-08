import { Policy } from "../models/Policy.js";

/**
 * Policy Tool - Helper functions for retrieving company HR policies, leave rules, and department guidelines.
 */

/**
 * Retrieves overall company HR policy rules (async, checks MongoDB Atlas for uploaded policy).
 * @returns {Promise<object>} Company policy rules
 */
export async function getCompanyPolicy() {
  try {
    const latestPolicy = await Policy.findOne({ isLatest: true }).sort({ createdAt: -1 });
    if (latestPolicy && latestPolicy.extractedRules) {
      return {
        companyName: latestPolicy.extractedRules.companyName || "HRFlow Technologies",
        maxConsecutiveLeaveDays: latestPolicy.extractedRules.maxConsecutiveLeaveDays || 14,
        minNoticeDaysRequired: latestPolicy.extractedRules.minNoticeDaysRequired || 2,
        probationLeaveRestriction: latestPolicy.extractedRules.probationLeaveRestriction ?? true,
        maxLeavePerYear: latestPolicy.extractedRules.maxLeavePerYear || 24,
        policyVersion: latestPolicy.title || "Custom Uploaded Policy",
        allowedLeaveTypes: latestPolicy.extractedRules.allowedLeaveTypes || [
          "Casual", "Sick", "Earned", "Maternity", "Paternity", "Bereavement"
        ],
        rawTextSummary: latestPolicy.rawContent?.slice(0, 300) || "",
      };
    }
  } catch (err) {
    console.warn("⚠️ Could not fetch uploaded policy from MongoDB, using standard fallback:", err.message);
  }

  // Default fallback policy
  return {
    companyName: "HRFlow Technologies",
    maxConsecutiveLeaveDays: 14,
    minNoticeDaysRequired: 2,
    probationLeaveRestriction: true,
    maxLeavePerYear: 24,
    policyVersion: "2026.1 Standard Policy",
    allowedLeaveTypes: ["Casual", "Sick", "Earned", "Maternity", "Paternity", "Bereavement"],
  };
}

/**
 * Retrieves rule constraints for specific leave types.
 * @param {string} leaveType - Type of leave requested
 * @returns {object} Specific leave rules
 */
export function getLeaveRules(leaveType = "Casual") {
  const rules = {
    Casual: {
      maxDaysPerRequest: 5,
      requiresMedicalCertificate: false,
      advanceNoticeDays: 2,
      paid: true,
      description: "Short notice leave for personal or urgent matters.",
    },
    Sick: {
      maxDaysPerRequest: 10,
      requiresMedicalCertificate: true,
      advanceNoticeDays: 0,
      paid: true,
      description: "Leave granted for health conditions or medical emergencies.",
    },
    Earned: {
      maxDaysPerRequest: 14,
      requiresMedicalCertificate: false,
      advanceNoticeDays: 7,
      paid: true,
      description: "Planned annual vacation leave.",
    },
    Bereavement: {
      maxDaysPerRequest: 5,
      requiresMedicalCertificate: false,
      advanceNoticeDays: 0,
      paid: true,
      description: "Compassionate leave for loss of immediate family.",
    },
  };

  return rules[leaveType] || {
    maxDaysPerRequest: 5,
    requiresMedicalCertificate: false,
    advanceNoticeDays: 2,
    paid: true,
    description: "Standard leave allocation.",
  };
}

/**
 * Retrieves department-specific staffing and leave policies.
 * @param {string} department - Department name
 * @returns {object} Department policy rules
 */
export function getDepartmentPolicy(department = "Engineering") {
  const departmentPolicies = {
    Engineering: {
      maxConcurrentAbsencePercent: 25,
      criticalProjectFreeze: false,
      minimumCoverageRequired: 4,
      approvalLevel: "Tech Lead & HR",
    },
    Sales: {
      maxConcurrentAbsencePercent: 20,
      criticalProjectFreeze: false,
      minimumCoverageRequired: 3,
      approvalLevel: "Sales Director & HR",
    },
    HR: {
      maxConcurrentAbsencePercent: 30,
      criticalProjectFreeze: false,
      minimumCoverageRequired: 2,
      approvalLevel: "HR Director",
    },
    Finance: {
      maxConcurrentAbsencePercent: 20,
      criticalProjectFreeze: false,
      minimumCoverageRequired: 2,
      approvalLevel: "CFO & HR",
    },
  };

  return departmentPolicies[department] || {
    maxConcurrentAbsencePercent: 25,
    criticalProjectFreeze: false,
    minimumCoverageRequired: 2,
    approvalLevel: "Manager & HR",
  };
}

export default {
  getCompanyPolicy,
  getLeaveRules,
  getDepartmentPolicy,
};
