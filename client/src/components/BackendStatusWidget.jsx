import React, { useState, useEffect } from "react";
import { Server, Database, Sparkles, RefreshCw, AlertCircle } from "lucide-react";
import { getHealthStatus } from "../services/api";

export default function BackendStatusWidget() {
  const [status, setStatus] = useState({
    backend: "checking",
    mongodb: "checking",
    ai: "checking",
  });
  const [lastCheck, setLastCheck] = useState(null);
  const [loading, setLoading] = useState(false);

  const checkStatus = async () => {
    setLoading(true);
    try {
      const res = await getHealthStatus();
      if (res && res.status === "running") {
        setStatus({
          backend: "online",
          mongodb: "online",
          ai: "online",
        });
      } else {
        setStatus({ backend: "offline", mongodb: "offline", ai: "offline" });
      }
    } catch (err) {
      setStatus({ backend: "offline", mongodb: "offline", ai: "offline" });
    } finally {
      setLoading(false);
      setLastCheck(new Date().toLocaleTimeString());
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-panel rounded-xl p-4 border border-white/10 shadow-lg mb-6">
      <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-primary" />
          <span className="font-semibold text-xs tracking-wider uppercase text-on-surface">
            System Infrastructure
          </span>
        </div>
        <button
          onClick={checkStatus}
          disabled={loading}
          className="text-xs text-on-surface-variant hover:text-primary transition flex items-center gap-1"
          title="Refresh Backend Status"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          <span>{lastCheck ? lastCheck : "Check"}</span>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {/* Backend Status */}
        <div className="bg-surface-container-low/60 rounded-lg p-2.5 border border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-on-surface">Backend</span>
          </div>
          {status.backend === "online" ? (
            <span className="flex items-center gap-1 text-[11px] font-mono text-tertiary bg-tertiary/10 px-2 py-0.5 rounded-full border border-tertiary/20">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse"></span>
              Online
            </span>
          ) : status.backend === "checking" ? (
            <span className="text-[11px] text-on-surface-variant font-mono">Checking...</span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] font-mono text-error bg-error/10 px-2 py-0.5 rounded-full border border-error/20">
              <AlertCircle className="w-3 h-3" /> Offline
            </span>
          )}
        </div>

        {/* MongoDB Status */}
        <div className="bg-surface-container-low/60 rounded-lg p-2.5 border border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-secondary" />
            <span className="text-xs font-medium text-on-surface">MongoDB</span>
          </div>
          {status.mongodb === "online" ? (
            <span className="flex items-center gap-1 text-[11px] font-mono text-tertiary bg-tertiary/10 px-2 py-0.5 rounded-full border border-tertiary/20">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse"></span>
              Online
            </span>
          ) : status.mongodb === "checking" ? (
            <span className="text-[11px] text-on-surface-variant font-mono">Checking...</span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] font-mono text-error bg-error/10 px-2 py-0.5 rounded-full border border-error/20">
              <AlertCircle className="w-3 h-3" /> Offline
            </span>
          )}
        </div>

        {/* Gemini AI Status */}
        <div className="bg-surface-container-low/60 rounded-lg p-2.5 border border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-primary-container" />
            <span className="text-xs font-medium text-on-surface">Gemini AI</span>
          </div>
          {status.ai === "online" ? (
            <span className="flex items-center gap-1 text-[11px] font-mono text-tertiary bg-tertiary/10 px-2 py-0.5 rounded-full border border-tertiary/20">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse"></span>
              Online
            </span>
          ) : status.ai === "checking" ? (
            <span className="text-[11px] text-on-surface-variant font-mono">Checking...</span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] font-mono text-error bg-error/10 px-2 py-0.5 rounded-full border border-error/20">
              <AlertCircle className="w-3 h-3" /> Offline
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
