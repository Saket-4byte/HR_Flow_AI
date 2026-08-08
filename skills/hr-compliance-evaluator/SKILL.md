---
name: hr-compliance-evaluator
description: Evaluates an employee leave request against active company HR policies, team workload capacity, and employee burnout metrics to produce an explainable recommendation and audit log for HR review.
---

# HR Compliance Evaluator

## Purpose

Evaluate an employee leave request against the active company HR policy, team workload capacity, and employee fatigue metrics to produce an explainable, evidence-backed assessment for an HR reviewer while preserving human-in-the-loop decision-making.

---

## Inputs

Required inputs derived strictly from the HR Flow AI application state:

- **Employee Information (`employee`):**
  - `name`: Full name of applicant employee (String).
  - `employeeId`: Unique employee registration ID (String, e.g., `"EMP-1002"`).
  - `department`: Operational department (String, e.g., `"Engineering"`, `"Sales"`).
- **Leave Application Details:**
  - `leaveType`: Type of leave requested (String, e.g., `"Casual"`, `"Sick"`, `"Annual"`, `"Maternity"`).
  - `days`: Duration of requested leave in days (Number, e.g., `3`).
- **Active Company Policy Context:**
  - `applicablePolicy`: Structured rules extracted from active company policy in MongoDB (`maxConsecutiveLeaveDays`, `allowedLeaveTypes`, `minNoticeDaysRequired`).
- **Workload & Team Context:**
  - `teamSize`: Total headcount in employee's department (Number, default: 1).
  - `employeesOnLeave`: Current number of department members on leave (Number, default: 0).
- **Burnout Context:**
  - `overtime`: Accumulated overtime hours worked (Number, default: 0).
  - `unusedLeave`: Total unused leave balance remaining (Number, default: 0).
  - `weekendWork`: Count of weekend shifts worked in current period (Number, default: 0).

---

## Procedure

1. **Load Active Company Policy:** Fetch the latest company policy rules stored in MongoDB Atlas via `Policy.findOne({ isLatest: true })` or `tools/policyTool.js`.
2. **Identify Relevant Policy Rules:** Match requested `leaveType` and `days` against policy rules (`maxConsecutiveLeaveDays`, `allowedLeaveTypes`, notice requirements).
3. **Inspect Leave Request:** Validate presence of essential request fields (`userId`, `leaveType`, `days`, `department`).
4. **Evaluate Policy Compliance:** Execute `policyAgent` node to compute `isCompliant` boolean and generate `policyExplanation`.
5. **Consider Workload & Burnout Signals:**
   - Execute `workloadAgent` node to compute remaining team coverage percentage and project risk level.
   - Execute `burnoutAgent` node to compute burnout risk score and risk level (`LOW`, `MODERATE`, `HIGH`, `CRITICAL`).
6. **Produce Structured Findings:** Synthesize policy compliance, coverage score, and burnout risk into a combined graph evaluation state.
7. **Provide Evidence/Reasoning:** Execute `recommendationAgent` node using Gemini AI (or heuristic fallback) to generate AI confidence score (e.g., `90%`) and human-readable explanation rationale.
8. **Produce Recommendation:** Formulate recommendation decision (`APPROVED`, `FLAGGED`, `REJECTED`).
9. **Record Audit Information:** Execute `auditAgent` node to construct an immutable `AuditLog` record containing timestamp, audit ID, decision, and risk metrics.
10. **Return Control to Human HR Decision Workflow:** Persist evaluation results on the `LeaveRequest` record in MongoDB with `status: "PENDING"`, notifying the HR Manager to inspect the explainable rationale and render the final human approval or rejection via `POST /leave/:id/decision`.

---

## Safety Rules

The HR Compliance Evaluator skill MUST NOT:

- **Invent company policies:** All policy rules must derive strictly from uploaded company policy documents or configured system fallbacks.
- **Fabricate evidence:** Workload and burnout metrics must use empirical data from MongoDB models.
- **Approve leave automatically:** The skill NEVER alters request status from `"PENDING"` to `"APPROVED"`.
- **Reject leave automatically:** The skill NEVER alters request status from `"PENDING"` to `"REJECTED"`.
- **Bypass HR:** All evaluations remain draft recommendations awaiting human HR review.
- **Expose private employee data:** Employee leave records are scoped strictly to individual users and authorized HR managers.
- **Reveal secrets:** Never log or expose JWT secrets, API keys, or database credentials.
- **Silently change database state:** All decision updates must generate an associated `AuditLog` entry.

---

## Output

A structured evaluation payload populated into the `LeaveRequest` model:

```json
{
  "policyCheck": {
    "applicablePolicy": {
      "companyName": "Acme Corp",
      "maxConsecutiveLeaveDays": 5,
      "allowedLeaveTypes": ["Casual", "Sick", "Annual"]
    },
    "policyExplanation": "Requested 3 days of Casual leave is compliant with max limit of 5 days.",
    "isCompliant": true
  },
  "workloadAnalysis": {
    "currentCoveragePercent": 80,
    "projectRisk": "Low",
    "recommendationScore": 85
  },
  "burnoutAnalysis": {
    "burnoutScore": 72,
    "riskLevel": "High",
    "burnoutRationale": "Employee has 45 overtime hours and 12 unused leave days.",
    "suggestedAction": "Strongly encourage taking restorative leave."
  },
  "recommendation": {
    "decision": "Approve",
    "confidence": 92,
    "reason": "Leave complies with policy. High burnout score indicates restorative leave will prevent turnover without impairing team capacity (80% coverage maintained)."
  },
  "email": {
    "subject": "HR Update: Your Casual Leave Request (Approve)",
    "emailBody": "Dear Sarah,\n\nWe have reviewed your request for 3 day(s) of Casual leave. Decision recommendation: APPROVE..."
  },
  "audit": {
    "auditId": "AUD-A8F291C4",
    "timestamp": "2026-08-08T16:00:00.000Z",
    "status": "RECORDED"
  }
}
```

---

## Failure Handling

- **Missing Policy:** Fall back to standard default policy (max 5 consecutive days, allowed types: Casual, Sick, Annual).
- **Malformed Policy:** Parse raw content using fallback regex patterns or issue `policyCheck.isCompliant = false` with warning explanation.
- **Missing Leave Data:** Reject processing with HTTP 400 Bad Request if `leaveType` or `days` is missing.
- **Ambiguous Policy:** Flag request as `FLAGGED` for manual HR clarification.
- **AI Service Failure:** Execute deterministic heuristic evaluation in `recommendationAgent` and `emailAgent` fallbacks without crashing the workflow.
- **Database Failure:** Catch error in Express handler and return HTTP 500, preserving atomic database transactions.

---

## Human-in-the-Loop Governance

The HR Compliance Evaluator skill performs **analysis and recommendation generation ONLY**. Under no circumstances does this skill execute automated leave approval or rejection. Final decision authority belongs exclusively to an authorized HR Manager interacting with `POST /leave/:id/decision`.

---

## Example Usage Scenario

- **Applicant:** Sarah Connor (`EMP-1042`), Engineering Department.
- **Request:** 3 days of Annual Leave.
- **Context:** Team size 5, 0 currently on leave (80% remaining coverage). Overtime: 30 hours, Unused leave: 14 days.
- **Evaluation:** Policy compliant (3 < 5 max days). Workload coverage healthy (80% > 75% threshold). Moderate burnout risk.
- **Result:** AI recommendation `Approve` with 92% confidence score. Request stored in MongoDB with `status: "PENDING"`. HR Manager reviews evaluation rationale on HR Dashboard and clicks "Approve Request".
