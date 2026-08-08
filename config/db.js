import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "../models/User.js";

dotenv.config();

// Disable query buffering when disconnected to prevent 10s timeouts
mongoose.set("bufferCommands", false);

/**
 * Seed default HR and Employee accounts with password & role
 */
async function seedDefaultUsers() {
  try {
    let hrUser = await User.findOne({ email: "hr@company.com" });
    if (!hrUser) {
      await User.create({
        name: "HR Manager",
        email: "hr@company.com",
        password: "password123",
        role: "hr",
        department: "HR",
      });
      console.log("👤 Created Default HR Account: hr@company.com / password123");
    } else if (!hrUser.password || !hrUser.role) {
      hrUser.password = "password123";
      hrUser.role = "hr";
      await hrUser.save();
      console.log("👤 Updated HR Account password & role: hr@company.com / password123");
    }

    let empUser = await User.findOne({ email: "rahul@company.com" });
    if (!empUser) {
      await User.create({
        name: "Rahul Sharma",
        email: "rahul@company.com",
        password: "password123",
        role: "employee",
        department: "Engineering",
        overtime: 18,
        unusedLeave: 12,
        weekendWork: 3,
      });
      console.log("👤 Created Default Employee Account: rahul@company.com / password123");
    } else if (!empUser.password || !empUser.role) {
      empUser.password = "password123";
      empUser.role = "employee";
      await empUser.save();
      console.log("👤 Updated Employee Account password & role: rahul@company.com / password123");
    }
  } catch (seedErr) {
    console.warn("⚠️ Could not seed default users:", seedErr.message);
  }
}

let mongoServerInstance = null;

/**
 * Connects to MongoDB Atlas using Mongoose.
 */
export async function connectDB() {
  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI || mongoURI.includes("<username>") || mongoURI.includes("admin:password")) {
    console.warn("⚠️ Warning: MONGODB_URI is not set or using placeholder credentials in .env.");
    console.warn("   Please update MONGODB_URI with your MongoDB Atlas connection string.");
  }

  // Attempt 1: Connect to MongoDB Atlas (or specified MONGODB_URI)
  if (mongoURI) {
    try {
      const conn = await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 5000 });
      console.log(`🍃 MongoDB Connected: ${conn.connection.host} / ${conn.connection.name}`);
      await seedDefaultUsers();
      return conn;
    } catch (error) {
      console.error(`❌ MongoDB Primary Connection Error: ${error.message}`);
      if (
        error.message.includes("Could not connect to any servers") ||
        error.name === "MongoServerSelectionError" ||
        error.message.includes("SSL") ||
        error.message.includes("tlsv1 alert")
      ) {
        console.error("👉 IP Whitelist / TLS Connection Check Required:");
        console.error("   Your current public IP is likely not whitelisted in MongoDB Atlas Network Access, or changes are still propagating.");
        console.error("   1. Log in to MongoDB Atlas (https://cloud.mongodb.com)");
        console.error("   2. Select project containing 'Cluster0' -> Click 'Network Access' under Security");
        console.error("   3. Click '+ Add IP Address' -> Click 'Allow Access From Anywhere' (0.0.0.0/0)");
        console.error("      or add your specific current Public IP.");
        console.error("   4. Click Confirm and wait 1 to 2 minutes for cluster propagation.");
      }
      console.log("🔄 Attempting fallback to local MongoDB (mongodb://127.0.0.1:27017/hrflow)...");
    }
  }

  // Attempt 2: Fallback to local MongoDB
  try {
    const localURI = "mongodb://127.0.0.1:27017/hrflow";
    const conn = await mongoose.connect(localURI, { serverSelectionTimeoutMS: 3000 });
    console.log(`🍃 Connected to Local MongoDB: ${conn.connection.host} / ${conn.connection.name}`);
    await seedDefaultUsers();
    return conn;
  } catch {
    console.log("🔄 Attempting fallback to In-Memory MongoDB Server...");
  }

  // Attempt 3: Fallback to In-Memory MongoDB
  try {
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    mongoServerInstance = await MongoMemoryServer.create();
    const memoryURI = mongoServerInstance.getUri();
    const conn = await mongoose.connect(memoryURI);
    console.log(`🍃 Connected to In-Memory MongoDB Server: ${memoryURI}`);
    await seedDefaultUsers();
    return conn;
  } catch (memErr) {
    console.error("❌ In-Memory MongoDB Fallback Failed:", memErr.message);
    return null;
  }
}

/**
 * Disconnects Mongoose and stops In-Memory Mongo Server if running
 */
export async function disconnectDB() {
  if (mongoose.connection && mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServerInstance) {
    await mongoServerInstance.stop();
    mongoServerInstance = null;
  }
}

export default connectDB;
