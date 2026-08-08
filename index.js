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
app.use((err, req, res, _next) => {
  console.error("❌ Global Server Error:", err);
  res.status(500).json({
    error: "Internal Server Error",
    message: err.message,
  });
});

// Connect to Database & Start Server
async function startServer() {
  await connectDB();
  const server = app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`🚀 HRFlow AI Backend Server live on port ${PORT}`);
    console.log(`🟢 Health Check:     GET   http://localhost:${PORT}/health`);
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

  return server;
}

if (process.env.NODE_ENV !== "test") {
  await startServer();
}

export default app;
