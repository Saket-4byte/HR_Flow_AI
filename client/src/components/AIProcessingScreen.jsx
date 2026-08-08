import React, { useState, useEffect } from "react";
import { ShieldCheck, Users, Activity, BrainCircuit, DatabaseCheck, Sparkles, CheckCircle2 } from "lucide-react";

export default function AIProcessingScreen({ onComplete, resultData }) {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      id: "policy",
      label: "Policy Agent",
      description: "Checking company policy limits & advance notice rules...",
      icon: ShieldCheck,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/30",
    },
    {
      id: "workload",
      label: "Workload Agent",
      description: "Calculating department staffing capacity & coverage threshold...",
      icon: Users,
      color: "text-indigo-400",
      bg: "bg-indigo-500/10",
      border: "border-indigo-500/30",
    },
    {
      id: "burnout",
      label: "Burnout Agent",
      description: "Analyzing overtime, weekend work & accumulated unused leave...",
      icon: Activity,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/30",
    },
    {
      id: "recommendation",
      label: "Recommendation Agent",
      description: "Synthesizing multi-agent data & generating decision score...",
      icon: BrainCircuit,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
    },
    {
      id: "audit",
      label: "Audit Saved",
      description: "Writing compliance audit trail snapshot to MongoDB Atlas...",
      icon: DatabaseCheck,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(timer);
          setTimeout(() => {
            if (onComplete) onComplete(resultData);
          }, 800);
          return prev;
        }
      });
    }, 700);

    return () => clearInterval(timer);
  }, [steps.length, onComplete, resultData]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-2xl p-4">
      <div className="glass-panel max-w-xl w-full rounded-2xl p-8 border border-white/15 shadow-2xl relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary-container/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-secondary-container/20 rounded-full blur-3xl"></div>

        {/* Title Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-xs font-mono text-primary mb-3">
            <Sparkles className="w-3.5 h-3.5 animate-spin" /> LangGraph Multi-Agent Execution
          </div>
          <h2 className="text-2xl font-bold text-on-surface">Evaluating Leave Application</h2>
          <p className="text-xs text-on-surface-variant mt-1">
            Running 6 sequential AI agents to analyze policy, capacity, burnout & audit compliance
          </p>
        </div>

        {/* Step Progression List */}
        <div className="space-y-4 relative before:absolute before:left-6 before:top-4 before:bottom-4 before:w-0.5 before:bg-white/10">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isDone = idx < activeStep;
            const isCurrent = idx === activeStep;

            return (
              <div
                key={step.id}
                className={`relative flex items-center gap-4 p-3.5 rounded-xl border transition-all duration-300 ${
                  isCurrent
                    ? `${step.bg} ${step.border} scale-[1.02] shadow-lg`
                    : isDone
                    ? "bg-surface-container-low/40 border-emerald-500/20"
                    : "bg-surface-container-low/20 border-white/5 opacity-50"
                }`}
              >
                {/* Step Circle Indicator */}
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition ${
                    isDone
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                      : isCurrent
                      ? `${step.bg} ${step.color} border ${step.border} animate-pulse`
                      : "bg-white/5 text-on-surface-variant border border-white/10"
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Icon className="w-4 h-4" />}
                </div>

                {/* Step Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className={`text-sm font-semibold ${isCurrent ? step.color : "text-on-surface"}`}>
                      {step.label}
                    </h4>
                    {isCurrent && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-primary animate-pulse">
                        Processing...
                      </span>
                    )}
                    {isDone && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                        Passed
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-on-surface-variant truncate">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Status */}
        <div className="mt-8 text-center text-xs font-mono text-on-surface-variant flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
          Synchronizing response with MongoDB Atlas...
        </div>
      </div>
    </div>
  );
}
