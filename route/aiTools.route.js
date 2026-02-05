import express from "express";
import { GoogleGenAI } from "@google/genai";
import fetch from "node-fetch";
import Bytez from "bytez.js";

const router = express.Router();

/* =====================================================
   GEMINI INIT
===================================================== */
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_IMAGE,
});

/* =====================================================
   BYTEZ SETUP (OCR)
===================================================== */
const bytezKey = process.env.BYTEZ_API_KEY_TEXT_IMAGE;
const bytezSdk = new Bytez(bytezKey);
const ocrModel = bytezSdk.model("WafaaFraih/blip-roco-radiology-captioning");

/* =====================================================
   IMAGE GENERATION (Pollinations)
===================================================== */
router.post("/generate-image", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ success: false, message: "Prompt is required" });
    }

    console.log("Generating image via Nvidia Flux.1-Schnell...");

    const invokeUrl = "https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-schnell";

    const headers = {
      "Authorization": `Bearer ${process.env.NVIDIA_API_KEY_IMAGE}`,
      "Accept": "application/json",
      "Content-Type": "application/json"
    };

    const payload = {
      "prompt": prompt,
      "width": 1024,
      "height": 1024,
      "seed": 0,
      "steps": 4
    };

    const response = await fetch(invokeUrl, {
      method: "post",
      body: JSON.stringify(payload),
      headers: headers
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Invocation failed with status ${response.status}: ${errBody}`);
    }

    const response_body = await response.json();

    // Assuming Nvidia API returns { artifacts: [ { base64: "..." } ] }
    const imageBase64 = response_body.artifacts?.[0]?.base64;

    if (!imageBase64) {
      throw new Error("No image returned from Nvidia API");
    }

    return res.json({
      success: true,
      tool: "Nvidia Flux.1-Schnell",
      output: {
        image: imageBase64,
        caption: prompt,
      },
    });

  } catch (error) {
    console.error("Image Generation Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/* =====================================================
   GRAMMAR & WRITING TOOL
===================================================== */
router.post("/grammar-check", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, message: "Text is required" });
    }

    const countWords = (str) =>
      str.trim().split(/\s+/).filter(Boolean).length;

    const trimmedText =
      countWords(text) > 2000
        ? text.split(/\s+/).slice(0, 2000).join(" ")
        : text;

    const prompt = `Correct the grammar of the following text and return only the corrected version:\n\n"${trimmedText}"`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.NVIDIA_API_KEY_LLAMA}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta/llama-4-maverick-17b-128e-instruct",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2048,
        temperature: 0.1, // Lower temperature for more accurate corrections
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = await response.json();
    const corrected = data.choices?.[0]?.message?.content || trimmedText;

    return res.json({
      success: true,
      tool: "Nvidia Llama 4 Maverick Grammar Checker",
      original_text: trimmedText,
      corrected_text: corrected,
    });
  } catch (error) {
    console.error("Grammar Check Error:", error);
    const statusCode = error.name === 'AbortError' ? 504 : 500;
    const message = error.name === 'AbortError' ? "Request timeout. Please try again." : "Server error";
    return res.status(statusCode).json({
      success: false,
      message: message,
      error: error.message,
    });
  }
});

/* =====================================================
   TEXT GENERATION WITH REASONING (NVIDIA Nemotron)
===================================================== */
/* =====================================================
   IMAGE TO TEXT (Vision / OCR)
===================================================== */
router.post("/image-to-text", async (req, res) => {
  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({
        success: false,
        message: "Image is required",
      });
    }

    console.log("Extracting text via NVIDIA Phi-4 Multimodal...");

    // Remove data URL prefix if present
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const invokeUrl = "https://integrate.api.nvidia.com/v1/chat/completions";
    const headers = {
      "Authorization": `Bearer ${process.env.NVIDIA_API_KEY_TEXT_IMAGE}`,
      "Accept": "application/json",
      "Content-Type": "application/json"
    };

    const payload = {
      "model": "microsoft/phi-4-multimodal-instruct",
      "messages": [
        {
          "role": "user",
          "content": `Extract all text from this image. If there is no text, describe the image in detail. <img src="data:image/png;base64,${cleanBase64}" />`
        }
      ],
      "max_tokens": 1024,
      "temperature": 0.1,
      "top_p": 0.7
    };

    const response = await fetch(invokeUrl, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: headers
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error("NVIDIA Phi-4 Error:", errBody);
      throw new Error(`NVIDIA API failed with status ${response.status}`);
    }

    const data = await response.json();
    const extractedText = data.choices?.[0]?.message?.content || "No text could be extracted.";

    return res.json({
      success: true,
      tool: "NVIDIA Phi-4 Multimodal",
      text: extractedText.trim(),
    });

  } catch (error) {
    console.error("Image to Text (NVIDIA) Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to extract text from image",
    });
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
    errorMessage.includes("quota")
  ) {
    return res.status(429).json({
      success: false,
      message: "Daily quota exceeded. Please retry later.",
      endpoint,
    });
  }

  res.status(500).json({ success: false, error: errorMessage });
}

export default router;
