import { StateGraph, START, END } from "@langchain/langgraph";
import { HRWorkflowState } from "./state.js";

// Import AI workflow agents
import { runPolicyAgent } from "../agents/policyAgent.js";
import { runWorkloadAgent } from "../agents/workloadAgent.js";
import { runBurnoutAgent } from "../agents/burnoutAgent.js";
import { runRecommendationAgent } from "../agents/recommendationAgent.js";
import { runEmailAgent } from "../agents/emailAgent.js";
import { runAuditAgent } from "../agents/auditAgent.js";

/**
 * Node 1: Policy Agent
 */
async function policyNode(state) {
  const result = await runPolicyAgent(state.employee);
  return { policy: result };
}

/**
 * Node 2: Workload Agent
 */
async function workloadNode(state) {
  const result = await runWorkloadAgent({
    department: state.employee.department,
    teamSize: state.employee.teamSize,
    employeesOnLeave: state.employee.employeesOnLeave,
  });
  return { workload: result };
}

/**
 * Node 3: Burnout Agent
 */
async function burnoutNode(state) {
  const result = await runBurnoutAgent({
    overtime: state.employee.overtime,
    unusedLeave: state.employee.unusedLeave,
    weekendWork: state.employee.weekendWork,
  });
  return { burnout: result };
}

/**
 * Node 4: Recommendation Agent
 */
async function recommendationNode(state) {
  const result = await runRecommendationAgent({
    employee: state.employee,
    policy: state.policy,
    workload: state.workload,
    burnout: state.burnout,
  });
  return { recommendation: result };
}

/**
 * Node 5: Email Agent
 */
async function emailNode(state) {
  const result = await runEmailAgent({
    employeeName: state.employee.name,
    decision: state.recommendation.decision,
    reason: state.recommendation.reason,
    leaveType: state.employee.leaveType,
    days: state.employee.days,
  });
  return { email: result };
}

/**
 * Node 6: Audit Agent
 */
async function auditNode(state) {
  const result = await runAuditAgent(state);
  return { audit: result };
}

// Construct state graph sequence: Policy -> Workload -> Burnout -> Recommendation -> Email -> Audit
const workflowBuilder = new StateGraph(HRWorkflowState)
  .addNode("policyAgent", policyNode)
  .addNode("workloadAgent", workloadNode)
  .addNode("burnoutAgent", burnoutNode)
  .addNode("recommendationAgent", recommendationNode)
  .addNode("emailAgent", emailNode)
  .addNode("auditAgent", auditNode)
  
  .addEdge(START, "policyAgent")
  .addEdge("policyAgent", "workloadAgent")
  .addEdge("workloadAgent", "burnoutAgent")
  .addEdge("burnoutAgent", "recommendationAgent")
  .addEdge("recommendationAgent", "emailAgent")
  .addEdge("emailAgent", "auditAgent")
  .addEdge("auditAgent", END);

// Compile LangGraph workflow
export const hrWorkflow = workflowBuilder.compile();

/**
 * Executes the complete HR leave processing graph workflow.
 * 
 * Order: Policy Agent -> Workload Agent -> Burnout Agent -> Recommendation Agent -> Email Agent -> Audit Agent
 * 
 * @param {object} employeeData - Input leave application payload
 * @returns {Promise<object>} - Expected JSON response structure: { policy, workload, burnout, recommendation, email, audit }
 */
export async function executeLeaveWorkflow(employeeData) {
  const initialState = {
    employee: employeeData,
  };

  const finalState = await hrWorkflow.invoke(initialState);

  return {
    policy: finalState.policy,
    workload: finalState.workload,
    burnout: finalState.burnout,
    recommendation: finalState.recommendation,
    email: finalState.email,
    audit: finalState.audit,
  };
}

export default executeLeaveWorkflow;
