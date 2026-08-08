import React, { useState } from "react";
import { Lock, Mail, Sparkles, LogIn, AlertCircle, ShieldCheck, UserCheck, UserPlus, IdCard, Building } from "lucide-react";
import { loginUser, registerEmployee } from "../services/api";

export default function LoginPage({ onLoginSuccess }) {
  const [mode, setMode] = useState("login"); // "login" | "register"

  // Login form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Employee Registration form state
  const [regName, setRegName] = useState("");
  const [regEmpId, setRegEmpId] = useState("");
  const [regDept, setRegDept] = useState("Engineering");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    try {
      const response = await loginUser(email, password);
      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));
      setLoading(false);
      if (onLoginSuccess) {
        onLoginSuccess(response.user);
      }
    } catch (err) {
      setLoading(false);
      setError(err.message || "Invalid credentials. Please check your email and password.");
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!regName || !regDept || !regEmail || !regPassword) {
      setError("Please fill in all required registration fields.");
      return;
    }

    setLoading(true);
    try {
      const response = await registerEmployee({
        name: regName,
        employeeId: regEmpId || `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
        department: regDept,
        email: regEmail,
        password: regPassword,
      });

      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));
      setLoading(false);

      if (onLoginSuccess) {
        onLoginSuccess(response.user);
      }
    } catch (err) {
      setLoading(false);
      setError(err.message || "Failed to register employee account.");
    }
  };

  const handleQuickLogin = (demoEmail, demoPassword) => {
    setMode("login");
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <div className="min-h-screen bg-background text-on-surface flex items-center justify-center p-4 relative overflow-hidden">
      {/* Glow backdrop shapes */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-primary-container/15 rounded-full blur-3xl"></div>
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-secondary-container/20 rounded-full blur-3xl"></div>

      <div className="glass-panel max-w-md w-full rounded-2xl p-8 border border-white/15 shadow-2xl relative z-10">
        {/* Brand Logo & Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center mb-3">
            <img
              src="/logo.png"
              alt="HR Flow AI Logo"
              className="w-16 h-16 rounded-2xl object-cover border border-primary/40 shadow-xl shadow-primary/30 ring-2 ring-primary/20"
            />
          </div>
          <h1 className="text-2xl font-bold text-on-surface tracking-tight">HR Flow AI</h1>
          <p className="text-xs text-on-surface-variant font-mono mt-1">
            Enterprise Suite — Authentication
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex bg-surface-container-low/80 p-1 rounded-xl border border-white/10 mb-6">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 ${
              mode === "login"
                ? "bg-primary text-on-primary shadow-md"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <LogIn className="w-3.5 h-3.5" /> Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 ${
              mode === "register"
                ? "bg-primary text-on-primary shadow-md"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" /> Register Employee
          </button>
        </div>

        {/* Demo Account Quick Pickers (Login mode only) */}
        {mode === "login" && (
          <div className="mb-6 p-3 bg-surface-container-low/60 rounded-xl border border-white/10 space-y-2">
            <div className="text-[11px] font-mono uppercase text-on-surface-variant flex items-center justify-between">
              <span>Pre-created Accounts</span>
              <span className="text-[10px] text-primary">Click to Auto-fill</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin("hr@company.com", "password123")}
                className="flex items-center gap-2 p-2 rounded-lg bg-surface-container hover:bg-primary/20 border border-white/5 text-left transition text-xs group"
              >
                <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
                <div>
                  <div className="font-semibold text-on-surface group-hover:text-primary">HR Role</div>
                  <div className="text-[10px] font-mono text-on-surface-variant">hr@company.com</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("rahul@company.com", "password123")}
                className="flex items-center gap-2 p-2 rounded-lg bg-surface-container hover:bg-primary/20 border border-white/5 text-left transition text-xs group"
              >
                <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-semibold text-on-surface group-hover:text-primary">Employee Role</div>
                  <div className="text-[10px] font-mono text-on-surface-variant">rahul@company.com</div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 bg-error-container/20 border border-error/30 rounded-xl text-error text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Login Form */}
        {mode === "login" ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-on-surface-variant mb-1.5 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-primary" /> Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. hr@company.com"
                required
                className="w-full bg-surface-container-low/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-on-surface focus:border-primary focus:outline-none transition font-sans"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-on-surface-variant mb-1.5 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-primary" /> Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-surface-container-low/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-on-surface focus:border-primary focus:outline-none transition font-sans"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-primary-container to-secondary-container hover:from-primary hover:to-secondary text-on-primary font-semibold text-xs rounded-xl shadow-lg hover:shadow-primary/20 transition duration-200"
            >
              {loading ? (
                <span className="flex items-center gap-2 font-mono">
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                  Authenticating...
                </span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" /> Sign In
                </>
              )}
            </button>
          </form>
        ) : (
          /* 2. Employee Registration Form */
          <form onSubmit={handleRegisterSubmit} className="space-y-3">
            <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20 text-[11px] font-mono text-primary flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 shrink-0 text-purple-400" />
              <span>Note: HR accounts are pre-created. Only Employee registration is allowed.</span>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-on-surface-variant mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="e.g. Priya Sharma"
                required
                className="w-full bg-surface-container-low/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-on-surface focus:border-primary focus:outline-none transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-mono text-on-surface-variant mb-1 flex items-center gap-1">
                  <IdCard className="w-3 h-3 text-primary" /> Employee ID
                </label>
                <input
                  type="text"
                  value={regEmpId}
                  onChange={(e) => setRegEmpId(e.target.value)}
                  placeholder="e.g. EMP-104"
                  className="w-full bg-surface-container-low/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-on-surface focus:border-primary focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-on-surface-variant mb-1 flex items-center gap-1">
                  <Building className="w-3 h-3 text-primary" /> Department
                </label>
                <select
                  value={regDept}
                  onChange={(e) => setRegDept(e.target.value)}
                  className="w-full bg-surface-container-low/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-on-surface focus:border-primary focus:outline-none transition"
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Sales">Sales</option>
                  <option value="HR">HR</option>
                  <option value="Finance">Finance</option>
                  <option value="Marketing">Marketing</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-on-surface-variant mb-1 flex items-center gap-1">
                <Mail className="w-3 h-3 text-primary" /> Email Address
              </label>
              <input
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="e.g. priya@company.com"
                required
                className="w-full bg-surface-container-low/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-on-surface focus:border-primary focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-on-surface-variant mb-1 flex items-center gap-1">
                <Lock className="w-3 h-3 text-primary" /> Password
              </label>
              <input
                type="password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-surface-container-low/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-on-surface focus:border-primary focus:outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 inline-flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-primary-container to-secondary-container hover:from-primary hover:to-secondary text-on-primary font-semibold text-xs rounded-xl shadow-lg hover:shadow-primary/20 transition duration-200"
            >
              {loading ? (
                <span className="flex items-center gap-2 font-mono">
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                  Registering Account...
                </span>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" /> Create Employee Account
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-[11px] font-mono text-on-surface-variant">
          Employee Registration • HR Pre-created Auth • MongoDB
        </div>
      </div>
    </div>
  );
}
