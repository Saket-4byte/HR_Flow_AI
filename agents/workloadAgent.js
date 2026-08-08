import { getDepartmentPolicy } from "../tools/policyTool.js";

/**
 * Workload Agent - Assesses team capacity and operational workload risk.
 * 
 * Input: Department, Team Size, Employees on Leave
 * Output: Risk (Low / Medium / High), Reason
 * 
 * @param {object} input - { department, teamSize, employeesOnLeave }
 * @returns {Promise<object>} - Risk evaluation object
 */
export async function runWorkloadAgent(input = {}) {
  const { department = "Engineering", teamSize = 8, employeesOnLeave = 0 } = input;

  const deptPolicy = getDepartmentPolicy(department);
  const upcomingAbsenceCount = employeesOnLeave + 1;
  const absencePercentage = Math.round((upcomingAbsenceCount / teamSize) * 100);
  const remainingStaff = teamSize - upcomingAbsenceCount;

  let risk = "Low";
  let reason = "";

  if (remainingStaff < deptPolicy.minimumCoverageRequired || absencePercentage > 35) {
    risk = "High";
    reason = `High capacity risk: ${upcomingAbsenceCount} of ${teamSize} (${absencePercentage}%) team members would be absent. Remaining staff (${remainingStaff}) falls below minimum operational coverage of ${deptPolicy.minimumCoverageRequired}.`;
  } else if (absencePercentage > deptPolicy.maxConcurrentAbsencePercent) {
    risk = "Medium";
    reason = `Moderate workload strain: ${upcomingAbsenceCount} of ${teamSize} (${absencePercentage}%) team members on leave exceeds department target maximum of ${deptPolicy.maxConcurrentAbsencePercent}%.`;
  } else {
    risk = "Low";
    reason = `Healthy team coverage: ${remainingStaff} of ${teamSize} team members available (${100 - absencePercentage}% active capacity).`;
  }

  return {
    risk,
    reason,
    activeTeamSize: teamSize,
    currentOnLeave: employeesOnLeave,
    projectedAbsencePercentage: absencePercentage,
  };
}

export default runWorkloadAgent;
