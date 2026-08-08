import { Router } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

/**
 * Generate JWT token
 */
function generateToken(id, role) {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || "hrflow_ai_jwt_secret_key_2026", {
    expiresIn: "30d",
  });
}

/**
 * POST /auth/register
 * Employee Registration Endpoint ONLY.
 * Fields: name, employeeId, department, email, password
 */
router.post("/register", async (req, res) => {
  try {
    const { name, employeeId, department, email, password } = req.body;

    if (!name || !department || !email || !password) {
      return res.status(400).json({ error: "Please fill in all required fields: name, department, email, password." });
    }

    // HR registration is explicitly forbidden
    if (req.body.role === "hr") {
      return res.status(403).json({ error: "HR accounts cannot be created via public registration. HR accounts are pre-created." });
    }

    // Check if user with email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ error: "An account with this email already exists." });
    }

    // Create new Employee account
    const user = await User.create({
      name: name.trim(),
      employeeId: employeeId?.trim() || `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      department: department.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: "employee",
      overtime: 0,
      unusedLeave: 12,
      weekendWork: 0,
    });

    const token = generateToken(user._id, user.role);

    return res.status(201).json({
      message: "Employee registered successfully!",
      token,
      user: {
        id: user._id,
        name: user.name,
        employeeId: user.employeeId,
        email: user.email,
        role: user.role,
        department: user.department,
        overtime: user.overtime,
        unusedLeave: user.unusedLeave,
        weekendWork: user.weekendWork,
      },
    });
  } catch (error) {
    console.error("❌ Employee Register Error:", error);
    return res.status(500).json({ error: "Server error during registration", message: error.message });
  }
});

/**
 * POST /auth/login
 * Authenticate user (Employee or HR) & return JWT token
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Please provide email and password" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (user && (await user.matchPassword(password))) {
      const token = generateToken(user._id, user.role);

      return res.status(200).json({
        token,
        user: {
          id: user._id,
          name: user.name,
          employeeId: user.employeeId,
          email: user.email,
          role: user.role,
          department: user.department,
          overtime: user.overtime,
          unusedLeave: user.unusedLeave,
          weekendWork: user.weekendWork,
        },
      });
    } else {
      return res.status(401).json({ error: "Invalid email or password" });
    }
  } catch (error) {
    console.error("❌ Auth Login Error:", error);
    return res.status(500).json({ error: "Server error during login", message: error.message });
  }
});

/**
 * GET /auth/profile
 * Get current logged in user profile
 */
router.get("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(200).json(user);
  } catch (error) {
    console.error("❌ Profile Error:", error);
    return res.status(500).json({ error: "Server error fetching profile", message: error.message });
  }
});

export default router;
