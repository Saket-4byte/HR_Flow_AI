import React, { useState, useEffect } from "react";
import { User, Mail, ShieldCheck, Building, Clock, Flame, Calendar, RefreshCw } from "lucide-react";
import { getUserProfile } from "../services/api";
import { SkeletonCard, ErrorState } from "./CommonUI";

export default function ProfileView({ user }) {
  const [profile, setProfile] = useState(user || null);
  const [loading, setLoading] = useState(!user);
  const [error, setError] = useState(null);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUserProfile();
      setProfile(data);
    } catch (err) {
      setError(err.message || "Failed to load user profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <SkeletonCard />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <ErrorState message={error} onRetry={fetchProfile} />
      </div>
    );
  }

  return (
    <div className="glass-panel max-w-2xl mx-auto rounded-2xl p-6 border border-white/12 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/20 text-primary border border-primary/30 flex items-center justify-center font-bold text-lg">
            {profile?.name?.charAt(0) || "U"}
          </div>
          <div>
            <h2 className="text-xl font-bold text-on-surface">{profile?.name}</h2>
            <p className="text-xs text-on-surface-variant font-mono">{profile?.email}</p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
          {profile?.role === "hr" ? "👑 HR Manager" : "👤 Employee"}
        </span>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
        <div className="glass-card rounded-xl p-4 border border-white/10 space-y-1">
          <span className="text-on-surface-variant text-[11px] font-mono uppercase flex items-center gap-1">
            <Building className="w-3.5 h-3.5 text-primary" /> Department
          </span>
          <p className="text-sm font-semibold text-on-surface">{profile?.department || "Engineering"}</p>
        </div>

        <div className="glass-card rounded-xl p-4 border border-white/10 space-y-1">
          <span className="text-on-surface-variant text-[11px] font-mono uppercase flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-tertiary" /> Account Role
          </span>
          <p className="text-sm font-semibold text-on-surface capitalize">{profile?.role}</p>
        </div>

        <div className="glass-card rounded-xl p-4 border border-white/10 space-y-1">
          <span className="text-on-surface-variant text-[11px] font-mono uppercase flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-purple-400" /> Overtime Hours
          </span>
          <p className="text-sm font-semibold font-mono text-purple-400">{profile?.overtime || 0} hrs</p>
        </div>

        <div className="glass-card rounded-xl p-4 border border-white/10 space-y-1">
          <span className="text-on-surface-variant text-[11px] font-mono uppercase flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-amber-400" /> Unused Annual Leave
          </span>
          <p className="text-sm font-semibold font-mono text-amber-400">{profile?.unusedLeave || 0} days</p>
        </div>
      </div>
    </div>
  );
}
