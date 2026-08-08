import React, { useState, useEffect } from "react";
import { Search, Filter, Eye, CheckCircle, XCircle, Clock, Calendar, RefreshCw, Sparkles, AlertOctagon } from "lucide-react";
import { getLeaveRequests, evaluateLeaveRequest } from "../services/api";
import { SkeletonTable, ErrorState, EmptyState } from "./CommonUI";
import AIProcessingScreen from "./AIProcessingScreen";

export default function LeaveHistoryView({ user, onViewDetails }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [evaluatingId, setEvaluatingId] = useState(null);
  const [evalResult, setEvalResult] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = user?.role === "employee" ? { userId: user.id, employeeName: user.name } : {};
      const data = await getLeaveRequests(params);
      
      let filteredData = data || [];
      if (user?.role === "employee") {
        filteredData = filteredData.filter(
          (req) => req.userId === user.id || req.employeeName?.toLowerCase() === user.name?.toLowerCase()
        );
      }
      setRequests(filteredData);
    } catch (err) {
      setError(err.message || "Failed to load leave history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user]);

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
    fetchHistory();
    if (onViewDetails && id) {
      onViewDetails(id);
    }
  };

  if (evaluatingId && evalResult) {
    return <AIProcessingScreen resultData={evalResult.workflowResult || evalResult} onComplete={handleProcessingComplete} />;
  }

  const filteredRequests = requests.filter((item) => {
    const matchesSearch =
      item.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.leaveType?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" || (item.status || "PENDING").toUpperCase().includes(statusFilter);

    return matchesSearch && matchesStatus;
  });

  const isHR = user?.role === "hr";

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" /> {isHR ? "All Leave Requests" : "My Leave History"}
          </h2>
          <p className="text-xs text-on-surface-variant">
            {isHR ? "Review pending requests, trigger AI evaluation using active policy, and confirm HR decisions" : "Track status of your submitted leave applications"}
          </p>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-on-surface-variant absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-surface-container-low/80 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-on-surface focus:border-primary focus:outline-none transition font-sans w-48"
            />
          </div>

          <div className="flex items-center gap-1 bg-surface-container-low/80 border border-white/10 rounded-xl p-1">
            <Filter className="w-3.5 h-3.5 text-on-surface-variant ml-2" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent border-none text-xs text-on-surface focus:ring-0 cursor-pointer font-mono"
            >
              <option value="ALL" className="bg-surface-container">All Statuses</option>
              <option value="PENDING" className="bg-surface-container">Pending</option>
              <option value="APPROV" className="bg-surface-container">Approved</option>
              <option value="REJECT" className="bg-surface-container">Rejected</option>
            </select>
          </div>

          <button
            onClick={fetchHistory}
            className="p-2 rounded-xl bg-surface-container hover:bg-white/10 text-on-surface-variant transition"
            title="Refresh List"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Main Table Content */}
      {loading ? (
        <SkeletonTable rows={6} />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchHistory} />
      ) : filteredRequests.length === 0 ? (
        <EmptyState
          title="No Leave Requests Found"
          description={isHR ? "No leave requests match your search filter." : "You have not submitted any leave requests yet."}
        />
      ) : (
        <div className="glass-panel rounded-xl border border-white/10 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-surface-container-high/60 text-on-surface-variant font-mono uppercase text-[11px] border-b border-white/10">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Submitted At</th>
                  {isHR && <th className="py-3 px-4 text-right">HR Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredRequests.map((item) => {
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

                      {/* Status Badge */}
                      <td className="py-3 px-4">
                        {isApproved ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle className="w-3 h-3" /> APPROVED
                          </span>
                        ) : isRejected ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-error/15 text-error border border-error/30">
                            <XCircle className="w-3 h-3" /> REJECTED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            <Clock className="w-3 h-3 animate-spin" /> PENDING REVIEW
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-on-surface-variant font-mono text-[11px]">
                        {new Date(item.createdAt).toLocaleString()}
                      </td>

                      {/* HR Action Column (HR Portal Only) */}
                      {isHR && (
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
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
