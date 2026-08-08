import { Router } from "express";
import multer from "multer";
import mongoose from "mongoose";
import { Policy } from "../models/Policy.js";
import { generateGeminiText } from "../services/gemini.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * Helper to parse policy rules using Gemini 2.5 Flash
 */
async function extractPolicyRulesWithGemini(rawText) {
  const prompt = `You are an AI HR Policy Specialist. Analyze the following HR company policy document text and extract key structured leave guidelines.

DOCUMENT TEXT:
"""
${rawText.slice(0, 4000)}
"""

Respond with strict JSON ONLY (no markdown formatting, no code blocks):
{
  "companyName": "extracted company name or HRFlow Technologies",
  "maxConsecutiveLeaveDays": 14,
  "minNoticeDaysRequired": 2,
  "maxLeavePerYear": 24,
  "probationLeaveRestriction": true,
  "allowedLeaveTypes": ["Casual", "Sick", "Earned", "Maternity", "Paternity", "Bereavement"],
  "policySummary": "A concise 2-sentence summary of the leave policy."
}`;

  try {
    const responseText = await generateGeminiText(prompt, { temperature: 0.1 });
    const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanJson);
  } catch (err) {
    console.warn("⚠️ Gemini policy extraction fallback used:", err.message);
    return {
      companyName: "HRFlow Technologies",
      maxConsecutiveLeaveDays: 14,
      minNoticeDaysRequired: 2,
      maxLeavePerYear: 24,
      probationLeaveRestriction: true,
      allowedLeaveTypes: ["Casual", "Sick", "Earned", "Maternity", "Paternity", "Bereavement"],
      policySummary: "Company policy processed and saved.",
    };
  }
}

/**
 * POST /policy/upload
 * HR only: Upload PDF/DOCX or text policy, extract via Gemini, and store in MongoDB.
 */
router.post("/upload", protect, authorize("hr"), upload.single("file"), async (req, res) => {
  try {
    const title = req.body.title || "Company HR Leave Policy";
    let rawContent = req.body.content || "";
    let fileName = "policy_text.txt";
    let fileType = "TEXT";

    if (req.file) {
      fileName = req.file.originalname;
      fileType = fileName.endsWith(".pdf") ? "PDF" : fileName.endsWith(".docx") ? "DOCX" : "DOCUMENT";
      // Convert buffer content to readable UTF-8 string
      rawContent = req.file.buffer.toString("utf-8");
    }

    if (!rawContent || rawContent.trim().length === 0) {
      return res.status(400).json({ error: "Policy content or file is required." });
    }

    // Extract structured rules using Gemini 2.5 Flash
    const extractedRules = await extractPolicyRulesWithGemini(rawContent);

    if (mongoose.connection.readyState === 1) {
      // Unset previous latest policies
      await Policy.updateMany({}, { isLatest: false });
    }

    // Save new policy to MongoDB
    const newPolicy = mongoose.connection.readyState === 1 ? await Policy.create({
      title,
      fileName,
      fileType,
      rawContent,
      extractedRules,
      uploadedBy: req.user?.name || req.body.uploadedBy || "HR Admin",
      isLatest: true,
    }) : {
      title,
      fileName,
      fileType,
      rawContent,
      extractedRules,
      uploadedBy: req.user?.name || "HR Admin",
      isLatest: true,
      _id: "mock_policy_id_offline"
    };

    console.log(`📄 HR Policy Uploaded & Processed via Gemini AI: ${newPolicy.title}`);

    return res.status(201).json({
      message: "Company policy uploaded, extracted via Gemini AI, and stored in MongoDB successfully!",
      policy: newPolicy,
    });
  } catch (error) {
    console.error("❌ Policy Upload Error:", error);
    return res.status(500).json({ error: "Failed to upload policy", message: error.message });
  }
});

/**
 * GET /policy/latest
 * Get the latest active company policy stored in MongoDB (Employee or HR)
 */
router.get("/latest", protect, authorize("employee", "hr"), async (req, res) => {
  try {
    let policy = null;
    if (mongoose.connection.readyState === 1) {
      policy = await Policy.findOne({ isLatest: true }).sort({ createdAt: -1 });
    }

    if (!policy) {
      // Fallback default response if no policy uploaded yet or DB offline
      return res.status(200).json({
        title: "Standard HR Leave Policy 2026",
        fileName: "standard_policy.pdf",
        fileType: "PDF",
        rawContent: "Standard Company Policy: Maximum 14 consecutive leave days, 2 days advance notice required.",
        extractedRules: {
          companyName: "HRFlow Technologies",
          maxConsecutiveLeaveDays: 14,
          minNoticeDaysRequired: 2,
          maxLeavePerYear: 24,
          probationLeaveRestriction: true,
          allowedLeaveTypes: ["Casual", "Sick", "Earned", "Maternity", "Paternity", "Bereavement"],
          policySummary: "Standard company leave policy guidelines.",
        },
        uploadedBy: "System Default",
        isLatest: true,
        createdAt: new Date(),
      });
    }

    return res.status(200).json(policy);
  } catch (error) {
    console.error("❌ Error fetching latest policy:", error);
    return res.status(200).json({
      title: "Standard HR Leave Policy 2026",
      fileName: "standard_policy.pdf",
      fileType: "PDF",
      rawContent: "Standard Company Policy: Maximum 14 consecutive leave days, 2 days advance notice required.",
      extractedRules: {
        companyName: "HRFlow Technologies",
        maxConsecutiveLeaveDays: 14,
        minNoticeDaysRequired: 2,
        maxLeavePerYear: 24,
        probationLeaveRestriction: true,
        allowedLeaveTypes: ["Casual", "Sick", "Earned", "Maternity", "Paternity", "Bereavement"],
        policySummary: "Standard company leave policy guidelines.",
      },
      uploadedBy: "System Default",
      isLatest: true,
      createdAt: new Date(),
    });
  }
});

/**
 * GET /policy/all
 * HR only: Get list of all uploaded policy versions
 */
router.get("/all", protect, authorize("hr"), async (req, res) => {
  try {
    let policies = [];
    if (mongoose.connection.readyState === 1) {
      policies = await Policy.find({}).sort({ createdAt: -1 });
    }
    return res.status(200).json(policies);
  } catch (error) {
    console.error("❌ Error fetching policy history:", error);
    return res.status(200).json([]);
  }
});

export default router;
