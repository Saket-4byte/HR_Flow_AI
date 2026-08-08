import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Calendar,
  History,
  ShieldCheck,
  Mail,
  User,
  LogOut,
  FileText,
  Users
} from "lucide-react";
import LoginPage from "./components/LoginPage";
import DashboardView from "./components/DashboardView";
import ApplyLeaveForm from "./components/ApplyLeaveForm";
import LeaveHistoryView from "./components/LeaveHistoryView";
import ExplainableAIPage from "./components/ExplainableAIPage";
import AuditLogsView from "./components/AuditLogsView";
import NotificationsView from "./components/NotificationsView";
import ProfileView from "./components/ProfileView";
import CompanyPolicyView from "./components/CompanyPolicyView";
import EmployeeManagementView from "./components/EmployeeManagementView";
import HRChatbotWidget from "./components/HRChatbotWidget";
import { getLeaveRequestById } from "./services/api";
import { SkeletonTable, ErrorState, EmptyState } from "./components/CommonUI";

export default function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedDetailId, setSelectedDetailId] = useState(null);

  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);

  // Runtime trace log for active tab & user role
  console.log(`🔍 [App.jsx RUNTIME TRACE] activeTab="${activeTab}", userRole="${user?.role}", userId="${user?.id}", selectedDetailId="${selectedDetailId}"`);

  // Default tab based on role after login
  useEffect(() => {
    if (user) {
      if (user.role === "employee" && (activeTab === "dashboard" || activeTab === "policy" || activeTab === "employees" || activeTab === "audit" || activeTab === "explainable")) {
        console.log(`🛡️ [App.jsx GUARD] Redirecting employee from restricted activeTab="${activeTab}" to "apply"`);
        setActiveTab("apply");
      } else if (user.role === "hr" && activeTab === "apply") {
        console.log(`🛡️ [App.jsx GUARD] Redirecting HR from "apply" to "dashboard"`);
        setActiveTab("dashboard");
      }
    }
  }, [user, activeTab]);

  // Fetch single request details when selectedDetailId changes
  useEffect(() => {
    if (selectedDetailId) {
      console.log(`📡 [App.jsx FETCH DETAIL] Fetching details for leaveRequestId="${selectedDetailId}"`);
      const loadDetail = async () => {
        setDetailLoading(true);
        setDetailError(null);
        try {
          const res = await getLeaveRequestById(selectedDetailId);
          console.log(`✅ [App.jsx DETAIL LOADED] recommendation="${JSON.stringify(res?.recommendation)}", status="${res?.status}"`);
          setDetailData(res);
        } catch (err) {
          console.error(`❌ [App.jsx DETAIL ERROR]`, err);
          setDetailError(err.message || "Failed to load leave request analysis.");
        } finally {
          setDetailLoading(false);
        }
      };
      loadDetail();
    } else {
      setDetailData(null);
    }
  }, [selectedDetailId]);

  const handleLoginSuccess = (userData) => {
    console.log(`🔑 [App.jsx LOGIN SUCCESS] User logged in:`, userData);
    setUser(userData);
    if (userData.role === "employee") {
      setActiveTab("apply");
    } else {
      setActiveTab("dashboard");
    }
  };

  const handleLogout = () => {
    console.log(`🚪 [App.jsx LOGOUT] Signing out user`);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setSelectedDetailId(null);
  };

  const handleViewDetails = (id) => {
    console.log(`👁️ [App.jsx VIEW DETAILS] Triggered for id="${id}", userRole="${user?.role}"`);
    if (user?.role !== "hr") {
      console.warn(`🛑 [App.jsx ACCESS DENIED] Non-HR user attempt to view AI details for id="${id}" blocked.`);
      return;
    }
    setSelectedDetailId(id);
    setActiveTab("explainable");
  };

  // Employee Submission Callback: Always redirect to history tab (never explainable AI)
  const handleApplySuccess = (response) => {
    console.log(`📩 [App.jsx LEAVE SUBMIT SUCCESS] Employee submit callback received response:`, response);
    console.log(`➡️ [App.jsx NAVIGATE] Setting activeTab to "history" for employee.`);
    setActiveTab("history");
  };

  // If user is not logged in, render Login / Register Page only
  if (!user) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const isHR = user.role === "hr";

  return (
    <div className="min-h-screen bg-background text-on-surface flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 glass-panel border-r border-white/10 flex flex-col fixed inset-y-0 left-0 z-30">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="HR Flow AI Logo"
              className="w-10 h-10 rounded-xl object-cover border border-primary/30 shadow-md shadow-primary/20"
            />
            <div>
              <h1 className="font-bold text-base text-on-surface">HR Flow AI</h1>
              <span className="text-[10px] font-mono text-on-surface-variant uppercase tracking-wider">
                {isHR ? "HR Executive Portal" : "Employee Portal"}
              </span>
            </div>
          </div>
        </div>

        {/* User Card */}
        <div className="p-4 mx-3 my-3 bg-surface-container-low/60 rounded-xl border border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className="truncate">
              <div className="font-semibold text-xs text-on-surface truncate">{user.name}</div>
              <div className="text-[10px] font-mono text-on-surface-variant capitalize">{user.role} • {user.department}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg hover:bg-error/20 text-on-surface-variant hover:text-error transition shrink-0"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Items (Strictly Scoped by Role) */}
        <nav className="flex-1 p-4 space-y-1 text-xs font-medium font-sans">
          {/* HR Role Navigation ONLY */}
          {isHR ? (
            <>
              <button
                onClick={() => {
                  setSelectedDetailId(null);
                  setActiveTab("dashboard");
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition ${
                  activeTab === "dashboard" || activeTab === "analytics"
                    ? "bg-primary-container/20 text-primary border border-primary/30"
                    : "text-on-surface-variant hover:bg-white/5 hover:text-on-surface"
                }`}
              >
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </button>

              <button
                onClick={() => {
                  setSelectedDetailId(null);
                  setActiveTab("policy");
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition ${
                  activeTab === "policy"
                    ? "bg-primary-container/20 text-primary border border-primary/30"
                    : "text-on-surface-variant hover:bg-white/5 hover:text-on-surface"
                }`}
              >
                <FileText className="w-4 h-4" /> Company Policy
              </button>

              <button
                onClick={() => {
                  setSelectedDetailId(null);
                  setActiveTab("history");
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition ${
                  activeTab === "history"
                    ? "bg-primary-container/20 text-primary border border-primary/30"
                    : "text-on-surface-variant hover:bg-white/5 hover:text-on-surface"
                }`}
              >
                <History className="w-4 h-4" /> All Leave Requests
              </button>

              <button
                onClick={() => {
                  setSelectedDetailId(null);
                  setActiveTab("employees");
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition ${
                  activeTab === "employees"
                    ? "bg-primary-container/20 text-primary border border-primary/30"
                    : "text-on-surface-variant hover:bg-white/5 hover:text-on-surface"
                }`}
              >
                <Users className="w-4 h-4" /> Employee Management
              </button>

              <button
                onClick={() => {
                  setSelectedDetailId(null);
                  setActiveTab("audit");
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition ${
                  activeTab === "audit"
                    ? "bg-primary-container/20 text-primary border border-primary/30"
                    : "text-on-surface-variant hover:bg-white/5 hover:text-on-surface"
                }`}
              >
                <ShieldCheck className="w-4 h-4" /> Audit Logs
              </button>

              <button
                onClick={() => {
                  setSelectedDetailId(null);
                  setActiveTab("notifications");
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition ${
                  activeTab === "notifications"
                    ? "bg-primary-container/20 text-primary border border-primary/30"
                    : "text-on-surface-variant hover:bg-white/5 hover:text-on-surface"
                }`}
              >
                <Mail className="w-4 h-4" /> Notifications
              </button>

              <button
                onClick={() => {
                  setSelectedDetailId(null);
                  setActiveTab("profile");
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition ${
                  activeTab === "profile"
                    ? "bg-primary-container/20 text-primary border border-primary/30"
                    : "text-on-surface-variant hover:bg-white/5 hover:text-on-surface"
                }`}
              >
                <User className="w-4 h-4" /> Profile
              </button>
            </>
          ) : (
            /* Employee Role Navigation ONLY */
            <>
              <button
                onClick={() => {
                  setSelectedDetailId(null);
                  setActiveTab("apply");
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                  activeTab === "apply"
                    ? "bg-primary-container/20 text-primary border border-primary/30"
                    : "text-on-surface-variant hover:bg-white/5 hover:text-on-surface"
                }`}
              >
                <Calendar className="w-4 h-4" /> Apply Leave
              </button>

              <button
                onClick={() => {
                  setSelectedDetailId(null);
                  setActiveTab("history");
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                  activeTab === "history"
                    ? "bg-primary-container/20 text-primary border border-primary/30"
                    : "text-on-surface-variant hover:bg-white/5 hover:text-on-surface"
                }`}
              >
                <History className="w-4 h-4" /> My Leave Requests
              </button>

              <button
                onClick={() => {
                  setSelectedDetailId(null);
                  setActiveTab("notifications");
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                  activeTab === "notifications"
                    ? "bg-primary-container/20 text-primary border border-primary/30"
                    : "text-on-surface-variant hover:bg-white/5 hover:text-on-surface"
                }`}
              >
                <Mail className="w-4 h-4" /> Notifications
              </button>

              <button
                onClick={() => {
                  setSelectedDetailId(null);
                  setActiveTab("profile");
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                  activeTab === "profile"
                    ? "bg-primary-container/20 text-primary border border-primary/30"
                    : "text-on-surface-variant hover:bg-white/5 hover:text-on-surface"
                }`}
              >
                <User className="w-4 h-4" /> Profile
              </button>
            </>
          )}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-white/10 text-[11px] font-mono text-on-surface-variant text-center">
          JWT Role-Based Auth • {user.role.toUpperCase()}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-64 p-8 min-h-screen">
        {/* Dynamic View Router */}
        {activeTab === "dashboard" && isHR && (
          <DashboardView
            onViewDetails={handleViewDetails}
            onGoToPolicy={() => setActiveTab("policy")}
          />
        )}

        {activeTab === "policy" && isHR && <CompanyPolicyView />}

        {activeTab === "employees" && isHR && <EmployeeManagementView />}

        {activeTab === "apply" && !isHR && (
          <ApplyLeaveForm
            user={user}
            onWorkflowSuccess={handleApplySuccess}
            onCancel={() => setActiveTab("history")}
          />
        )}

        {activeTab === "history" && (
          <LeaveHistoryView user={user} onViewDetails={handleViewDetails} />
        )}

        {activeTab === "explainable" && isHR && (
          <div>
            {detailLoading ? (
              <div className="max-w-4xl mx-auto space-y-4">
                <SkeletonTable rows={4} />
              </div>
            ) : detailError ? (
              <div className="max-w-4xl mx-auto">
                <ErrorState message={detailError} onRetry={() => setSelectedDetailId(selectedDetailId)} />
              </div>
            ) : !detailData ? (
              <div className="max-w-4xl mx-auto">
                <EmptyState
                  title="No Request Selected"
                  description="Please select a leave application from the Dashboard or History tab."
                />
              </div>
            ) : (
              <ExplainableAIPage
                requestData={detailData}
                userRole={user.role}
                onClose={() => setActiveTab("history")}
                onStatusUpdated={() => setSelectedDetailId(selectedDetailId)}
              />
            )}
          </div>
        )}

        {activeTab === "audit" && isHR && <AuditLogsView />}

        {activeTab === "notifications" && <NotificationsView user={user} />}

        {activeTab === "profile" && <ProfileView user={user} />}
      </main>

      {/* Floating HR Chatbot */}
      <HRChatbotWidget />
    </div>
  );
}
