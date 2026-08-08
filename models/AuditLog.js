import mongoose from "mongoose";

const AuditLogSchema = new mongoose.Schema(
  {
    leaveRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LeaveRequest",
      required: true,
    },
    employeeName: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      default: "LEAVE_EVALUATION",
    },
    decision: {
      type: String,
    },
    policyCompliance: {
      type: mongoose.Schema.Types.Mixed,
    },
    workloadImpact: {
      type: mongoose.Schema.Types.Mixed,
    },
    burnoutRisk: {
      type: mongoose.Schema.Types.Mixed,
    },
    auditDetails: {
      type: mongoose.Schema.Types.Mixed,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const AuditLog = mongoose.models.AuditLog || mongoose.model("AuditLog", AuditLogSchema);
export default AuditLog;
