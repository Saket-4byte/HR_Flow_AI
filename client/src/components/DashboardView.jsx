import React, { useState, useEffect } from "react";
import { Users, Clock, CheckCircle, XCircle, Activity, Eye, Sparkles, TrendingUp, PieChart, FileText } from "lucide-react";
import { getAnalytics, getLeaveRequests, evaluateLeaveRequest } from "../services/api";
import { SkeletonCard, SkeletonTable, ErrorState, EmptyState } from "./CommonUI";
import BackendStatusWidget from "./BackendStatusWidget";
import AIProcessingScreen from "./AIProcessingScreen";

export default function DashboardView({ onViewDetails, onGoToPolicy }) {
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState(null);

  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestsError, setRequestsError] = useState(null);

  const [evaluatingId, setEvaluatingId] = useState(null);
  const [evalResult, setEvalResult] = useState(null);

  const fetchDashboardData = async () => {
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    try {
      const data = await getAnalytics();
      setAnalytics(data);
    } catch (err) {
      setAnalyticsError(err.message || "Failed to load analytics metrics.");
    } finally {
      setAnalyticsLoading(false);
    }

    setRequestsLoading(true);
    setRequestsError(null);
    try {
      const list = await getLeaveRequests();
      setRequests(list || []);
    } catch (err) {
      setRequestsError(err.message || "Failed to load recent leave applications.");
    } finally {
      setRequestsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleEvaluateAI = async (id) => {
    setEvaluatingId(id);
    try {
      const result = await evaluateLeaveRequest(id);
      setEvalResult(result);
    } catch (err) {
      alert(`Failed to run AI evaluation: ${err.message}`);
      setEvaluatingId(null);
    }
  };

  const handleProcessingComplete = () => {
    const id = evaluatingId;
    setEvaluatingId(null);
    setEvalResult(null);
    fetchDashboardData();
    if (onViewDetails && id) {
      onViewDetails(id);
    }
  };

  if (evaluatingId && evalResult) {
    return <AIProcessingScreen resultData={evalResult.workflowResult || evalResult} onComplete={handleProcessingComplete} />;
  }

  return (
    <div className="space-y-6">
      {/* Infrastructure Status Banner */}
      <BackendStatusWidget />

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel rounded-2xl p-6 border border-white/12">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono text-primary bg-primary/10 px-3 py-1 rounded-full mb-2 border border-primary/20">
            <Sparkles className="w-3.5 h-3.5" /> LangGraph Multi-Agent HR Engine
          </div>
          <h1 className="text-2xl font-bold text-on-surface">HR Flow AI Dashboard</h1>
          <p className="text-xs text-on-surface-variant">
            Pending leave review queue, burnout analytics & active policy monitoring
          </p>
        </div>
        <button
          onClick={onGoToPolicy}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-container to-secondary-container hover:from-primary hover:to-secondary text-on-primary font-semibold text-xs rounded-xl shadow-lg transition duration-200 shrink-0"
        >
          <FileText className="w-4 h-4" /> Company Policy
        </button>
      </div>

      {/* Analytics KPI Section */}
      <div>
        <h3 className="text-xs font-mono uppercase text-on-surface-variant tracking-wider mb-3">
          Key Performance Indicators
        </h3>

        {analyticsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : analyticsError ? (
          <ErrorState message={analyticsError} onRetry={fetchDashboardData} />
        ) : !analytics ? (
          <EmptyState title="No Analytics Available" description="Submit leave requests to populate metrics." />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {/* Total Employees */}
            <div className="glass-card rounded-xl p-4 border border-white/10 flex flex-col justify-between">
              <div className="flex items-center justify-between text-on-surface-variant mb-2">
                <span className="text-xs font-medium">Total Staff</span>
                <Users className="w-4 h-4 text-primary" />
              </div>
              <div className="text-2xl font-bold font-mono text-on-surface">
                {analytics.totalEmployees || 0}
              </div>
              <span className="text-[10px] text-on-surface-variant mt-1">Monitored Profiles</span>
            </div>

            {/* Pending Requests */}
            <div className="glass-card rounded-xl p-4 border border-white/10 flex flex-col justify-between">
              <div className="flex items-center justify-between text-on-surface-variant mb-2">
                <span className="text-xs font-medium">Pending Review</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-amber-400">
                {analytics.pending || 0}
              </div>
              <span className="text-[10px] text-on-surface-variant mt-1">Awaiting HR Review</span>
            </div>

            {/* Approved Requests */}
            <div className="glass-card rounded-xl p-4 border border-white/10 flex flex-col justify-between">
              <div className="flex items-center justify-between text-on-surface-variant mb-2">
                <span className="text-xs font-medium">Approved</span>
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-400">
                {analytics.approved || 0}
              </div>
              <span className="text-[10px] text-on-surface-variant mt-1">Passed Policy & Workload</span>
            </div>

            {/* Rejected Requests */}
            <div className="glass-card rounded-xl p-4 border border-white/10 flex flex-col justify-between">
              <div className="flex items-center justify-between text-on-surface-variant mb-2">
                <span className="text-xs font-medium">Rejected</span>
                <XCircle className="w-4 h-4 text-error" />
              </div>
              <div className="text-2xl font-bold font-mono text-error">
                {analytics.rejected || 0}
              </div>
              <span className="text-[10px] text-on-surface-variant mt-1">Coverage / Notice Limit</span>
            </div>

            {/* Average Burnout Score */}
            <div className="glass-card rounded-xl p-4 border border-white/10 flex flex-col justify-between col-span-2 md:col-span-1">
              <div className="flex items-center justify-between text-on-surface-variant mb-2">
                <span className="text-xs font-medium">Avg Burnout</span>
                <Activity className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-purple-400">
                {analytics.averageBurnout || 0}<span className="text-xs text-on-surface-variant">/100</span>
              </div>
              <span className="text-[10px] text-on-surface-variant mt-1">Overtime Risk</span>
            </div>
          </div>
        )}
      </div>

      {/* Analytics Breakdown Visuals */}
      {analytics && !analyticsLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Department Breakdown */}
          <div className="glass-panel rounded-xl p-5 border border-white/10">
            <h4 className="text-xs font-mono uppercase text-on-surface-variant tracking-wider mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Department-wise Applications
            </h4>
            {analytics.departmentWiseLeaves?.length > 0 ? (
              <div className="space-y-2.5">
                {analytics.departmentWiseLeaves.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-xs font-mono">
                    <span className="text-on-surface">{d.department}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-white/10 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-primary h-full rounded-full"
                          style={{
                            width: `${Math.min(100, (d.count / (analytics.totalEmployees || 1)) * 100)}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-primary font-bold">{d.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-on-surface-variant italic">No department data yet.</p>
            )}
          </div>

          {/* Leave Type Distribution */}
          <div className="glass-panel rounded-xl p-5 border border-white/10">
            <h4 className="text-xs font-mono uppercase text-on-surface-variant tracking-wider mb-3 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-secondary" /> Leave Type Distribution
            </h4>
            {analytics.leaveTypeDistribution?.length > 0 ? (
              <div className="space-y-2.5">
                {analytics.leaveTypeDistribution.map((lt, i) => (
                  <div key={i} className="flex items-center justify-between text-xs font-mono">
                    <span className="text-on-surface">{lt.leaveType}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-white/10 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-secondary h-full rounded-full"
                          style={{
                            width: `${Math.min(100, (lt.count / (requests.length || 1)) * 100)}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-secondary font-bold">{lt.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-on-surface-variant italic">No leave type data yet.</p>
            )}
          </div>
        </div>
      )}

      {/* Pending Leave Requests Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-mono uppercase text-on-surface-variant tracking-wider flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-400" /> Pending Leave Review Queue
          </h3>
          <span className="text-xs text-on-surface-variant font-mono">
            {requests.length} Requests Total
          </span>
        </div>

        {requestsLoading ? (
          <SkeletonTable rows={4} />
        ) : requestsError ? (
          <ErrorState message={requestsError} onRetry={fetchDashboardData} />
        ) : requests.length === 0 ? (
          <EmptyState
            title="No Leave Applications"
            description="Submitted leave requests will appear here for HR review."
          />
        ) : (
          <div className="glass-panel rounded-xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-surface-container-high/60 text-on-surface-variant font-mono uppercase text-[11px] border-b border-white/10">
                  <tr>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Submitted</th>
                    <th className="py-3 px-4 text-right">HR Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {requests.map((item) => {
                    const statusStr = (item.status || "PENDING").toUpperCase();
                    const isApproved = statusStr.includes("APPROV");
                    const isRejected = statusStr.includes("REJECT");
                    const isPending = statusStr.includes("PENDING");
                    const hasAIEvaluation = !!item.recommendation;

                    return (
                      <tr key={item._id} className="hover:bg-white/5 transition">
                        <td className="py-3 px-4 font-semibold text-on-surface">
                          {item.employeeName}
                        </td>
                        <td className="py-3 px-4 text-on-surface-variant font-mono">
                          {item.department}
                        </td>
                        <td className="py-3 px-4 text-on-surface-variant">{item.leaveType}</td>
                        <td className="py-3 px-4 font-mono">{item.days} days</td>
                        <td className="py-3 px-4">
                          {isApproved ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle className="w-3 h-3" /> APPROVED
                            </span>
                          ) : isRejected ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-error/10 text-error border border-error/20">
                              <XCircle className="w-3 h-3" /> REJECTED
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              <Clock className="w-3 h-3 animate-spin" /> PENDING REVIEW
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-on-surface-variant font-mono text-[11px]">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {isPending && !hasAIEvaluation ? (
                            <button
                              onClick={() => handleEvaluateAI(item._id)}
                              disabled={evaluatingId === item._id}
                              className="inline-flex items-center gap-1 text-xs text-primary font-semibold font-mono bg-primary/20 hover:bg-primary/30 px-3 py-1 rounded-lg border border-primary/30 transition shadow-sm"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-primary" /> Evaluate with AI
                            </button>
                          ) : (
                            <button
                              onClick={() => onViewDetails(item._id)}
                              className="inline-flex items-center gap-1 text-xs text-on-surface hover:text-primary font-mono bg-surface-container hover:bg-white/10 px-2.5 py-1 rounded-lg border border-white/10 transition"
                            >
                              <Eye className="w-3.5 h-3.5 text-primary" /> View AI Report
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
