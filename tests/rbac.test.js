process.env.NODE_ENV = "test";

import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import jwt from "jsonwebtoken";
import { disconnectDB } from "../config/db.js";
import app from "../index.js";

const JWT_SECRET = process.env.JWT_SECRET || "hrflow_ai_jwt_secret_key_2026";

// Generate test JWT tokens
const employeeToken = jwt.sign(
  {
    id: "660000000000000000000001",
    role: "employee",
    name: "Test Employee",
    email: "employee@test.com",
    department: "Engineering",
  },
  JWT_SECRET,
  { expiresIn: "1h" }
);

const hrToken = jwt.sign(
  {
    id: "660000000000000000000002",
    role: "hr",
    name: "Test HR Manager",
    email: "hr@test.com",
    department: "HR",
  },
  JWT_SECRET,
  { expiresIn: "1h" }
);

let server;
let baseUrl;

test.before((t, done) => {
  // Start server on an ephemeral test port
  server = http.createServer(app);
  server.listen(0, "127.0.0.1", () => {
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;
    console.log(`🧪 Test server started on ${baseUrl}`);
    done();
  });
});

test.after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await disconnectDB();
});

/**
 * Helper function to send HTTP requests to test server
 */
async function makeRequest(path, method = "GET", token = null, body = null) {
  const headers = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  if (body) {
    headers["Content-Type"] = "application/json";
  }

  const options = { method, headers };
  if (method !== "GET" && method !== "HEAD" && body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${baseUrl}${path}`, options);

  const json = await response.json().catch(() => ({}));
  return { status: response.status, body: json };
}

// Group 1: Public Endpoints
test("1. Public Endpoint: GET /health returns 200 without token", async () => {
  const res = await makeRequest("/health");
  assert.equal(res.status, 200);
  assert.equal(res.body.status, "running");
});

test("2. Public Endpoint: POST /auth/login returns 400 for empty body without token", async () => {
  const res = await makeRequest("/auth/login", "POST", null, {});
  assert.equal(res.status, 400);
  assert.equal(res.body.error, "Please provide email and password");
});

test("3. Public Endpoint: POST /auth/register forbids HR registration", async () => {
  const res = await makeRequest("/auth/register", "POST", null, {
    name: "Fake HR",
    email: "fakehr@test.com",
    password: "password123",
    department: "HR",
    role: "hr",
  });
  assert.equal(res.status, 403);
});

// Group 2: Unauthenticated Requests to Protected Endpoints (Expect 401)
const protectedEndpoints = [
  { path: "/policy/upload", method: "POST" },
  { path: "/policy/latest", method: "GET" },
  { path: "/policy/all", method: "GET" },
  { path: "/users/employees", method: "GET" },
  { path: "/users/employees/660000000000000000000001", method: "PATCH" },
  { path: "/users/employees/660000000000000000000001", method: "DELETE" },
  { path: "/leave/requests", method: "GET" },
  { path: "/leave/requests/660000000000000000000001", method: "GET" },
  { path: "/leave", method: "POST" },
  { path: "/leave/660000000000000000000001/evaluate", method: "POST" },
  { path: "/leave/660000000000000000000001/decision", method: "POST" },
  { path: "/leave/requests/660000000000000000000001/status", method: "PATCH" },
  { path: "/auditlogs", method: "GET" },
  { path: "/notifications", method: "GET" },
  { path: "/analytics", method: "GET" },
  { path: "/chat", method: "POST" },
];

for (const endpoint of protectedEndpoints) {
  test(`Unauthenticated request: ${endpoint.method} ${endpoint.path} returns 401`, async () => {
    const res = await makeRequest(endpoint.path, endpoint.method, null);
    assert.equal(res.status, 401, `Expected 401 for ${endpoint.method} ${endpoint.path}`);
  });
}

// Group 3: Employee Accessing HR-Only Endpoints (Expect 403)
const hrOnlyEndpoints = [
  { path: "/policy/upload", method: "POST", body: { content: "Sample policy" } },
  { path: "/policy/all", method: "GET" },
  { path: "/users/employees", method: "GET" },
  { path: "/users/employees/660000000000000000000001", method: "PATCH", body: { overtime: 5 } },
  { path: "/users/employees/660000000000000000000001", method: "DELETE" },
  { path: "/leave/660000000000000000000001/evaluate", method: "POST" },
  { path: "/leave/660000000000000000000001/decision", method: "POST", body: { status: "APPROVED" } },
  { path: "/leave/requests/660000000000000000000001/status", method: "PATCH", body: { status: "APPROVED" } },
  { path: "/auditlogs", method: "GET" },
  { path: "/analytics", method: "GET" },
];

for (const endpoint of hrOnlyEndpoints) {
  test(`Employee access forbidden: ${endpoint.method} ${endpoint.path} returns 403`, async () => {
    const res = await makeRequest(endpoint.path, endpoint.method, employeeToken, endpoint.body);
    assert.equal(res.status, 403, `Expected 403 Forbidden for Employee on ${endpoint.method} ${endpoint.path}`);
  });
}

// Group 4: Employee Accessing Permitted Endpoints (Expect 200/201/400/404, not 401/403)
test("Employee permitted: GET /policy/latest succeeds", async () => {
  const res = await makeRequest("/policy/latest", "GET", employeeToken);
  assert.equal(res.status, 200);
});

test("Employee permitted: GET /leave/requests returns 200 OK", async () => {
  const res = await makeRequest("/leave/requests", "GET", employeeToken);
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body));
});

test("Employee permitted: GET /notifications returns 200 OK", async () => {
  const res = await makeRequest("/notifications", "GET", employeeToken);
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body));
});

// Group 5: HR Accessing HR Endpoints (Expect Authorized Status 200/201/404, not 401/403)
test("HR authorized: GET /users/employees succeeds with 200", async () => {
  const res = await makeRequest("/users/employees", "GET", hrToken);
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body));
});

test("HR authorized: GET /policy/all succeeds with 200", async () => {
  const res = await makeRequest("/policy/all", "GET", hrToken);
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body));
});

test("HR authorized: GET /auditlogs succeeds with 200", async () => {
  const res = await makeRequest("/auditlogs", "GET", hrToken);
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body));
});

test("HR authorized: GET /analytics succeeds with 200", async () => {
  const res = await makeRequest("/analytics", "GET", hrToken);
  assert.equal(res.status, 200);
  assert.ok(typeof res.body === "object");
});
