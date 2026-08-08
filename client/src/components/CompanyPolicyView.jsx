import React, { useState, useEffect } from "react";
import { FileText, Upload, Sparkles, CheckCircle2, ShieldCheck, RefreshCw, AlertCircle, FileCheck, Layers } from "lucide-react";
import { getLatestPolicy, uploadCompanyPolicy } from "../services/api";
import { SkeletonCard, ErrorState } from "./CommonUI";

export default function CompanyPolicyView() {
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Upload Form state
  const [title, setTitle] = useState("2026 HR Leave & Attendance Policy");
  const [file, setFile] = useState(null);
  const [pastedText, setPastedText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  const fetchPolicy = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getLatestPolicy();
      setPolicy(data);
    } catch (err) {
      setError(err.message || "Failed to load company policy.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicy();
  }, []);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!file && !pastedText.trim()) {
      setError("Please select a policy PDF/DOCX file or paste policy text.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      if (file) {
        formData.append("file", file);
      } else {
        formData.append("content", pastedText);
      }

      const res = await uploadCompanyPolicy(formData);
      setSuccessMsg("Company policy uploaded, extracted via Gemini 2.5 Flash, and stored in MongoDB Atlas!");
      setPolicy(res.policy);
      setFile(null);
      setPastedText("");
    } catch (err) {
      setError(err.message || "Failed to upload company policy.");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <SkeletonCard />
      </div>
    );
  }

  const extracted = policy?.extractedRules || {};

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h1 className="text-xl font-bold text-on-surface flex items-center gap-2">
            Company HR Policy Management
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              Gemini 2.5 Flash Parser
            </span>
          </h1>
          <p className="text-xs text-on-surface-variant">
            Upload company leave policies in PDF/DOCX format. Stored in MongoDB & loaded into AI Leave Evaluation Workflow.
          </p>
        </div>

        <button
          onClick={fetchPolicy}
          className="p-2 rounded-xl bg-surface-container hover:bg-white/10 text-on-surface-variant hover:text-on-surface transition flex items-center gap-1 text-xs"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Upload Form Box */}
      <div className="glass-panel rounded-2xl p-6 border border-white/12 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase text-primary border-b border-white/10 pb-2">
          <Upload className="w-4 h-4 text-primary" /> Upload New Policy Document (PDF / DOCX / Text)
        </div>

        {error && (
          <div className="p-3 bg-error-container/20 border border-error/30 rounded-xl text-error text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleUploadSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-on-surface-variant mb-1">
              Policy Version / Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full bg-surface-container-low/80 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-on-surface focus:border-primary focus:outline-none transition"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* File Input */}
            <div className="border-2 border-dashed border-white/15 rounded-xl p-4 text-center hover:border-primary/40 transition bg-surface-container-low/40">
              <Upload className="w-6 h-6 text-primary mx-auto mb-2" />
              <div className="text-xs font-semibold text-on-surface mb-1">Upload File (PDF or DOCX)</div>
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={(e) => setFile(e.target.files[0] || null)}
                className="text-xs text-on-surface-variant file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-primary/20 file:text-primary hover:file:bg-primary/30 cursor-pointer"
              />
              {file && (
                <div className="mt-2 text-xs font-mono text-emerald-400 flex items-center justify-center gap-1">
                  <FileCheck className="w-3.5 h-3.5" /> Selected: {file.name}
                </div>
              )}
            </div>

            {/* Pasted Text Option */}
            <div>
              <label className="block text-xs font-mono text-on-surface-variant mb-1">
                Or Paste Policy Text Directly
              </label>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste company leave rules here..."
                rows={4}
                className="w-full bg-surface-container-low/80 border border-white/10 rounded-xl p-3 text-xs text-on-surface focus:border-primary focus:outline-none transition font-sans"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="w-full py-3 bg-gradient-to-r from-primary-container to-secondary-container hover:from-primary hover:to-secondary text-on-primary font-semibold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2"
          >
            {uploading ? (
              <span className="flex items-center gap-2 font-mono">
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                Processing Document & Extracting Rules via Gemini AI...
              </span>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> Process & Store Policy in MongoDB
              </>
            )}
          </button>
        </form>
      </div>

      {/* Active Uploaded Policy Breakdown */}
      <div className="glass-panel rounded-2xl p-6 border border-white/12 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-emerald-400">
            <ShieldCheck className="w-4 h-4" /> Active Policy Loaded in AI Workflow
          </div>
          <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            MongoDB Atlas Live
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs font-mono">
          <div className="bg-surface-container-low/60 rounded-xl p-3 border border-white/5 space-y-1">
            <span className="text-on-surface-variant text-[10px] uppercase">Company Name</span>
            <div className="font-bold text-on-surface">{extracted.companyName || "HRFlow Technologies"}</div>
          </div>

          <div className="bg-surface-container-low/60 rounded-xl p-3 border border-white/5 space-y-1">
            <span className="text-on-surface-variant text-[10px] uppercase">Max Consecutive Leave</span>
            <div className="font-bold text-primary">{extracted.maxConsecutiveLeaveDays || 14} days</div>
          </div>

          <div className="bg-surface-container-low/60 rounded-xl p-3 border border-white/5 space-y-1">
            <span className="text-on-surface-variant text-[10px] uppercase">Notice Required</span>
            <div className="font-bold text-amber-400">{extracted.minNoticeDaysRequired || 2} days</div>
          </div>

          <div className="bg-surface-container-low/60 rounded-xl p-3 border border-white/5 space-y-1">
            <span className="text-on-surface-variant text-[10px] uppercase">Max Annual Leave</span>
            <div className="font-bold text-purple-400">{extracted.maxLeavePerYear || 24} days</div>
          </div>
        </div>

        {/* Gemini Policy Summary */}
        {extracted.policySummary && (
          <div className="p-3 bg-surface-container-low/60 rounded-xl border border-white/5 text-xs text-on-surface-variant space-y-1">
            <span className="text-[10px] font-mono uppercase text-primary flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-primary" /> Gemini AI Policy Summary
            </span>
            <p className="italic font-sans text-on-surface">{extracted.policySummary}</p>
          </div>
        )}

        {/* Raw Text Snippet */}
        <div className="p-3 bg-surface-container-low/40 rounded-xl border border-white/5 text-xs font-mono text-on-surface-variant space-y-1">
          <span className="text-[10px] uppercase text-on-surface-variant">Extracted Document Snippet:</span>
          <p className="line-clamp-3 text-[11px] text-on-surface-variant">{policy?.rawContent}</p>
        </div>
      </div>
    </div>
  );
}
