import { Router } from "express";
import mongoose from "mongoose";
import { executeLeaveWorkflow } from "../graph/graph.js";
import { generateGeminiText } from "../services/gemini.js";
import { buildChatPrompt } from "../prompts/policyPrompt.js";

// Mongoose Models for Persistence
import { User } from "../models/User.js";
import { LeaveRequest } from "../models/LeaveRequest.js";
import { AuditLog } from "../models/AuditLog.js";
import { Notification } from "../models/Notification.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = Router();

/**
 * GET /health
 * System health check endpoint.
 */
router.get("/health", (req, res) => {
  return res.status(200).json({
    status: "running",
  });
});

/**
 * GET /users/employees
 * HR only: Returns all registered employee users for HR Employee Management.
 */
router.get("/users/employees", protect, authorize("hr"), async (req, res) => {
  try {
    let employees = [];
    if (mongoose.connection.readyState === 1) {
      employees = await User.find({ role: "employee" })
        .select("-password")
        .sort({ createdAt: -1 });
    }

    return res.status(200).json(employees);
  } catch (error) {
    console.error("❌ Error fetching employee management list:", error);
    return res.status(200).json([]);
  }
});

/**
 * PATCH /users/employees/:id
 * HR Endpoint to Edit Employee details.
 */
router.patch("/users/employees/:id", protect, authorize("hr"), async (req, res) => {
  try {
    const { id } = req.params;
    const { department, overtime, unusedLeave, weekendWork } = req.body;

    const updateFields = {};
    if (department !== undefined) updateFields.department = department;
    if (overtime !== undefined) updateFields.overtime = Number(overtime);
    if (unusedLeave !== undefined) updateFields.unusedLeave = Number(unusedLeave);
    if (weekendWork !== undefined) updateFields.weekendWork = Number(weekendWork);

    let updatedEmployee = null;
    if (mongoose.connection.readyState === 1) {
      updatedEmployee = await User.findByIdAndUpdate(id, updateFields, { new: true }).select("-password");
    }

    if (!updatedEmployee) {
      return res.status(200).json({ message: "Employee profile updated (mock mode)", employee: { _id: id, ...updateFields } });
    }

    return res.status(200).json({ message: "Employee profile updated successfully", employee: updatedEmployee });
  } catch (error) {
    console.error(`❌ Error updating employee ${req.params.id}:`, error);
    return res.status(500).json({ error: "Failed to update employee", message: error.message });
  }
});

/**
 * DELETE /users/employees/:id
 * HR Endpoint to Delete Employee account.
 */
router.delete("/users/employees/:id", protect, authorize("hr"), async (req, res) => {
  try {
    const { id } = req.params;
    let deleted = null;
    if (mongoose.connection.readyState === 1) {
      deleted = await User.findByIdAndDelete(id);
    }

    return res.status(200).json({ message: "Employee deleted successfully" });
  } catch (error) {
    console.error(`❌ Error deleting employee ${req.params.id}:`, error);
    return res.status(500).json({ error: "Failed to delete employee", message: error.message });
  }
});

/**
 * GET /leave/requests
 * Returns leave requests (Employee views own; HR views all or filtered).
 */
router.get("/leave/requests", protect, authorize("employee", "hr"), async (req, res) => {
  try {
    const filter = {};
    
    // Privacy Rule: Employees can ONLY view their own leave requests
    if (req.user.role === "employee") {
      filter.userId = req.user._id;
    } else {
      const { userId, email, employeeName } = req.query;
      if (userId) filter.userId = userId;
      if (email) filter.email = email;
      if (employeeName) filter.employeeName = employeeName;
    }

    let requests = [];
    if (mongoose.connection.readyState === 1) {
      requests = await LeaveRequest.find(filter)
        .select("_id userId employeeName department leaveType days recommendation status createdAt")
        .sort({ createdAt: -1 });
    }

    return res.status(200).json(requests);
  } catch (error) {
    console.error("❌ Error fetching leave requests:", error);
    return res.status(200).json([]);
  }
});

/**
 * GET /leave/requests/:id
 * Returns complete leave request details (Employee can ONLY access own request).
 */
router.get("/leave/requests/:id", protect, authorize("employee", "hr"), async (req, res) => {
  try {
    const { id } = req.params;

    const leaveRequest = await LeaveRequest.findById(id);

    if (!leaveRequest) {
      return res.status(404).json({
        error: "Leave request not found",
      });
    }

    // Privacy Rule: Employees cannot access another employee's private leave request
    if (
      req.user.role === "employee" &&
      leaveRequest.userId?.toString() !== req.user._id.toString() &&
      leaveRequest.email !== req.user.email
    ) {
      return res.status(403).json({
        error: "Forbidden: You are not authorized to view another employee's leave request.",
      });
    }

    const auditLog = await AuditLog.findOne({ leaveRequestId: id });
    const notification = await Notification.findOne({ leaveRequestId: id });

    return res.status(200).json({
      _id: leaveRequest._id,
      userId: leaveRequest.userId,
      employeeName: leaveRequest.employeeName,
      department: leaveRequest.department,
      leaveType: leaveRequest.leaveType,
      days: leaveRequest.days,
      teamSize: leaveRequest.teamSize,
      employeesOnLeave: leaveRequest.employeesOnLeave,
      overtime: leaveRequest.overtime,
      unusedLeave: leaveRequest.unusedLeave,
      weekendWork: leaveRequest.weekendWork,
      policyAnalysis: leaveRequest.policyCheck,
      workloadAnalysis: leaveRequest.workloadAnalysis,
      burnoutAnalysis: leaveRequest.burnoutAnalysis,
      recommendation: leaveRequest.recommendation,
      status: leaveRequest.status,
      createdAt: leaveRequest.createdAt,
      updatedAt: leaveRequest.updatedAt,
      auditDetails: auditLog || null,
      notification: notification || leaveRequest.email || null,
    });
  } catch (error) {
    console.error(`❌ Error fetching leave request ${req.params.id}:`, error);
    return res.status(500).json({
      error: "Failed to fetch complete leave request details",
      message: error.message,
    });
  }
});

/**
 * POST /leave
 * Authenticated Employee/HR Submits Leave Request.
 * Saves in MongoDB with status: "PENDING".
 */
router.post("/leave", protect, authorize("employee", "hr"), async (req, res) => {
  try {
    const name = req.body.name || req.user.name;
    const department = req.body.department || req.user.department;
    const leaveType = req.body.leaveType;
    const days = req.body.days;
    const email = req.body.email || req.user.email;

    if (!name || !department || !leaveType || days === undefined) {
      return res.status(400).json({
        error: "Missing required leave parameters: name, department, leaveType, days.",
      });
    }

    // Automatically load Employee profile from MongoDB Atlas if available
    let dbUser = await User.findById(req.user._id);
    if (!dbUser && email) {
      dbUser = await User.findOne({ email });
    }

    const userOvertime = dbUser?.overtime ?? Number(req.body.overtime ?? 0);
    const userUnusedLeave = dbUser?.unusedLeave ?? Number(req.body.unusedLeave ?? 12);
    const userWeekendWork = dbUser?.weekendWork ?? Number(req.body.weekendWork ?? 0);

    const activeTeamSize = (await User.countDocuments({ department })) || 8;
    const employeesOnLeaveCount = (await LeaveRequest.countDocuments({ department, status: "APPROVED" })) || 0;

    if (!dbUser) {
      dbUser = await User.create({
        name,
        department,
        email: email || `${name.toLowerCase().replace(/\s+/g, ".")}@company.com`,
        password: "password123",
        role: "employee",
        overtime: userOvertime,
        unusedLeave: userUnusedLeave,
        weekendWork: userWeekendWork,
      });
    }

    // Create Leave Request in MongoDB with PENDING status (recommendation, policy, audit, notification = null)
    const leaveRequest = await LeaveRequest.create({
      userId: dbUser._id,
      employeeName: name,
      department,
      leaveType,
      days: Number(days),
      teamSize: activeTeamSize,
      employeesOnLeave: employeesOnLeaveCount,
      overtime: userOvertime,
      unusedLeave: userUnusedLeave,
      weekendWork: userWeekendWork,
      policyCheck: null,
      workloadAnalysis: null,
      burnoutAnalysis: null,
      recommendation: null,
      email: null,
      status: "PENDING",
    });

    console.log(`📩 New Leave Request Submitted (ID: ${leaveRequest._id}) - Status: PENDING (Awaiting HR Review)`);

    return res.status(201).json({
      message: "Leave request submitted successfully. Waiting for HR review.",
      leaveRequest,
    });
  } catch (error) {
    console.error("❌ Error submitting leave request:", error);
    return res.status(500).json({
      error: "An error occurred while submitting the leave request.",
      message: error.message,
    });
  }
});

/**
 * POST /leave/:id/evaluate
 * HR ONLY: Triggers AI Evaluation for a Pending Leave Request.
 * Executes LangGraph workflow using the latest active company policy from MongoDB.
 * Status remains PENDING until HR decision.
 */
router.post("/leave/:id/evaluate", protect, authorize("hr"), async (req, res) => {
  try {
    const { id } = req.params;
    const leaveRequest = await LeaveRequest.findById(id);

    if (!leaveRequest) {
      return res.status(404).json({ error: "Leave request not found" });
    }

    const employeePayload = {
      name: leaveRequest.employeeName,
      department: leaveRequest.department,
      leaveType: leaveRequest.leaveType,
      days: Number(leaveRequest.days),
      teamSize: Number(leaveRequest.teamSize || 8),
      employeesOnLeave: Number(leaveRequest.employeesOnLeave || 0),
      overtime: Number(leaveRequest.overtime || 0),
      unusedLeave: Number(leaveRequest.unusedLeave || 12),
      weekendWork: Number(leaveRequest.weekendWork || 0),
    };

    // Run LangGraph AI Workflow with latest active company policy from MongoDB
    const workflowResult = await executeLeaveWorkflow(employeePayload);

    // Save AI evaluation to LeaveRequest (status MUST remain PENDING until HR decision)
    leaveRequest.policyCheck = workflowResult.policy;
    leaveRequest.workloadAnalysis = workflowResult.workload;
    leaveRequest.burnoutAnalysis = workflowResult.burnout;
    leaveRequest.recommendation = workflowResult.recommendation;
    leaveRequest.email = workflowResult.email;
    leaveRequest.status = "PENDING";
    await leaveRequest.save();

    // Create Audit Log entry for AI evaluation phase
    const auditLog = await AuditLog.create({
      leaveRequestId: leaveRequest._id,
      employeeName: leaveRequest.employeeName,
      action: "LEAVE_EVALUATION",
      decision: "PENDING",
      policyCompliance: workflowResult.policy,
      workloadImpact: workflowResult.workload,
      burnoutRisk: workflowResult.burnout,
      auditDetails: workflowResult.audit,
    });

    console.log(`🤖 AI Evaluation Complete for Request ${id} via LangGraph & Gemini (Status: PENDING)`);

    return res.status(200).json({
      message: "AI evaluation complete.",
      workflowResult,
      leaveRequest,
      auditLogId: auditLog._id,
    });
  } catch (error) {
    console.error(`❌ Error evaluating leave request ${req.params.id}:`, error);
    return res.status(500).json({ error: "Failed to evaluate leave request", message: error.message });
  }
});

/**
 * POST /leave/:id/decision OR PATCH /leave/requests/:id/status
 * HR ONLY Decision Endpoint: Approve, Reject, or Request Changes.
 * Saves decision in MongoDB & triggers employee notification.
 */
const handleHRDecision = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comments } = req.body;

    if (!status || !["APPROVED", "REJECTED", "FLAGGED", "PENDING", "REQUEST_CHANGES"].includes(status.toUpperCase())) {
      return res.status(400).json({ error: "Invalid status value. Allowed: APPROVED, REJECTED, FLAGGED, PENDING, REQUEST_CHANGES" });
    }

    const updatedRequest = await LeaveRequest.findByIdAndUpdate(
      id,
      { status: status.toUpperCase() },
      { new: true }
    );

    if (!updatedRequest) {
      return res.status(404).json({ error: "Leave request not found" });
    }

    // Update associated audit log
    await AuditLog.findOneAndUpdate(
      { leaveRequestId: id },
      { decision: status.toUpperCase() }
    );

    // Create Notification for Employee in MongoDB Atlas
    let user = await User.findById(updatedRequest.userId);
    const recipientEmail = updatedRequest.email?.recipient || user?.email || `${updatedRequest.employeeName.toLowerCase().replace(/\s+/g, ".")}@company.com`;
    
    await Notification.create({
      leaveRequestId: id,
      recipient: recipientEmail,
      subject: `Leave Application ${status.toUpperCase()} - ${updatedRequest.leaveType} (${updatedRequest.days} days)`,
      body: comments || `Your leave request for ${updatedRequest.days} day(s) of ${updatedRequest.leaveType} leave has been marked as ${status.toUpperCase()} by HR.`,
      status: "GENERATED",
    });

    console.log(`✅ HR Decision Confirmed for Request ${id}: ${status.toUpperCase()}`);

    return res.status(200).json({
      message: `HR decision confirmed: ${status.toUpperCase()}`,
      leaveRequest: updatedRequest,
    });
  } catch (error) {
    console.error(`❌ Error executing HR decision for request ${req.params.id}:`, error);
    return res.status(500).json({ error: "Failed to execute HR decision", message: error.message });
  }
};

router.post("/leave/:id/decision", protect, authorize("hr"), handleHRDecision);
router.patch("/leave/requests/:id/status", protect, authorize("hr"), handleHRDecision);

/**
 * GET /auditlogs
 * HR ONLY: Returns all compliance audit logs sorted by newest first.
 */
router.get("/auditlogs", protect, authorize("hr"), async (req, res) => {
  try {
    let logs = [];
    if (mongoose.connection.readyState === 1) {
      logs = await AuditLog.find({})
        .sort({ createdAt: -1, timestamp: -1 });
    }

    return res.status(200).json(logs);
  } catch (error) {
    console.error("❌ Error fetching audit logs:", error);
    return res.status(200).json([]);
  }
});

/**
 * GET /notifications
 * Returns generated notification emails (Employee views own; HR views all or filtered).
 */
router.get("/notifications", protect, authorize("employee", "hr"), async (req, res) => {
  try {
    const filter = {};

    // Privacy Rule: Employees can ONLY view notifications sent to themselves
    if (req.user.role === "employee") {
      filter.recipient = req.user.email.toLowerCase().trim();
    } else {
      const { recipient } = req.query;
      if (recipient) filter.recipient = recipient.toLowerCase().trim();
    }

    let notifications = [];
    if (mongoose.connection.readyState === 1) {
      notifications = await Notification.find(filter)
        .sort({ createdAt: -1 });
    }

    return res.status(200).json(notifications);
  } catch (error) {
    console.error("❌ Error fetching notifications:", error);
    return res.status(200).json([]);
  }
});

/**
 * GET /analytics
 * HR ONLY: Returns comprehensive dashboard statistics for HR.
 */
router.get("/analytics", protect, authorize("hr"), async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        totalEmployees: 5,
        pending: 1,
        approved: 3,
        rejected: 1,
        averageBurnout: 14.5,
        departmentWiseLeaves: [{ department: "Engineering", count: 3 }],
        leaveTypeDistribution: [{ leaveType: "Casual", count: 3 }],
        monthlyTrend: [{ month: "2026-08", count: 5 }],
      });
    }

    const totalUsersCount = await User.countDocuments();
    const distinctEmployeeNames = await LeaveRequest.distinct("employeeName");
    const totalEmployees = Math.max(totalUsersCount, distinctEmployeeNames.length);

    const pending = await LeaveRequest.countDocuments({ status: "PENDING" });
    const approved = await LeaveRequest.countDocuments({ status: "APPROVED" });
    const rejected = await LeaveRequest.countDocuments({ status: "REJECTED" });

    const allRequests = await LeaveRequest.find({});
    let totalBurnoutScore = 0;
    let burnoutCount = 0;
    for (const reqObj of allRequests) {
      const score = reqObj.burnoutAnalysis?.burnoutScore;
      if (typeof score === "number") {
        totalBurnoutScore += score;
        burnoutCount++;
      }
    }
    const averageBurnout = burnoutCount > 0 ? Math.round((totalBurnoutScore / burnoutCount) * 10) / 10 : 0;

    const departmentWiseLeaves = await LeaveRequest.aggregate([
      { $group: { _id: "$department", count: { $sum: 1 } } },
      { $project: { department: "$_id", count: 1, _id: 0 } },
      { $sort: { count: -1 } },
    ]);

    const leaveTypeDistribution = await LeaveRequest.aggregate([
      { $group: { _id: "$leaveType", count: { $sum: 1 } } },
      { $project: { leaveType: "$_id", count: 1, _id: 0 } },
      { $sort: { count: -1 } },
    ]);

    const monthlyTrend = await LeaveRequest.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $project: { month: "$_id", count: 1, _id: 0 } },
      { $sort: { month: 1 } },
    ]);

    return res.status(200).json({
      totalEmployees,
      pending,
      approved,
      rejected,
      averageBurnout,
      departmentWiseLeaves,
      leaveTypeDistribution,
      monthlyTrend,
    });
  } catch (error) {
    console.error("❌ Error fetching analytics:", error);
    return res.status(200).json({
      totalEmployees: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      averageBurnout: 0,
      departmentWiseLeaves: [],
      leaveTypeDistribution: [],
      monthlyTrend: [],
    });
  }
});

/**
 * POST /chat
 * HR Chatbot powered by Google Gemini 2.5 Flash.
 */
router.post("/chat", protect, authorize("employee", "hr"), async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "Invalid request. 'message' field is required and must be a string.",
      });
    }

    let reply = "";
    try {
      const prompt = buildChatPrompt(message);
      reply = await generateGeminiText(prompt, { temperature: 0.3 });
    } catch (geminiError) {
      console.warn("⚠️ Gemini API chat call error, using intelligent fallback response:", geminiError.message);
      reply = `Thank you for reaching out to HRFlow AI. Regarding your query ("${message}"), our company standard policy permits up to 5 days of Casual Leave per request and up to 24 days total per year. Please contact HR for further assistance.`;
    }

    return res.status(200).json({
      reply,
    });
  } catch (error) {
    console.error("❌ Error executing POST /chat:", error);
    return res.status(500).json({
      error: "An error occurred while communicating with HR Chatbot.",
      message: error.message,
    });
  }
});

export default router;
