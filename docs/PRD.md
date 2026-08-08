# HR Flow AI — Product Requirements Document (PRD)

## 1. Executive Overview & Problem Statement

Modern HR operations face significant challenges in managing employee leave applications efficiently while balancing departmental workload capacity, preventing employee burnout, and enforcing dynamic company policies. Traditional HR systems either rely on manual management or rigid rule engines that fail to provide explainable contextual insights.

**HR Flow AI** addresses this problem by delivering an AI-assisted, multi-agent leave management platform. It evaluates leave applications against live company policy, team workload impact, and burnout risk factors using Google Gemini 2.5 Flash and LangGraph, while strictly maintaining **human-in-the-loop HR authorization**.

---

## 2. Target Personas

1. **Employee:** Submits leave requests, tracks leave application status, views personal leave history, receives approval/rejection notifications, and interacts with the HR Chatbot.
2. **HR Manager:** Uploads and manages company leave policies, manages employee profiles, reviews pending leave requests, triggers multi-agent AI evaluations, inspects explainable AI explanations, makes final human approval/rejection decisions, and monitors company-wide analytics and audit logs.
3. **System Administrator:** Oversees platform security, API performance, database persistence, and system health checks.

---

## 3. Goals & Non-Goals

### Goals
- Automate leave compliance checking, workload capacity evaluation, and burnout risk scoring using a 6-agent LangGraph workflow.
- Provide transparent, human-readable explainable AI explanations for every recommendation.
- Maintain human-in-the-loop HR decision control for all final leave request approvals and rejections.
- Enforce strict Role-Based Access Control (RBAC) and data privacy scoping across all REST API endpoints.
- Maintain a complete, immutable audit trail for compliance and reporting.

### Non-Goals
- Fully autonomous AI leave approval without human HR confirmation (AI cannot auto-approve or auto-reject without HR intervention).
- Automated payroll deduction calculation or direct external ERP/payroll system synchronization in V1.

---

## 4. System & Quality Requirements

### Functional Requirements
- Employee registration and JWT authentication.
- HR policy document upload with automated rule extraction via Gemini 2.5 Flash.
- Employee leave application submission with pending status.
- LangGraph 6-agent AI evaluation workflow execution.
- Human HR decision submission (`APPROVED`, `REJECTED`, `FLAGGED`, `REQUEST_CHANGES`).
- Interactive HR Chatbot for employee policy inquiries.

### Non-Functional & Performance Requirements
- API response time < 500ms for standard database CRUD operations.
- LangGraph AI evaluation execution time < 5s.
- Clean production builds (`vite build`) without bundling errors.

### Security Requirements
- All passwords hashed via `bcryptjs` (salt rounds = 10).
- All protected routes authenticated via JWT (`protect` middleware).
- HR endpoints restricted to users with `role: "hr"` (`authorize("hr")` middleware).
- Employee data scoped to individual user IDs to prevent unauthorized cross-employee data access.

### Human-In-The-Loop Requirement
- AI agents MUST generate recommendations, confidence scores, and rationales, but leave requests MUST remain in `PENDING` status until an authorized HR Manager submits an explicit human decision.

---

## 5. User Stories & Measurable Acceptance Criteria

### Employee User Stories

#### US-EMP-01: Employee Registration
- **User Story:** As an Employee, I want to register for an account using my name, email, department, and password so that I can access the HR Flow AI platform.
- **Acceptance Criteria:**
  1. `POST /auth/register` creates an employee account in MongoDB with `role: "employee"`.
  2. Public registration with `role: "hr"` MUST return HTTP 403 Forbidden.
  3. Response contains a valid JWT token and user profile object excluding password.
  4. Attempting to register an existing email returns HTTP 400 Bad Request.

#### US-EMP-02: Employee Login
- **User Story:** As an Employee, I want to log in with my email and password so that I can securely view my dashboard.
- **Acceptance Criteria:**
  1. `POST /auth/login` validates credentials against stored bcrypt password hashes.
  2. Successful login returns HTTP 200 OK with a 30-day JWT token.
  3. Invalid credentials return HTTP 401 Unauthorized.

#### US-EMP-03: Submit Leave Request
- **User Story:** As an Employee, I want to submit a leave request specifying leave type and number of days so that HR can review my application.
- **Acceptance Criteria:**
  1. `POST /leave` creates a new `LeaveRequest` record in MongoDB with `status: "PENDING"`.
  2. `policyCheck`, `workloadAnalysis`, `burnoutAnalysis`, and `recommendation` fields MUST initialize as null.
  3. Returns HTTP 201 Created with the created leave request payload.
  4. Unauthenticated requests return HTTP 401 Unauthorized.

#### US-EMP-04: View Personal Leave History
- **User Story:** As an Employee, I want to view my submitted leave requests so that I can check their current status.
- **Acceptance Criteria:**
  1. `GET /leave/requests` returns HTTP 200 OK with an array of leave requests.
  2. For users with `role: "employee"`, the returned array MUST strictly contain requests matching `userId === req.user._id`.
  3. Attempting to fetch another employee's request details via `GET /leave/requests/:id` returns HTTP 403 Forbidden.

#### US-EMP-05: View Personal Notifications
- **User Story:** As an Employee, I want to view notification messages sent to me regarding my leave decisions.
- **Acceptance Criteria:**
  1. `GET /notifications` returns HTTP 200 OK with notifications filtered by `recipient === req.user.email`.
  2. Notifications contain recipient email, subject line, body text, and generation timestamp.

---

### HR Manager User Stories

#### US-HR-01: HR Login
- **User Story:** As an HR Manager, I want to log in using my HR credentials so that I can access the administrative HR dashboard.
- **Acceptance Criteria:**
  1. `POST /auth/login` authenticates pre-seeded or configured HR accounts and issues a JWT token with `role: "hr"`.
  2. Returned user object confirms `role === "hr"`.

#### US-HR-02: Upload Company Leave Policy
- **User Story:** As an HR Manager, I want to upload a company policy document so that Gemini AI can extract structured leave rules into MongoDB.
- **Acceptance Criteria:**
  1. `POST /policy/upload` accepts text or PDF/DOCX file uploads via Multer.
  2. Gemini AI parses raw content and extracts structured `extractedRules` (`maxConsecutiveLeaveDays`, `allowedLeaveTypes`, `minNoticeDaysRequired`).
  3. Updates `isLatest: true` on the new policy and sets previous policies to `isLatest: false`.
  4. Non-HR requests return HTTP 403 Forbidden.

#### US-HR-03: View Registered Employees
- **User Story:** As an HR Manager, I want to view and manage employee profiles so that I can update overtime hours and leave balances.
- **Acceptance Criteria:**
  1. `GET /users/employees` returns HTTP 200 OK with all registered employees.
  2. `PATCH /users/employees/:id` allows updating employee department, overtime, unused leave, and weekend work values.
  3. Employee role attempts to access `/users/employees` return HTTP 403 Forbidden.

#### US-HR-04: View Pending Leave Requests
- **User Story:** As an HR Manager, I want to view all submitted leave requests across the company so that I can prioritize pending applications.
- **Acceptance Criteria:**
  1. `GET /leave/requests` with an HR token returns all leave requests from all departments.
  2. Allows filtering by query parameters (`userId`, `email`, `employeeName`).

#### US-HR-05: Trigger AI Leave Evaluation
- **User Story:** As an HR Manager, I want to trigger AI evaluation for a pending leave request so that the multi-agent graph analyzes policy, workload, and burnout risk.
- **Acceptance Criteria:**
  1. `POST /leave/:id/evaluate` executes the 6-agent LangGraph workflow (`executeLeaveWorkflow`).
  2. Populates `policyCheck`, `workloadAnalysis`, `burnoutAnalysis`, `recommendation`, `email`, and `AuditLog` records.
  3. The leave request `status` MUST remain `"PENDING"` after AI evaluation.
  4. Non-HR requests return HTTP 403 Forbidden.

#### US-HR-06: Inspect Explainable AI Rationale
- **User Story:** As an HR Manager, I want to view the AI recommendation and explanation breakdown so that I can make an informed approval decision.
- **Acceptance Criteria:**
  1. `GET /leave/requests/:id` returns the complete leave request object including AI policy explanation, workload coverage percentage, burnout risk rating, and recommendation rationale.

#### US-HR-07: Human Approve Leave Request
- **User Story:** As an HR Manager, I want to approve a pending leave request so that the employee is notified and the status updates.
- **Acceptance Criteria:**
  1. `POST /leave/:id/decision` with `{ status: "APPROVED", comments: "..." }` updates status to `"APPROVED"`.
  2. Updates corresponding `AuditLog` decision to `"APPROVED"`.
  3. Creates a new `Notification` record for the applicant employee.
  4. Returns HTTP 200 OK with the updated leave request.

#### US-HR-08: Human Reject Leave Request
- **User Story:** As an HR Manager, I want to reject a non-compliant leave request so that the employee receives feedback.
- **Acceptance Criteria:**
  1. `POST /leave/:id/decision` with `{ status: "REJECTED", comments: "..." }` updates status to `"REJECTED"`.
  2. Updates corresponding `AuditLog` decision to `"REJECTED"`.
  3. Creates a `Notification` entry with rejection comments.

#### US-HR-09: View Audit Logs
- **User Story:** As an HR Manager, I want to view audit logs so that I can ensure compliance with corporate governance standards.
- **Acceptance Criteria:**
  1. `GET /auditlogs` returns HTTP 200 OK with an array of audit logs sorted newest first.
  2. Non-HR attempts return HTTP 403 Forbidden.

#### US-HR-10: View HR Analytics
- **User Story:** As an HR Manager, I want to view company analytics so that I can track leave trends and average employee burnout scores.
- **Acceptance Criteria:**
  1. `GET /analytics` returns HTTP 200 OK with metrics (`totalEmployees`, `pending`, `approved`, `rejected`, `averageBurnout`, `departmentWiseLeaves`, `leaveTypeDistribution`, `monthlyTrend`).
  2. Non-HR attempts return HTTP 403 Forbidden.

#### US-HR-11: HR Notifications Overview
- **User Story:** As an HR Manager, I want to view all generated notification logs so that I can audit outgoing employee communications.
- **Acceptance Criteria:**
  1. `GET /notifications` with an HR token returns all generated notification records across all recipients.
