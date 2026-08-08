import React, { useState, useEffect } from "react";
import { Mail, RefreshCw, Send, CheckCircle2 } from "lucide-react";
import { getNotifications } from "../services/api";
import { SkeletonTable, ErrorState, EmptyState } from "./CommonUI";

export default function NotificationsView({ user }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotificationsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = user?.role === "employee" ? { recipient: user.email } : {};
      const data = await getNotifications(params);

      // Client side filter fallback for employee recipient email
      let filteredData = data || [];
      if (user?.role === "employee" && user?.email) {
        filteredData = filteredData.filter(
          (notif) => notif.recipient?.toLowerCase() === user.email?.toLowerCase()
        );
      }
      setNotifications(filteredData);
    } catch (err) {
      setError(err.message || "Failed to fetch notification emails.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotificationsData();
  }, [user]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
            <Mail className="w-5 h-5 text-amber-400" /> Notifications & Email Drafts
          </h2>
          <p className="text-xs text-on-surface-variant">
            {user?.role === "hr" ? "All generated notification emails across company" : "Email notifications sent regarding your leave applications"}
          </p>
        </div>
        <button
          onClick={fetchNotificationsData}
          className="p-2 rounded-xl bg-surface-container hover:bg-white/10 text-on-surface-variant transition"
          title="Refresh Notifications"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading ? (
        <SkeletonTable rows={4} />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchNotificationsData} />
      ) : notifications.length === 0 ? (
        <EmptyState title="No Notification Emails" description="No notification emails found for your account." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {notifications.map((item) => (
            <div key={item._id} className="glass-card rounded-xl p-5 border border-white/10 space-y-2">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-xs font-mono text-primary font-semibold truncate max-w-[220px]">
                  To: {item.recipient}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {item.status}
                </span>
              </div>
              <h4 className="text-sm font-semibold text-on-surface">{item.subject}</h4>
              <p className="text-xs text-on-surface-variant italic line-clamp-3 bg-surface-container-low/50 p-2.5 rounded-lg border border-white/5 font-mono">
                "{item.body}"
              </p>
              <div className="text-[10px] text-on-surface-variant font-mono text-right pt-1">
                Generated: {new Date(item.sentAt || item.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
