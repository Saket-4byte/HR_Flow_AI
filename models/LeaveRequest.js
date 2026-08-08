import mongoose from "mongoose";

const LeaveRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    employeeName: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    leaveType: {
      type: String,
      required: true,
      trim: true,
    },
    days: {
      type: Number,
      required: true,
    },
    teamSize: {
      type: Number,
      default: 1,
    },
    employeesOnLeave: {
      type: Number,
      default: 0,
    },
    overtime: {
      type: Number,
      default: 0,
    },
    unusedLeave: {
      type: Number,
      default: 0,
    },
    weekendWork: {
      type: Number,
      default: 0,
    },
    policyCheck: {
      type: mongoose.Schema.Types.Mixed,
    },
    workloadAnalysis: {
      type: mongoose.Schema.Types.Mixed,
    },
    burnoutAnalysis: {
      type: mongoose.Schema.Types.Mixed,
    },
    recommendation: {
      type: mongoose.Schema.Types.Mixed,
    },
    email: {
      type: mongoose.Schema.Types.Mixed,
    },
    status: {
      type: String,
      enum: ["APPROVED", "REJECTED", "FLAGGED", "PENDING"],
      default: "PENDING",
    },
  },
  {
    timestamps: true,
  }
);

export const LeaveRequest = mongoose.models.LeaveRequest || mongoose.model("LeaveRequest", LeaveRequestSchema);
export default LeaveRequest;
