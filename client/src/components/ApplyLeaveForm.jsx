import React, { useState } from "react";
import { Send, AlertCircle, Sparkles, Calendar, Briefcase, FileText, Clock, CheckCircle2 } from "lucide-react";
import { submitLeaveRequest } from "../services/api";

export default function ApplyLeaveForm({ user, onWorkflowSuccess, onCancel }) {
  const [leaveType, setLeaveType] = useState("Casual");
  const [startDate, setStartDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const defaultEnd = new Date();
    defaultEnd.setDate(defaultEnd.getDate() + 3);
    return defaultEnd.toISOString().split("T")[0];
  });
  const [reason, setReason] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Calculate duration in days automatically from startDate and endDate
  const calculateDays = () => {
    if (!startDate || !endDate) return 1;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end - start;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? diffDays : 1;
  };

  const calculatedDays = calculateDays();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!startDate || !endDate) {
      setError("Please select valid start and end dates.");
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      setError("End date cannot be earlier than start date.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: user?.name || "Employee",
        department: user?.department || "Engineering",
        email: user?.email,
        leaveType,
        days: calculatedDays,
        startDate,
        endDate,
        reason: reason.trim(),
      };

      const response = await submitLeaveRequest(payload);
      setSuccessMessage(response.message || "Leave request submitted successfully. Waiting for HR review.");
      setSubmitting(false);

      setTimeout(() => {
        if (onWorkflowSuccess) {
          onWorkflowSuccess(response);
        }
      }, 1500);
    } catch (err) {
      setError(err.message || "Failed to submit leave request.");
      setSubmitting(false);
    }
  };

  return (
    <div className="glass-panel max-w-2xl mx-auto rounded-2xl p-6 border border-white/12 shadow-2xl space-y-6">
      {/* Header */}
      <div className="border-b border-white/10 pb-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-mono mb-2">
          <Sparkles className="w-3.5 h-3.5" /> HR Leave Submission
        </div>
        <h2 className="text-xl font-bold text-on-surface">Apply For Leave</h2>
        <p className="text-xs text-on-surface-variant">
          Submit your leave application. Your request will be saved and assigned to HR for AI evaluation & approval.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-error-container/20 border border-error/30 rounded-xl text-error text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2.5 font-mono shadow-lg animate-pulse">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="font-semibold text-sm">{successMessage}</span>
        </div>
      )}

      {/* Profile info pill */}
      <div className="p-3 bg-surface-container-low/60 rounded-xl border border-white/5 flex items-center justify-between text-xs font-mono">
        <div>
          <span className="text-on-surface-variant">Employee: </span>
          <span className="text-on-surface font-semibold">{user?.name}</span>
          <span className="text-on-surface-variant font-normal"> ({user?.department})</span>
        </div>
        <div className="text-primary font-bold">
          {user?.employeeId || `EMP-${user?.id?.slice(-4).toUpperCase()}`}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Leave Type Select */}
        <div>
          <label className="block text-xs font-mono text-on-surface-variant mb-1.5 flex items-center gap-1">
            <Briefcase className="w-3.5 h-3.5 text-primary" /> Leave Type *
          </label>
          <select
            value={leaveType}
            onChange={(e) => setLeaveType(e.target.value)}
            className="w-full bg-surface-container-low/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-on-surface focus:border-primary focus:outline-none transition font-sans"
          >
            <option value="Casual">Casual Leave</option>
            <option value="Sick">Sick Leave</option>
            <option value="Earned">Earned Leave</option>
            <option value="Unpaid">Unpaid Leave</option>
          </select>
        </div>

        {/* Start Date & End Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono text-on-surface-variant mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-primary" /> Start Date *
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="w-full bg-surface-container-low/80 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-on-surface focus:border-primary focus:outline-none transition font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-on-surface-variant mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-primary" /> End Date *
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              className="w-full bg-surface-container-low/80 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-on-surface focus:border-primary focus:outline-none transition font-mono"
            />
          </div>
        </div>

        {/* Calculated Days badge */}
        <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-between text-xs font-mono">
          <span className="text-on-surface-variant flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-primary" /> Total Duration:
          </span>
          <span className="font-extrabold text-primary text-sm">
            {calculatedDays} {calculatedDays === 1 ? "Day" : "Days"}
          </span>
        </div>

        {/* Reason field */}
        <div>
          <label className="block text-xs font-mono text-on-surface-variant mb-1.5 flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-primary" /> Reason for Leave
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Brief reason for your leave application..."
            rows={3}
            className="w-full bg-surface-container-low/80 border border-white/10 rounded-xl p-3 text-xs text-on-surface focus:border-primary focus:outline-none transition font-sans"
          />
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-surface-container-high hover:bg-white/10 text-on-surface-variant text-xs rounded-xl transition font-mono"
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-primary-container to-secondary-container hover:from-primary hover:to-secondary text-on-primary font-semibold text-xs rounded-xl shadow-lg hover:shadow-primary/20 transition duration-200"
          >
            {submitting ? (
              <span className="flex items-center gap-2 font-mono">
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                Submitting Request...
              </span>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" /> Submit Leave Application
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
