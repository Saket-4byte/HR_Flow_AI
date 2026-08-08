# AGENTS.md — Repository AI Engineering Rules & Governance Constitution

This document defines the strict engineering standards, safety guardrails, security boundaries, and operating guidelines for all AI agents, subagents, and human contributors working on the **HR Flow AI** repository.

---

## 1. Core Security & Secret Hygiene

1. **Never Expose Secrets:** Secrets, API keys, JWT secrets, database credentials, or private connection strings must NEVER be hardcoded in code, logs, comments, or documentation.
2. **Never Commit `.env`:** Keep `.env` and `.env.*` excluded in `.gitignore`. Only commit `.env.example` containing safe, blank variable names.
3. **Sensitive Endpoints Require Authentication:** All non-public endpoints MUST be protected by the `protect` JWT middleware. Unauthenticated requests MUST return `401 Unauthorized`.
4. **HR Endpoints Require HR Authorization:** All administrative HR operations MUST be protected by `authorize("hr")`. Requests by standard employees MUST return `403 Forbidden`.
5. **Employees Cannot Perform HR Operations:** Standard employees MUST NOT be allowed to upload company policy, trigger AI leave evaluations, approve/reject leave requests, access audit logs, edit employee profiles, or view HR analytics.
6. **Data Privacy Scoping:** Employees MUST NOT be able to access another employee's private leave applications, profile information, or notifications.

---

## 2. AI Governance & Human-in-the-Loop Rules

7. **Keep Human Approval in HR Workflows:** AI agents generate recommendations and explainable analysis, but final leave request approval, rejection, or flagging MUST always require explicit human HR decision-making (`POST /leave/:id/decision`).
8. **AI Recommendations Must Be Explainable:** Every AI evaluation output MUST provide human-readable, transparent explanations for policy compliance, workload impact, and burnout risk.
9. **AI Must Not Invent Company Policy:** The Policy Agent and policy extraction pipeline MUST derive policy guidelines strictly from company policy documents uploaded to MongoDB or explicitly configured fallbacks.
10. **Never Invent Database Data:** Do not fabricate artificial database records or invent fake user IDs in production workflows. All database interactions MUST reflect genuine entity relationships in MongoDB Atlas.
11. **Never Use Mock Data in Production Workflows:** Production runtime paths MUST execute real business logic, Mongoose queries, and Gemini AI workflows.

---

## 3. Code Preservation & Architecture Integrity

12. **Preserve Existing Architecture:** Do not modify existing architectural layers, Express route structures, or LangGraph state graph definitions unless explicitly requested.
13. **Preserve Existing Frontend Design:** Maintain the visual design system, glassmorphism UI components, color palettes, and layout structure of the React/Vite client.
14. **All Important Decisions Must Be Auditable:** Every AI evaluation and human HR decision MUST produce a persistent record in `AuditLog` for compliance tracking.

---

## 4. Development, Quality Assurance & CI Standards

15. **Changes Must Include Appropriate Tests:** Any modification to business logic, API endpoints, or security rules MUST be accompanied by automated tests (e.g., `tests/rbac.test.js`).
16. **Run Lint/Build/Tests Before Commits:** Always verify syntax (`node --check`), build compatibility (`npm run build`), frontend linting (`npm run lint`), and unit tests (`npm test`) before committing code.
17. **Prefer Small, Incremental Changes:** Keep pull requests and commits focused, atomic, and well-scoped.
18. **Do Not Hide Failures:** Never use `|| true`, `continue-on-error: true`, or swallowed exceptions to hide command failures or build errors.
19. **Do Not Disable Tests to Make CI Green:** Fixing a failing test requires resolving the underlying contract breach, never commenting out or disabling test assertions.
