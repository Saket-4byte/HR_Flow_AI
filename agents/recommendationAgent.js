import { generateGeminiJSON } from "../services/gemini.js";
import { buildRecommendationPrompt } from "../prompts/policyPrompt.js";

/**
 * Recommendation Agent - Synthesizes Policy, Workload, and Burnout agent outputs using Gemini AI.
 * 
 * Uses Gemini API to produce final decision, confidence %, and explanation.
 * Includes fallback logic if API key is not configured.
 * 
 * @param {object} input - { employee, policy, workload, burnout }
 * @returns {Promise<object>} - { decision, confidence, reason }
 */
export async function runRecommendationAgent(input = {}) {
  const { employee = {}, policy = {}, workload = {}, burnout = {} } = input;

  try {
    const prompt = buildRecommendationPrompt({ employee, policy, workload, burnout });
    const aiResult = await generateGeminiJSON(prompt, { temperature: 0.2 });

    return {
      decision: aiResult.decision || (policy.isCompliant ? "Approve" : "Reject"),
      confidence: Number(aiResult.confidence) || 90,
      reason: aiResult.reason || "Recommendation based on policy adherence, workload capacity, and employee burnout evaluation.",
    };
  } catch (error) {
    console.warn("⚠️ Gemini AI call fallback triggered in Recommendation Agent:", error.message);

    // Heuristic synthesis fallback
    let decision = "Approve";
    let confidence = 85;
    let reasons = [];

    if (policy.isCompliant === false) {
      decision = "Reject";
      confidence = 95;
      reasons.push(policy.policyExplanation || "Requested leave violates HR policy limits.");
    }

    if (workload.risk === "High" && burnout.riskLevel !== "High") {
      decision = "Reject";
      confidence = 90;
      reasons.push(workload.reason || "High team workload risk.");
    } else if (burnout.riskLevel === "High") {
      decision = "Approve";
      confidence = 95;
      reasons.push("High employee burnout risk prioritizes granting restorative leave for employee well-being.");
    }

    if (reasons.length === 0) {
      reasons.push("Leave complies with company policy and team operational capacity.");
    }

    return {
      decision,
      confidence,
      reason: reasons.join(" "),
    };
  }
}

export default runRecommendationAgent;
