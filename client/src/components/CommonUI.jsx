import React from "react";
import { AlertTriangle, Inbox, RefreshCw } from "lucide-react";

/**
 * Skeleton Loader for Dashboard Stat Cards
 */
export function SkeletonCard() {
  return (
    <div className="glass-card rounded-xl p-5 border border-white/10 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-3 bg-white/10 rounded w-24"></div>
        <div className="h-8 w-8 bg-white/10 rounded-full"></div>
      </div>
      <div className="h-7 bg-white/15 rounded w-16 mb-2"></div>
      <div className="h-3 bg-white/5 rounded w-32"></div>
    </div>
  );
}

/**
 * Skeleton Loader for Data Tables
 */
export function SkeletonTable({ rows = 4 }) {
  return (
    <div className="w-full glass-card rounded-xl p-4 border border-white/10 animate-pulse space-y-3">
      <div className="h-4 bg-white/10 rounded w-1/4 mb-4"></div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between py-2 border-b border-white/5">
          <div className="h-4 bg-white/10 rounded w-1/5"></div>
          <div className="h-4 bg-white/10 rounded w-1/6"></div>
          <div className="h-4 bg-white/10 rounded w-1/6"></div>
          <div className="h-6 bg-white/10 rounded-full w-20"></div>
        </div>
      ))}
    </div>
  );
}

/**
 * Reusable Error State Display Component
 */
export function ErrorState({ message = "Failed to load data from server.", onRetry }) {
  return (
    <div className="glass-panel rounded-xl p-6 text-center border border-error/30 bg-error-container/10 my-4">
      <AlertTriangle className="w-8 h-8 text-error mx-auto mb-2" />
      <h3 className="text-sm font-semibold text-error mb-1">Service Error</h3>
      <p className="text-xs text-on-surface-variant mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-error/20 hover:bg-error/30 text-error border border-error/30 text-xs font-medium rounded-lg transition"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Retry Request
        </button>
      )}
    </div>
  );
}

/**
 * Reusable Empty State Display Component
 */
export function EmptyState({ title = "No Data Found", description = "No entries are currently available." }) {
  return (
    <div className="glass-panel rounded-xl p-8 text-center border border-white/10 my-4">
      <Inbox className="w-10 h-10 text-on-surface-variant/50 mx-auto mb-3" />
      <h4 className="text-sm font-semibold text-on-surface mb-1">{title}</h4>
      <p className="text-xs text-on-surface-variant">{description}</p>
    </div>
  );
}
