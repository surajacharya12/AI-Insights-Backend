import express from "express";
import { GoogleGenAI } from "@google/genai";
import axios from "axios";

const router = express.Router();
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API,
});

/* =====================================================
   IMAGE GENERATION (Native with Gemini)
===================================================== */
router.post("/generate-image", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) return res.status(400).json({ success: false, message: "Prompt is required" });

    try {
      console.log("Attempting native image generation with gemini-2.5-flash-image...");

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: prompt,
      });

      let imageBase64 = null;
      let textOutput = "";

      for (const part of response.candidates[0].content.parts) {
        if (part.text) textOutput += part.text;
        else if (part.inlineData) imageBase64 = part.inlineData.data;
      }

      if (imageBase64) {
        return res.json({
          success: true,
          tool: "Gemini Native Image Generator",
          output: { image: imageBase64, caption: textOutput || "AI-generated image" },
        });
      }
    } catch (imageError) {
      console.warn("Gemini native image generation failed:", imageError.message);
    }

    // Fallback: Enhanced prompt
    try {
      console.log("Falling back to enhanced prompt generation...");
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `Create a highly detailed AI image prompt based on: "${prompt}". Return ONLY the final enhanced prompt.`,
      });

      const enhancedPrompt = response.text.trim();

      return res.json({
        success: true,
        tool: "Gemini Enhanced Prompt Generator (Fallback)",
        output: { enhanced_prompt: enhancedPrompt, is_fallback: true },
      });
    } catch (textError) {
      console.warn("Gemini text generation failed:", textError.message);
      return res.json({
        success: true,
        tool: "Raw Prompt (Fallback)",
        output: { enhanced_prompt: prompt, is_fallback: true, is_raw: true },
      });
    }
  } catch (error) {
    console.error("Image Generation Error:", error);
    handleGeminiError(error, res, "generate-image");
  }
});

/* =====================================================
   GRAMMAR & WRITING TOOL (Grammarly-like)
===================================================== */
router.post("/grammar-check", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ success: false, message: "Text is required" });

    // Limit text to 2000 words
    const countWords = (str) => str.trim().split(/\s+/).filter(Boolean).length;
    const trimmedText = countWords(text) > 2000 ? text.split(/\s+/).slice(0, 2000).join(" ") : text;

    const prompt = `Correct the grammar of the following text and return only the corrected version:\n\n"${trimmedText}"`;
    const GEMINI_API_KEY = process.env.GEMINI_API;

    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY_GRAMMAR}`,
        { contents: [{ parts: [{ text: prompt }] }] },
        { headers: { "Content-Type": "application/json" } }
      );

      const corrected = response.data.candidates?.[0]?.content?.parts?.[0]?.text || trimmedText;

      return res.json({
        success: true,
        tool: "Gemini Grammar Checker",
        original_text: trimmedText,
        corrected_text: corrected,
      });
    } catch (geminiError) {
      console.warn("Gemini error:", geminiError.response?.data || geminiError.message);

      if (geminiError.response?.status === 429) {
        return res.status(429).json({
          success: false,
          message: "Daily Gemini API quota exceeded. Please try again later.",
          retryAfter: 30,
          fallback: {
            message: "Upgrade your Gemini API plan for unlimited access",
            link: "https://ai.google.dev/pricing",
          },
        });
      }

      return res.status(500).json({
        success: false,
        message: "Error checking grammar",
        error: geminiError.response?.data || geminiError.message,
      });
    }
  } catch (error) {
    console.error("Grammar Check Error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

/* =====================================================
   CENTRALIZED ERROR HANDLER
===================================================== */
function handleGeminiError(error, res, endpoint = "unknown") {
  const errorMessage = error.message || error.toString();
  const errorCode = error.error?.code || error.status;
  const errorStatus = error.error?.status || error.status;

  if (
    errorCode === 429 ||
    errorStatus === "RESOURCE_EXHAUSTED" ||
    errorMessage.includes("429") ||
    errorMessage.includes("quota") ||
    errorMessage.includes("RESOURCE_EXHAUSTED")
  ) {
    return res.status(429).json({
      success: false,
      message: `Daily quota exceeded for Gemini API. Please retry later.`,
      endpoint,
    });
  }

  res.status(500).json({ success: false, error: errorMessage });
}

export default router;
