const API_BASE_URL = "http://localhost:5000";

/**
 * Helper to get Auth Header with JWT token
 */
function getAuthHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Generic fetch wrapper handling HTTP errors & JSON parsing
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const isFormData = options.body instanceof FormData;
  const defaultHeaders = isFormData
    ? { ...getAuthHeader(), ...options.headers }
    : { "Content-Type": "application/json", ...getAuthHeader(), ...options.headers };

  const config = {
    ...options,
    headers: defaultHeaders,
  };

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`❌ API Error [${endpoint}]:`, error.message);
    throw error;
  }
}

// 1. Health Status
export async function getHealthStatus() {
  return request("/health");
}

// 2. Employee Registration (POST /auth/register)
export async function registerEmployee(payload) {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// 3. Auth Login (POST /auth/login)
export async function loginUser(email, password) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

// 4. User Profile (GET /auth/profile)
export async function getUserProfile() {
  return request("/auth/profile");
}

// 5. Upload Company Policy (POST /policy/upload)
export async function uploadCompanyPolicy(formData) {
  return request("/policy/upload", {
    method: "POST",
    body: formData,
  });
}

// 6. Get Latest Company Policy (GET /policy/latest)
export async function getLatestPolicy() {
  return request("/policy/latest");
}

// 7. Get All Registered Employees (GET /users/employees)
export async function getEmployeeList() {
  return request("/users/employees");
}

// 8. Update Employee (PATCH /users/employees/:id)
export async function updateEmployee(id, payload) {
  return request(`/users/employees/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

// 9. Delete Employee (DELETE /users/employees/:id)
export async function deleteEmployee(id) {
  return request(`/users/employees/${id}`, {
    method: "DELETE",
  });
}

// 10. Analytics Metrics
export async function getAnalytics() {
  return request("/analytics");
}

// 11. Leave Requests List
export async function getLeaveRequests(params = {}) {
  const query = new URLSearchParams(params).toString();
  const endpoint = query ? `/leave/requests?${query}` : "/leave/requests";
  return request(endpoint);
}

// 12. Leave Request Details
export async function getLeaveRequestById(id) {
  return request(`/leave/requests/${id}`);
}

// 13. HR Triggers AI Evaluation (POST /leave/:id/evaluate)
export async function evaluateLeaveRequest(id) {
  return request(`/leave/${id}/evaluate`, {
    method: "POST",
  });
}

// 14. HR Submits Decision (POST /leave/:id/decision)
export async function submitHRDecision(id, status, comments = "") {
  return request(`/leave/${id}/decision`, {
    method: "POST",
    body: JSON.stringify({ status, comments }),
  });
}

// 15. Update Leave Status (PATCH /leave/requests/:id/status)
export async function updateLeaveStatus(id, status, comments = "") {
  return request(`/leave/requests/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, comments }),
  });
}

// 16. Audit Logs
export async function getAuditLogs() {
  return request("/auditlogs");
}

// 17. Notifications
export async function getNotifications(params = {}) {
  const query = new URLSearchParams(params).toString();
  const endpoint = query ? `/notifications?${query}` : "/notifications";
  return request(endpoint);
}

// 18. Employee Submits Leave Request (POST /leave)
export async function submitLeaveRequest(payload) {
  return request("/leave", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// 19. HR Chatbot (POST /chat)
export async function sendChatMessage(message) {
  return request("/chat", {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}
