import mongoose from "mongoose";

const PolicySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      default: "PDF",
    },
    rawContent: {
      type: String,
      required: true,
    },
    extractedRules: {
      companyName: { type: String, default: "Company Policy" },
      maxConsecutiveLeaveDays: { type: Number, default: 14 },
      minNoticeDaysRequired: { type: Number, default: 2 },
      maxLeavePerYear: { type: Number, default: 24 },
      probationLeaveRestriction: { type: Boolean, default: true },
      allowedLeaveTypes: {
        type: [String],
        default: ["Casual", "Sick", "Earned", "Maternity", "Paternity", "Bereavement"],
      },
      policySummary: { type: String, default: "" },
    },
    uploadedBy: {
      type: String,
      default: "HR Admin",
    },
    isLatest: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Policy = mongoose.models.Policy || mongoose.model("Policy", PolicySchema);
export default Policy;
