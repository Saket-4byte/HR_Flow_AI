import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import aiRoutes from "./routes/aiRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import policyRoutes from "./routes/policyRoutes.js";
import connectDB from "./config/db.js";

// Initialize environment variables from .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB Atlas
connectDB();

// Enable CORS and JSON body parsing middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Mount Authentication, Policy, and AI/HR routes
app.use("/auth", authRoutes);
app.use("/policy", policyRoutes);
app.use("/", aiRoutes);

// General 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    availableEndpoints: [
      "GET /health",
      "POST /auth/login",
      "POST /auth/register",
      "GET /auth/profile",
      "POST /policy/upload",
      "GET /policy/latest",
      "GET /policy/all",
      "GET /users/employees",
      "POST /leave",
      "POST /chat",
      "GET /leave/requests",
      "GET /leave/requests/:id",
      "PATCH /leave/requests/:id/status",
      "GET /auditlogs",
      "GET /notifications",
      "GET /analytics",
    ],
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error("❌ Global Server Error:", err);
  res.status(500).json({
    error: "Internal Server Error",
    message: err.message,
  });
});

// Start listening on configured port with error handling
const server = app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`🚀 HRFlow AI Backend Server live on port ${PORT}`);
  console.log(`🟢 Health Check:     GET   http://localhost:${PORT}/health`);
  console.log(`🔑 Auth Login:       POST  http://localhost:${PORT}/auth/login`);
  console.log(`📝 Auth Register:    POST  http://localhost:${PORT}/auth/register`);
  console.log(`👤 Auth Profile:     GET   http://localhost:${PORT}/auth/profile`);
  console.log(`📄 Policy Upload:    POST  http://localhost:${PORT}/policy/upload`);
  console.log(`📄 Policy Latest:    GET   http://localhost:${PORT}/policy/latest`);
  console.log(`👥 Employee Mgmt:    GET   http://localhost:${PORT}/users/employees`);
  console.log(`📩 Leave Workflow:    POST  http://localhost:${PORT}/leave`);
  console.log(`💬 HR Chatbot:        POST  http://localhost:${PORT}/chat`);
  console.log(`📋 All Requests:      GET   http://localhost:${PORT}/leave/requests`);
  console.log(`📄 Single Request:    GET   http://localhost:${PORT}/leave/requests/:id`);
  console.log(`✏️ Update Status:     PATCH http://localhost:${PORT}/leave/requests/:id/status`);
  console.log(`📜 Audit Logs:        GET   http://localhost:${PORT}/auditlogs`);
  console.log(`📧 Notifications:     GET   http://localhost:${PORT}/notifications`);
  console.log(`📊 Analytics:         GET   http://localhost:${PORT}/analytics`);
  console.log(`==================================================`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`❌ Port ${PORT} is already in use by another Node process.`);
    console.error(`👉 Run: npx kill-port ${PORT} or kill the process using port ${PORT}.`);
  } else {
    console.error("❌ Server Error:", err);
  }
});

export default app;
