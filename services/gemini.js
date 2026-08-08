import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || "";
const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

if (!apiKey || apiKey === "your_gemini_api_key_here") {
  console.warn("⚠️ Warning: GEMINI_API_KEY is not configured or using default placeholder in .env.");
}

// Initialize GoogleGenAI SDK client
export const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

/**
 * Helper to call Gemini model and generate text content.
 * @param {string} prompt - Prompt string
 * @param {object} options - Optional configuration
 * @returns {Promise<string>} - Generated text response
 */
export async function generateGeminiText(prompt, options = {}) {
  try {
    if (!apiKey || apiKey === "your_gemini_api_key_here") {
      throw new Error("GEMINI_API_KEY is missing or invalid in .env file.");
    }

    const config = {};
    if (options.systemInstruction) {
      config.systemInstruction = options.systemInstruction;
    }
    if (options.temperature !== undefined) {
      config.temperature = options.temperature;
    }
    if (options.jsonMode) {
      config.responseMimeType = "application/json";
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config,
    });

    return response.text || "";
  } catch (error) {
    console.error("❌ Gemini API Error:", error.message);
    throw error;
  }
}

/**
 * Helper to call Gemini and parse JSON response reliably.
 * @param {string} prompt - Prompt string expecting JSON response
 * @param {object} options - Optional configuration
 * @returns {Promise<object>} - Parsed JSON object
 */
export async function generateGeminiJSON(prompt, options = {}) {
  const textResponse = await generateGeminiText(prompt, { ...options, jsonMode: true });
  try {
    // Clean any markdown formatting if present
    const cleanedText = textResponse.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleanedText);
  } catch (parseError) {
    console.error("❌ Failed to parse Gemini JSON output:", textResponse);
    throw new Error(`Invalid JSON format from Gemini response: ${parseError.message}`);
  }
}

export default {
  ai,
  generateGeminiText,
  generateGeminiJSON,
  modelName,
};
