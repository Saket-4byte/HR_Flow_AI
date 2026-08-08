import React, { useState, useEffect } from "react";
import { ShieldAlert, RefreshCw, FileText, CheckCircle, Clock } from "lucide-react";
import { getAuditLogs } from "../services/api";
import { SkeletonTable, ErrorState, EmptyState } from "./CommonUI";

export default function AuditLogsView() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAuditLogs();
      setLogs(data || []);
    } catch (err) {
      setError(err.message || "Failed to fetch compliance audit logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-emerald-400" /> Compliance Audit Trail
          </h2>
          <p className="text-xs text-on-surface-variant">
            Immutable AI evaluation audit records stored in MongoDB Atlas
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="p-2 rounded-xl bg-surface-container hover:bg-white/10 text-on-surface-variant transition"
          title="Refresh Audit Logs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading ? (
        <SkeletonTable rows={5} />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchLogs} />
      ) : logs.length === 0 ? (
        <EmptyState title="No Audit Records" description="Audit logs will appear here after AI evaluations." />
      ) : (
        <div className="glass-panel rounded-xl border border-white/10 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-surface-container-high/60 text-on-surface-variant font-mono uppercase text-[11px] border-b border-white/10">
                <tr>
                  <th className="py-3 px-4">Audit ID</th>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Decision</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {logs.map((item) => (
                  <tr key={item._id} className="hover:bg-white/5 transition">
                    <td className="py-3 px-4 text-primary font-semibold">
                      {item.auditDetails?.auditId || item._id.substring(0, 12)}
                    </td>
                    <td className="py-3 px-4 text-on-surface font-sans font-semibold">
                      {item.employeeName}
                    </td>
                    <td className="py-3 px-4 text-on-surface-variant">{item.action}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px]">
                        {item.decision}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-on-surface-variant text-[11px]">
                      {new Date(item.timestamp || item.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
