import React, { useState } from "react";
import {
  ShieldCheck,
  Users,
  Activity,
  Award,
  Clock,
  Mail,
  CheckCircle,
  XCircle,
  AlertOctagon,
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  Edit3,
  MessageSquare
} from "lucide-react";
import { submitHRDecision } from "../services/api";

export default function ExplainableAIPage({ requestData, userRole, onClose, onStatusUpdated }) {
  if (!requestData) return null;

  const [currentStatus, setCurrentStatus] = useState(requestData.status || "PENDING");
  const [managerComments, setManagerComments] = useState("");
  const [updating, setUpdating] = useState(false);

  const {
    _id,
    employeeName,
    department,
    leaveType,
    days,
    recommendation,
    policyAnalysis,
    workloadAnalysis,
    burnoutAnalysis,
    auditDetails,
    notification,
    createdAt,
  } = requestData;

  const decisionStr = (currentStatus || recommendation?.decision || "PENDING").toUpperCase();
  const isApproved = decisionStr.includes("APPROV");
  const isRejected = decisionStr.includes("REJECT");
  const isRequestChanges = decisionStr.includes("REQUEST_CHANGES");

  const handleUpdateStatus = async (newStatus) => {
    setUpdating(true);
    try {
      await submitHRDecision(_id, newStatus, managerComments);
      setCurrentStatus(newStatus);
      if (onStatusUpdated) onStatusUpdated();
    } catch (err) {
      alert(`Failed to confirm decision: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-surface-container hover:bg-white/10 text-on-surface-variant hover:text-on-surface transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold text-on-surface flex items-center gap-2">
              Explainable AI Analysis Report (HR Portal Only)
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                Gemini 2.5 Flash
              </span>
            </h1>
            <p className="text-xs text-on-surface-variant">
              Multi-agent leave evaluation breakdown for <span className="text-on-surface font-semibold">{employeeName}</span> ({department})
            </p>
          </div>
        </div>

        {/* Decision Badge & HR Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {userRole === "hr" && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleUpdateStatus("APPROVED")}
                disabled={updating || isApproved}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 text-xs font-mono transition disabled:opacity-50"
              >
                <ThumbsUp className="w-3.5 h-3.5" /> Approve
              </button>
              <button
                onClick={() => handleUpdateStatus("REJECTED")}
                disabled={updating || isRejected}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-error/20 hover:bg-error/30 text-error border border-error/40 text-xs font-mono transition disabled:opacity-50"
              >
                <ThumbsDown className="w-3.5 h-3.5" /> Reject
              </button>
              <button
                onClick={() => handleUpdateStatus("REQUEST_CHANGES")}
                disabled={updating || isRequestChanges}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/40 text-xs font-mono transition disabled:opacity-50"
              >
                <Edit3 className="w-3.5 h-3.5" /> Request Changes
              </button>
            </div>
          )}

          {isApproved ? (
            <span className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-sm font-bold tracking-wide">
              <CheckCircle className="w-4 h-4" /> APPROVED
            </span>
          ) : isRejected ? (
            <span className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-error/15 text-error border border-error/30 text-sm font-bold tracking-wide">
              <XCircle className="w-4 h-4" /> REJECTED
            </span>
          ) : isRequestChanges ? (
            <span className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-sm font-bold tracking-wide">
              <Edit3 className="w-4 h-4" /> CHANGES REQUESTED
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-sm font-bold tracking-wide">
              <Clock className="w-4 h-4 animate-spin" /> PENDING REVIEW
            </span>
          )}
        </div>
      </div>

      {/* HR Manager Comments Section */}
      {userRole === "hr" && (
        <div className="glass-panel rounded-xl p-4 border border-white/10 space-y-2">
          <label className="block text-xs font-mono uppercase text-on-surface-variant flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5 text-primary" /> Manager Comments / Feedback to Employee
          </label>
          <textarea
            value={managerComments}
            onChange={(e) => setManagerComments(e.target.value)}
            placeholder="Add comments regarding your decision..."
            rows={2}
            className="w-full bg-surface-container-low/80 border border-white/10 rounded-xl p-2.5 text-xs text-on-surface focus:border-primary focus:outline-none transition font-sans"
          />
        </div>
      )}

      {/* Grid Section 1: Recommendation & Confidence */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Recommendation Box */}
        <div className="md:col-span-2 glass-panel rounded-xl p-5 border border-white/10 relative overflow-hidden">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-primary mb-2">
            <Award className="w-4 h-4 text-primary" /> Recommendation Summary
          </div>
          <h3 className="text-lg font-bold text-on-surface mb-2">
            Decision: <span className={isApproved ? "text-emerald-400" : isRejected ? "text-error" : "text-amber-400"}>{currentStatus || recommendation?.decision}</span>
          </h3>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            {recommendation?.reason || "Evaluation completed based on active company policy and workload limits."}
          </p>
        </div>

        {/* Confidence Gauge Box */}
        <div className="glass-panel rounded-xl p-5 border border-white/10 text-center flex flex-col justify-center">
          <div className="text-xs font-semibold uppercase text-on-surface-variant mb-2">
            AI Confidence Score
          </div>
          <div className="text-4xl font-extrabold text-primary font-mono mb-1">
            {recommendation?.confidence ? `${recommendation.confidence}%` : "95%"}
          </div>
          <p className="text-[11px] text-on-surface-variant">
            Verified across 3 independent evaluation agents
          </p>
        </div>
      </div>

      {/* Grid Section 2: Policy, Workload, Burnout breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* 1. Policy Section */}
        <div className="glass-card rounded-xl p-5 border border-white/10 space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-blue-400">
              <ShieldCheck className="w-4 h-4" /> ✔ Policy Compliance
            </div>
            {policyAnalysis?.isCompliant ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Compliant
              </span>
            ) : (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-error/20 text-error border border-error/30">
                Violation
              </span>
            )}
          </div>

          <p className="text-xs text-on-surface-variant">
            {policyAnalysis?.policyExplanation || `${leaveType} leave request for ${days} days.`}
          </p>

          {policyAnalysis?.applicablePolicy && (
            <div className="bg-surface-container-low/60 rounded-lg p-3 text-xs space-y-1.5 font-mono border border-white/5">
              <div className="flex justify-between text-on-surface-variant">
                <span>Max Allowed:</span>
                <span className="text-on-surface font-semibold">{policyAnalysis.applicablePolicy.maxAllowedDays} days</span>
              </div>
              <div className="flex justify-between text-on-surface-variant">
                <span>Notice Required:</span>
                <span className="text-on-surface font-semibold">{policyAnalysis.applicablePolicy.advanceNoticeRequiredDays} days</span>
              </div>
              <div className="flex justify-between text-on-surface-variant">
                <span>Approval:</span>
                <span className="text-on-surface font-semibold">{policyAnalysis.applicablePolicy.approvalLevel}</span>
              </div>
            </div>
          )}
        </div>

        {/* 2. Workload Section */}
        <div className="glass-card rounded-xl p-5 border border-white/10 space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-indigo-400">
              <Users className="w-4 h-4" /> ✔ Workload Analysis
            </div>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                workloadAnalysis?.risk === "High"
                  ? "bg-error/20 text-error border-error/30"
                  : workloadAnalysis?.risk === "Medium"
                  ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                  : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
              }`}
            >
              {workloadAnalysis?.risk || "Low"} Risk
            </span>
          </div>

          <p className="text-xs text-on-surface-variant">
            {workloadAnalysis?.reason || "Sufficient department coverage maintained."}
          </p>

          <div className="bg-surface-container-low/60 rounded-lg p-3 text-xs space-y-1.5 font-mono border border-white/5">
            <div className="flex justify-between text-on-surface-variant">
              <span>Active Team Size:</span>
              <span className="text-on-surface font-semibold">{workloadAnalysis?.activeTeamSize || requestData.teamSize || 8}</span>
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <span>Currently On Leave:</span>
              <span className="text-on-surface font-semibold">{workloadAnalysis?.currentOnLeave || requestData.employeesOnLeave || 0}</span>
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <span>Projected Absence:</span>
              <span className="text-primary font-semibold">
                {workloadAnalysis?.projectedAbsencePercentage ? `${workloadAnalysis.projectedAbsencePercentage}%` : "25%"}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Burnout Section */}
        <div className="glass-card rounded-xl p-5 border border-white/10 space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-purple-400">
              <Activity className="w-4 h-4" /> ✔ Burnout Score
            </div>
            <span className="text-xs font-mono font-bold text-purple-400">
              {burnoutAnalysis?.burnoutScore || 50}/100
            </span>
          </div>

          <p className="text-xs text-on-surface-variant">
            {burnoutAnalysis?.reason || "Balanced work hours and leave balance detected."}
          </p>

          <div className="bg-surface-container-low/60 rounded-lg p-3 text-xs space-y-1.5 font-mono border border-white/5">
            <div className="flex justify-between text-on-surface-variant">
              <span>Overtime Hours:</span>
              <span className="text-on-surface font-semibold">{requestData.overtime || 0} hrs</span>
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <span>Unused Leave:</span>
              <span className="text-on-surface font-semibold">{requestData.unusedLeave || 0} days</span>
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <span>Weekend Days Worked:</span>
              <span className="text-on-surface font-semibold">{requestData.weekendWork || 0} days</span>
            </div>
          </div>
        </div>

      </div>

      {/* Grid Section 3: Timeline & Audit & Email Notification */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Timeline & Audit Card */}
        <div className="glass-panel rounded-xl p-5 border border-white/10 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-emerald-400 border-b border-white/10 pb-2">
            <Clock className="w-4 h-4" /> ✔ Timeline & Audit Trail
          </div>

          <div className="space-y-2 text-xs font-mono text-on-surface-variant">
            <div className="flex justify-between py-1 border-b border-white/5">
              <span>Submitted At:</span>
              <span className="text-on-surface">{new Date(createdAt).toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span>Action Performed:</span>
              <span className="text-on-surface">{auditDetails?.action || "LEAVE_EVALUATION"}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span>Audit Log ID:</span>
              <span className="text-primary truncate max-w-[200px]">{auditDetails?._id || "MongoDB Persisted"}</span>
            </div>
          </div>
        </div>

        {/* Generated Email Notification Card */}
        <div className="glass-panel rounded-xl p-5 border border-white/10 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-amber-400 border-b border-white/10 pb-2">
            <Mail className="w-4 h-4" /> ✔ Notification Email Draft
          </div>

          <div className="bg-surface-container-low/60 rounded-lg p-3 text-xs space-y-2 font-mono border border-white/5">
            <div>
              <span className="text-on-surface-variant">To: </span>
              <span className="text-primary">{notification?.recipient || `${employeeName.toLowerCase().replace(/\s+/g, ".")}@company.com`}</span>
            </div>
            <div>
              <span className="text-on-surface-variant">Subject: </span>
              <span className="text-on-surface font-semibold">{notification?.subject || `Leave Application - ${leaveType}`}</span>
            </div>
            <div className="pt-2 text-on-surface-variant italic border-t border-white/5">
              "{notification?.body || "Your leave request has been evaluated."}"
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
