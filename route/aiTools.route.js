import express from "express";
import { GoogleGenAI } from "@google/genai";
import axios from "axios";

const router = express.Router();
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_IMAGE,
});

/* =====================================================
   IMAGE GENERATION (Native with Gemini)
===================================================== */
router.post("/generate-image", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ success: false, message: "Prompt is required" });

    try {
      console.log("Generating image via Pollinations API...");

      // Pollinations API call
      const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?nologo=true`;
      const response = await fetch(pollinationsUrl);

      if (!response.ok) throw new Error("Pollinations API request failed");

      const imageBuffer = await response.arrayBuffer();
      const imageBase64 = Buffer.from(imageBuffer).toString("base64");

      return res.json({
        success: true,
        tool: "Pollinations Image API",
        output: { image: imageBase64, caption: prompt },
      });
    } catch (imageError) {
      console.error("Pollinations image generation failed:", imageError.message);
      return res.status(500).json({ success: false, message: imageError.message });
    }
  } catch (error) {
    console.error("Image Generation Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
})

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

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY_GRAMMAR}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "xiaomi/mimo-v2-flash:free",
          messages: [
            { role: "user", content: prompt }
          ]
        }),
      });

      const data = await response.json();

      const corrected = data.choices?.[0]?.message?.content || trimmedText;

      return res.json({
        success: true,
        tool: "OpenRouter Grammar Checker",
        original_text: trimmedText,
        corrected_text: corrected,
      });
    } catch (routerError) {
      console.error("OpenRouter Error:", routerError.message);

      return res.status(500).json({
        success: false,
        message: "Error checking grammar via OpenRouter",
        error: routerError.message,
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