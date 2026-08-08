import { test, expect } from "@playwright/test";

test.describe.serial("HR Flow AI — Critical End-to-End Test Suite", () => {
  const timestamp = Date.now();
  const empEmail = `emp.e2e.${timestamp}@company.com`;
  const empPassword = "Password123!";
  const empName = `Test Employee ${timestamp.toString().slice(-4)}`;
  const hrEmail = "hr@company.com";
  const hrPassword = "password123";

  let createdLeaveId = null;
  let secondLeaveId = null;
  let empToken = null;
  let hrToken = null;

  test("TEST 1: Application loads successfully", async ({ page, request }) => {
    const healthRes = await request.get("http://127.0.0.1:5000/health");
    expect(healthRes.status()).toBe(200);
    const healthData = await healthRes.json();
    expect(healthData.status).toBe("running");

    await page.goto("/");
    await expect(page).toHaveTitle(/HR Flow AI/i);
    await expect(page.locator("input[type='email']")).toBeVisible();
    await expect(page.locator("input[type='password']")).toBeVisible();
  });

  test("TEST 2: Employee registration → login", async ({ page, request }) => {
    // 1. Register employee via API
    const regRes = await request.post("http://127.0.0.1:5000/auth/register", {
      data: {
        name: empName,
        email: empEmail,
        password: empPassword,
        department: "Engineering",
      }
    });
    expect(regRes.status()).toBe(201);
    const regData = await regRes.json();
    empToken = regData.token;
    expect(empToken).toBeDefined();

    // 2. Perform UI login with newly created employee credentials
    await page.goto("/");
    await page.fill("input[type='email']", empEmail);
    await page.fill("input[type='password']", empPassword);
    await page.click("button[type='submit']");

    // Assert successful UI navigation to Employee Portal
    await expect(page.locator("text=HR Flow AI").first()).toBeVisible();
    await expect(page.locator("button", { hasText: "Apply Leave" })).toBeVisible();
  });

  test("TEST 3: HR login", async ({ page, request }) => {
    await page.goto("/");
    await page.fill("input[type='email']", hrEmail);
    await page.fill("input[type='password']", hrPassword);
    await page.click("button[type='submit']");

    // Assert HR Executive Portal navigation elements
    await expect(page.locator("text=HR Executive Portal")).toBeVisible();
    await expect(page.locator("button", { hasText: "Dashboard" })).toBeVisible();
    await expect(page.locator("button", { hasText: "Audit Logs" })).toBeVisible();

    // Acquire HR token via API
    const hrLoginRes = await request.post("http://127.0.0.1:5000/auth/login", {
      data: { email: hrEmail, password: hrPassword }
    });
    expect(hrLoginRes.status()).toBe(200);
    hrToken = (await hrLoginRes.json()).token;
    expect(hrToken).toBeDefined();
  });

  test("TEST 4: Employee submits leave (ASSERT: PENDING status & no auto approval)", async ({ page, request }) => {
    // Submit leave request via API using real employee token
    const leaveRes = await request.post("http://127.0.0.1:5000/leave", {
      headers: { Authorization: `Bearer ${empToken}` },
      data: {
        name: empName,
        department: "Engineering",
        leaveType: "Casual",
        days: 3,
        startDate: "2026-09-10",
        endDate: "2026-09-12",
        reason: "Family function attendance."
      }
    });
    expect(leaveRes.status()).toBe(201);
    const leaveData = await leaveRes.json();
    createdLeaveId = leaveData.leaveRequest._id;
    expect(createdLeaveId).toBeDefined();

    // ASSERT 1: Leave status becomes PENDING
    expect(leaveData.leaveRequest.status).toBe("PENDING");

    // ASSERT 2: Employee submission does NOT automatically approve or reject
    expect(leaveData.leaveRequest.status).not.toBe("APPROVED");
    expect(leaveData.leaveRequest.status).not.toBe("REJECTED");

    // Verify UI displays pending leave request badge
    await page.goto("/");
    await page.fill("input[type='email']", empEmail);
    await page.fill("input[type='password']", empPassword);
    await page.click("button[type='submit']");

    await page.click("button:has-text('My Leave Requests')");
    await expect(page.locator("span", { hasText: "PENDING REVIEW" }).first()).toBeVisible();
  });

  test("TEST 5: Employee cannot access HR endpoints", async ({ request }) => {
    // Acquire employee authentication token for registered employee
    const empLoginRes = await request.post("http://127.0.0.1:5000/auth/login", {
      data: { email: empEmail, password: empPassword }
    });
    expect(empLoginRes.status()).toBe(200);
    const testEmpToken = (await empLoginRes.json()).token;

    // 1. Employee attempting to access HR audit logs -> 403 Forbidden
    const auditRes = await request.get("http://127.0.0.1:5000/auditlogs", {
      headers: { Authorization: `Bearer ${testEmpToken}` }
    });
    expect(auditRes.status()).toBe(403);

    // 2. Employee attempting to trigger HR AI evaluation -> 403 Forbidden
    const evalRes = await request.post(`http://127.0.0.1:5000/leave/${createdLeaveId}/evaluate`, {
      headers: { Authorization: `Bearer ${testEmpToken}` }
    });
    expect(evalRes.status()).toBe(403);

    // 3. Employee attempting to access HR analytics -> 403 Forbidden
    const analyticsRes = await request.get("http://127.0.0.1:5000/analytics", {
      headers: { Authorization: `Bearer ${testEmpToken}` }
    });
    expect(analyticsRes.status()).toBe(403);
  });

  test("TEST 6: HR can access HR dashboard", async ({ page }) => {
    await page.goto("/");
    await page.fill("input[type='email']", hrEmail);
    await page.fill("input[type='password']", hrPassword);
    await page.click("button[type='submit']");

    await page.click("button:has-text('Dashboard')");
    await expect(page.locator("text=HR Flow AI Dashboard")).toBeVisible();
    await expect(page.locator("text=Key Performance Indicators")).toBeVisible();
  });

  test("TEST 7: HR uploads company policy", async ({ page }) => {
    await page.goto("/");
    await page.fill("input[type='email']", hrEmail);
    await page.fill("input[type='password']", hrPassword);
    await page.click("button[type='submit']");

    await page.click("button:has-text('Company Policy')");
    await expect(page.locator("text=Company HR Policy Management")).toBeVisible();
    await expect(page.locator("text=Upload New Policy Document")).toBeVisible();
  });

  test("TEST 8: HR sees pending leave", async ({ page, request }) => {
    // Check via API
    const requestsRes = await request.get("http://127.0.0.1:5000/leave/requests", {
      headers: { Authorization: `Bearer ${hrToken}` }
    });
    expect(requestsRes.status()).toBe(200);
    const list = await requestsRes.json();
    const pendingReq = list.find((req) => req._id.toString() === createdLeaveId.toString());
    expect(pendingReq).toBeDefined();
    expect(pendingReq.status).toBe("PENDING");

    // Check via UI
    await page.goto("/");
    await page.fill("input[type='email']", hrEmail);
    await page.fill("input[type='password']", hrPassword);
    await page.click("button[type='submit']");

    await page.click("button:has-text('All Leave Requests')");
    await expect(page.locator("span", { hasText: "PENDING REVIEW" }).first()).toBeVisible();
  });

  test("TEST 9: HR triggers AI evaluation", async ({ request }) => {
    const evalRes = await request.post(`http://127.0.0.1:5000/leave/${createdLeaveId}/evaluate`, {
      headers: { Authorization: `Bearer ${hrToken}` }
    });
    expect(evalRes.status()).toBe(200);
    const evalData = await evalRes.json();
    expect(evalData.leaveRequest.recommendation).toBeDefined();
    expect(evalData.leaveRequest.status).toBe("PENDING");
  });

  test("TEST 10: AI evaluation result is visible to HR", async ({ page, request }) => {
    const detailsRes = await request.get(`http://127.0.0.1:5000/leave/requests/${createdLeaveId}`, {
      headers: { Authorization: `Bearer ${hrToken}` }
    });
    expect(detailsRes.status()).toBe(200);
    const details = await detailsRes.json();
    expect(details.recommendation).toBeDefined();
    expect(details.policyAnalysis).toBeDefined();

    // Verify UI view
    await page.goto("/");
    await page.fill("input[type='email']", hrEmail);
    await page.fill("input[type='password']", hrPassword);
    await page.click("button[type='submit']");
    await page.click("button:has-text('All Leave Requests')");
    await expect(page.locator("button", { hasText: "View AI Report" }).first()).toBeVisible();
  });

  test("TEST 11: Employee cannot access HR AI evaluation results", async ({ request }) => {
    const analyticsRes = await request.get("http://127.0.0.1:5000/analytics", {
      headers: { Authorization: `Bearer ${empToken}` }
    });
    expect(analyticsRes.status()).toBe(403);
  });

  test("TEST 12: HR approves leave (ASSERT: Final status becomes APPROVED)", async ({ request }) => {
    const decisionRes = await request.post(`http://127.0.0.1:5000/leave/${createdLeaveId}/decision`, {
      headers: { Authorization: `Bearer ${hrToken}` },
      data: { status: "APPROVED", comments: "Approved based on policy adherence." }
    });
    expect(decisionRes.status()).toBe(200);
    const updatedData = await decisionRes.json();
    
    // ASSERT: Final status becomes APPROVED
    expect(updatedData.leaveRequest.status).toBe("APPROVED");
  });

  test("TEST 13: HR rejects leave (ASSERT: Final status becomes REJECTED)", async ({ request }) => {
    // Submit a second leave request
    const leaveRes = await request.post("http://127.0.0.1:5000/leave", {
      headers: { Authorization: `Bearer ${empToken}` },
      data: {
        name: empName,
        department: "Engineering",
        leaveType: "Unpaid",
        days: 15,
        reason: "Extended leave request."
      }
    });
    expect(leaveRes.status()).toBe(201);
    secondLeaveId = (await leaveRes.json()).leaveRequest._id;

    // HR rejects request
    const decisionRes = await request.post(`http://127.0.0.1:5000/leave/${secondLeaveId}/decision`, {
      headers: { Authorization: `Bearer ${hrToken}` },
      data: { status: "REJECTED", comments: "Exceeds allowed consecutive leave policy limit." }
    });
    expect(decisionRes.status()).toBe(200);
    const updatedData = await decisionRes.json();

    // ASSERT: Final status becomes REJECTED
    expect(updatedData.leaveRequest.status).toBe("REJECTED");
  });

  test("TEST 14: Employee receives notification", async ({ request }) => {
    const notifRes = await request.get("http://127.0.0.1:5000/notifications", {
      headers: { Authorization: `Bearer ${empToken}` }
    });
    expect(notifRes.status()).toBe(200);
    const notifications = await notifRes.json();
    expect(notifications.length).toBeGreaterThan(0);
    
    const approvedNotif = notifications.find((n) => n.leaveRequestId?.toString() === createdLeaveId.toString());
    expect(approvedNotif).toBeDefined();
    expect(approvedNotif.recipient).toBe(empEmail);
    expect(approvedNotif.subject).toContain("APPROVED");
  });

  test("TEST 15: Audit log is created", async ({ request }) => {
    const auditRes = await request.get("http://127.0.0.1:5000/auditlogs", {
      headers: { Authorization: `Bearer ${hrToken}` }
    });
    expect(auditRes.status()).toBe(200);
    const auditLogs = await auditRes.json();
    expect(auditLogs.length).toBeGreaterThan(0);

    const matchingAudit = auditLogs.find((log) => log.leaveRequestId.toString() === createdLeaveId.toString());
    expect(matchingAudit).toBeDefined();
    expect(matchingAudit.decision).toBe("APPROVED");
  });
});
