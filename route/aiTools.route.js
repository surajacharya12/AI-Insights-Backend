import express from "express";
import { GoogleGenAI } from "@google/genai";

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

    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: "Prompt is required",
      });
    }

    try {
      // Try native image generation with gemini-2.5-flash-image
      console.log(
        "Attempting native image generation with gemini-2.5-flash-image..."
      );

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: prompt,
      });

      // Extract image and text from response
      let imageBase64 = null;
      let textOutput = "";

      for (const part of response.candidates[0].content.parts) {
        if (part.text) {
          textOutput += part.text;
        } else if (part.inlineData) {
          imageBase64 = part.inlineData.data;
        }
      }

      if (imageBase64) {
        return res.json({
          success: true,
          tool: "Gemini Native Image Generator",
          output: {
            image: imageBase64,
            caption: textOutput || "AI-generated image",
          },
        });
      }
    } catch (imageError) {
      console.warn(
        "Gemini native image generation failed:",
        imageError.message
      );
      // Fallback to enhanced prompt generation
    }

    // Fallback: Generate Enhanced Prompt with text model
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
        output: {
          enhanced_prompt: enhancedPrompt,
          is_fallback: true,
        },
      });
    } catch (textError) {
      console.warn("Gemini text generation failed:", textError.message);
      // Ultimate fallback: Use raw prompt
      return res.json({
        success: true,
        tool: "Raw Prompt (Fallback)",
        output: {
          enhanced_prompt: prompt,
          is_fallback: true,
          is_raw: true,
        },
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

    if (!text) {
      return res.status(400).json({
        success: false,
        message: "Text is required",
      });
    }

    const prompt = `Analyze the following text for grammar, spelling, and writing quality. Return a JSON object with these exact keys:
- corrected_text: the corrected version of the text
- mistakes: array of mistakes found (each with "original", "corrected", "type" fields)
- suggestions: array of writing improvement suggestions (strings)
- writing_score: a number from 0-100 representing overall quality

Text to analyze:
${text}

Return ONLY valid JSON, no additional text.`;

    // Try multiple models with fallback
    const modelsToTry = ["gemini-2.0-flash", "gemini-2.5-flash"];

    let lastError = null;
    let allQuotaExceeded = true;

    for (const modelName of modelsToTry) {
      try {
        console.log(`Attempting grammar check with ${modelName}...`);

        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
        });

        const responseText = response.text.trim();

        // Try to extract JSON from the response
        let jsonMatch = responseText.match(/\{[\s\S]*\}/);
        let output;

        if (jsonMatch) {
          output = JSON.parse(jsonMatch[0]);
        } else {
          // If no JSON found, create a structured response
          output = {
            corrected_text: text,
            mistakes: [],
            suggestions: [responseText],
            writing_score: 70,
          };
        }

        return res.json({
          success: true,
          tool: `Gemini Grammar Checker (${modelName})`,
          output: output,
        });
      } catch (error) {
        console.warn(`${modelName} failed:`, error.message);
        lastError = error;

        // Track if error is NOT quota-related
        if (!(error.status === 429 || error.error?.code === 429)) {
          allQuotaExceeded = false;
        }

        // If it's a 404 (model not found), try next model immediately
        if (error.status === 404 || error.error?.code === 404) {
          continue;
        }

        // If it's a quota error, try next model
        if (error.status === 429 || error.error?.code === 429) {
          continue;
        }

        // For other errors, break and handle
        break;
      }
    }

    // If all models failed due to quota, provide a helpful fallback response
    if (
      allQuotaExceeded &&
      lastError &&
      (lastError.status === 429 || lastError.error?.code === 429)
    ) {
      console.log("All models quota exceeded. Providing fallback response.");

      // Extract retry delay
      let retryAfterSeconds = 30;
      if (lastError.error?.details) {
        const retryInfo = lastError.error.details.find((d) =>
          d["@type"]?.includes("RetryInfo")
        );
        if (retryInfo?.retryDelay) {
          const delayMatch = retryInfo.retryDelay.match(/(\d+)s/);
          if (delayMatch) {
            retryAfterSeconds = parseInt(delayMatch[1]);
          }
        }
      }

      return res.status(429).json({
        success: false,
        message: `Daily API quota exceeded. Please try again in ${retryAfterSeconds} seconds.`,
        details: "All Gemini models have reached their quota limits",
        retryAfter: retryAfterSeconds,
        endpoint: "grammar-check",
        fallback: {
          message:
            "Consider upgrading your Gemini API plan for unlimited access",
          link: "https://ai.google.dev/pricing",
        },
      });
    }

    // If all models failed for other reasons, handle the last error
    console.error("All models failed. Last error:", lastError);
    handleGeminiError(lastError, res, "grammar-check");
  } catch (error) {
    console.error("Grammar Check Error:", error);
    handleGeminiError(error, res, "grammar-check");
  }
});

/* =====================================================
   CENTRALIZED ERROR HANDLER
===================================================== */
function handleGeminiError(error, res, endpoint = "unknown") {
  const errorMessage = error.message || error.toString();

  // Extract error code from new SDK format (error.error.code) or old format (error.status)
  const errorCode = error.error?.code || error.status;
  const errorStatus = error.error?.status || error.status;

  // 429: Rate Limit / Quota Exceeded
  if (
    errorCode === 429 ||
    errorStatus === "RESOURCE_EXHAUSTED" ||
    errorMessage.includes("429") ||
    errorMessage.includes("quota") ||
    errorMessage.includes("RESOURCE_EXHAUSTED")
  ) {
    // Extract retry delay from error details
    let retryAfterSeconds = 30; // Default fallback

    // Try to extract from error.error.details (new SDK format)
    if (error.error?.details) {
      const retryInfo = error.error.details.find((d) =>
        d["@type"]?.includes("RetryInfo")
      );
      if (retryInfo?.retryDelay) {
        const delayMatch = retryInfo.retryDelay.match(/(\d+)s/);
        if (delayMatch) {
          retryAfterSeconds = parseInt(delayMatch[1]);
        }
      }
    }

    // Try to extract from error message as fallback
    if (retryAfterSeconds === 30) {
      const retryMatch = errorMessage.match(/retry in ([\d.]+)s/i);
      if (retryMatch) {
        retryAfterSeconds = Math.ceil(parseFloat(retryMatch[1]));
      }
    }

    return res.status(429).json({
      success: false,
      message: `Daily quota exceeded for Gemini API. Please try again in ${retryAfterSeconds} seconds.`,
      details: "API Rate Limit Hit",
      retryAfter: retryAfterSeconds,
      endpoint: endpoint,
    });
  }

  // 503: Model Overloaded (Service Unavailable)
  if (
    errorCode === 503 ||
    errorMessage.includes("503") ||
    errorMessage.includes("overloaded")
  ) {
    return res.status(503).json({
      success: false,
      message: "Google AI is currently overloaded. Please wait and try again.",
      details: "Model Overloaded",
    });
  }

  // 404: Model Not Found
  if (
    errorCode === 404 ||
    errorMessage.includes("404") ||
    errorMessage.includes("not found")
  ) {
    return res.status(404).json({
      success: false,
      message: "Model configuration error. The model might not be available.",
      details: errorMessage,
    });
  }

  // 400: Bad Request (API Key issues)
  if (
    errorCode === 400 ||
    errorMessage.includes("400") ||
    errorMessage.includes("API key")
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid API key or bad request.",
      details: errorMessage,
    });
  }

  // Generic 500
  res.status(500).json({
    success: false,
    error: errorMessage,
  });
}

export default router;
