import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { User } from "../models/User.js";

/**
 * Middleware to protect routes via JWT verification
 */
export async function protect(req, res, next) {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "hrflow_ai_jwt_secret_key_2026");

      if (mongoose.connection.readyState === 1) {
        try {
          req.user = await User.findById(decoded.id).select("-password");
        } catch (dbErr) {
          console.warn("⚠️ Database query warning in protect middleware:", dbErr.message);
        }
      }

      if (!req.user && decoded.id && decoded.role) {
        req.user = {
          _id: decoded.id,
          id: decoded.id,
          role: decoded.role,
          name: decoded.name || "Authenticated User",
          email: decoded.email || "user@company.com",
          department: decoded.department || "Engineering",
        };
      }

      if (!req.user) {
        return res.status(401).json({ error: "Not authorized, user not found" });
      }

      return next();
    } catch (error) {
      console.error("❌ Auth Middleware Error:", error.message);
      return res.status(401).json({ error: "Not authorized, invalid token" });
    }
  }

  if (!token) {
    return res.status(401).json({ error: "Not authorized, no token provided" });
  }
}

/**
 * Middleware to authorize specific user roles (e.g. 'hr', 'employee')
 */
export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden: User role '${req.user?.role}' is not authorized to access this resource`,
      });
    }
    next();
  };
}
