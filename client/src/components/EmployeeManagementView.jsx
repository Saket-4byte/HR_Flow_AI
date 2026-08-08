import React, { useState, useEffect } from "react";
import { Users, Search, RefreshCw, IdCard, Mail, Building, Clock, Calendar, Shield, Trash2, Edit2, RotateCcw, Filter } from "lucide-react";
import { getEmployeeList, updateEmployee, deleteEmployee } from "../services/api";
import { SkeletonTable, ErrorState, EmptyState } from "./CommonUI";

export default function EmployeeManagementView() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [actionLoading, setActionLoading] = useState(null);

  const fetchEmployees = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getEmployeeList();
      setEmployees(data || []);
    } catch (err) {
      setError(err.message || "Failed to load registered employee list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleResetLeaveBalance = async (id) => {
    if (!window.confirm("Are you sure you want to reset annual leave balance to 24 days for this employee?")) return;
    setActionLoading(id);
    try {
      await updateEmployee(id, { unusedLeave: 24 });
      await fetchEmployees();
    } catch (err) {
      alert(`Failed to reset leave balance: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateOvertime = async (id, currentOvertime) => {
    const newOvertime = window.prompt("Enter updated overtime hours:", currentOvertime || 0);
    if (newOvertime === null) return;
    setActionLoading(id);
    try {
      await updateEmployee(id, { overtime: Number(newOvertime) });
      await fetchEmployees();
    } catch (err) {
      alert(`Failed to update overtime: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteEmployee = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete employee ${name}?`)) return;
    setActionLoading(id);
    try {
      await deleteEmployee(id);
      await fetchEmployees();
    } catch (err) {
      alert(`Failed to delete employee: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name?.toLowerCase().includes(search.toLowerCase()) ||
      emp.email?.toLowerCase().includes(search.toLowerCase()) ||
      emp.employeeId?.toLowerCase().includes(search.toLowerCase());

    const matchesDept = deptFilter === "ALL" || emp.department === deptFilter;

    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-xl font-bold text-on-surface flex items-center gap-2">
            Employee Directory & Management
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              {employees.length} Employees
            </span>
          </h1>
          <p className="text-xs text-on-surface-variant">
            Manage registered employee accounts, department allocations, overtime, and leave balances in MongoDB.
          </p>
        </div>

        {/* Search, Filter & Refresh */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, ID, email..."
              className="bg-surface-container-low/80 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-on-surface focus:border-primary focus:outline-none transition w-44 sm:w-52 font-sans"
            />
          </div>

          <div className="flex items-center gap-1 bg-surface-container-low/80 border border-white/10 rounded-xl p-1">
            <Filter className="w-3.5 h-3.5 text-on-surface-variant ml-2" />
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="bg-transparent border-none text-xs text-on-surface focus:ring-0 cursor-pointer font-mono"
            >
              <option value="ALL" className="bg-surface-container">All Departments</option>
              <option value="Engineering" className="bg-surface-container">Engineering</option>
              <option value="Sales" className="bg-surface-container">Sales</option>
              <option value="HR" className="bg-surface-container">HR</option>
              <option value="Finance" className="bg-surface-container">Finance</option>
            </select>
          </div>

          <button
            onClick={fetchEmployees}
            className="p-2 rounded-xl bg-surface-container hover:bg-white/10 text-on-surface-variant hover:text-on-surface transition text-xs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <SkeletonTable rows={5} />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchEmployees} />
      ) : filteredEmployees.length === 0 ? (
        <EmptyState
          title="No Employees Found"
          description={search || deptFilter !== "ALL" ? "No employee matches your filter criteria." : "No registered employees found in database."}
        />
      ) : (
        <div className="glass-panel rounded-2xl border border-white/12 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-surface-container-low/80 text-[11px] font-mono text-on-surface-variant uppercase tracking-wider">
                  <th className="py-3.5 px-4">Employee</th>
                  <th className="py-3.5 px-4">ID</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4 text-center">Overtime</th>
                  <th className="py-3.5 px-4 text-center">Unused Leave</th>
                  <th className="py-3.5 px-4 text-center">Weekend Work</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs font-sans text-on-surface">
                {filteredEmployees.map((emp) => (
                  <tr key={emp._id} className="hover:bg-white/5 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                          {emp.name?.charAt(0) || "E"}
                        </div>
                        <div>
                          <div className="font-semibold text-on-surface">{emp.name}</div>
                          <div className="text-[10px] font-mono text-on-surface-variant">{emp.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-xs text-primary font-semibold">
                      {emp.employeeId || `EMP-${emp._id?.slice(-4).toUpperCase()}`}
                    </td>

                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-surface-container text-on-surface border border-white/10">
                        <Building className="w-3 h-3 text-primary" /> {emp.department}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center font-mono font-semibold text-purple-400">
                      {emp.overtime || 0} hrs
                    </td>

                    <td className="py-3 px-4 text-center font-mono font-semibold text-amber-400">
                      {emp.unusedLeave || 0} days
                    </td>

                    <td className="py-3 px-4 text-center font-mono font-semibold text-indigo-400">
                      {emp.weekendWork || 0} days
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleUpdateOvertime(emp._id, emp.overtime)}
                          disabled={actionLoading === emp._id}
                          className="p-1.5 rounded-lg bg-surface-container hover:bg-white/10 text-on-surface-variant hover:text-primary transition"
                          title="Update Overtime Hours"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleResetLeaveBalance(emp._id)}
                          disabled={actionLoading === emp._id}
                          className="p-1.5 rounded-lg bg-surface-container hover:bg-white/10 text-on-surface-variant hover:text-amber-400 transition"
                          title="Reset Leave Balance to 24 Days"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteEmployee(emp._id, emp.name)}
                          disabled={actionLoading === emp._id}
                          className="p-1.5 rounded-lg bg-surface-container hover:bg-error/20 text-on-surface-variant hover:text-error transition"
                          title="Delete Employee"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
