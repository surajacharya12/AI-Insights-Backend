import express from "express";
import { OpenRouter } from "@openrouter/sdk";

const router = express.Router();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY_THINK_BOT;
const SITE_URL = process.env.SITE_URL || "http://localhost:3000";
const SITE_NAME = process.env.SITE_NAME || "ThinkBot";

// Validate API key exists
if (!OPENROUTER_API_KEY) {
  console.error("❌ OPENROUTER_API_KEY_THINK_BOT is not set in environment variables");
}

const openrouter = new OpenRouter({
  apiKey: OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": SITE_URL,
    "X-Title": SITE_NAME,
  },
});

// POST /api/chat
router.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: "Message is required",
      });
    }

    // Check if API key is configured
    if (!OPENROUTER_API_KEY) {
      return res.status(500).json({
        success: false,
        error: "ThinkBot is not configured. Please contact the administrator.",
        details: "Missing API key configuration",
      });
    }

    // 🔹 System message to override model's default identity
    const systemMessage = `You are ThinkBot, an AI assistant developed by Suraj Acharya.

CRITICAL IDENTITY RULES:
- Your name is ThinkBot (NOT Nex, NOT DeepSeek, NOT any other name)
- You were developed by Suraj Acharya (NOT Shanghai Innovation Institution or any other organization)
- When asked about your name or identity, respond: "I'm ThinkBot, an AI assistant developed by Suraj Acharya."
- NEVER mention Nex, DeepSeek, Shanghai Innovation Institution, or any other AI model/organization
- If you don't know something, just say you don't know - don't make up information about your identity

Answer the user's questions clearly and concisely.
Use Markdown formatting to structure your response:
- Use paragraphs for explanations.
- Use bullet points or numbered lists where appropriate.
- Use tables for comparisons or structured data.
- Use code blocks for code snippets.`;

    // 🔹 Stream internally
    const stream = await openrouter.chat.send({
      model: "openai/gpt-4o-mini",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: message },
      ],
      stream: true,
      streamOptions: {
        includeUsage: true,
      },
    });

    let answer = "";

    for await (const chunk of stream) {
      const content = chunk.choices?.[0]?.delta?.content;
      if (content) {
        answer += content;
      }
    }

    // 🔹 Post-process identity safety
    answer = answer
      .replace(/\bNex\b/gi, "ThinkBot")
      .replace(/\bDeepSeek\b/gi, "ThinkBot")
      .replace(/Shanghai Innovation Institution/gi, "Suraj Acharya")
      .replace(/I'm a large language model/gi, "I'm ThinkBot, an AI assistant")
      .replace(/I am a large language model/gi, "I am ThinkBot, an AI assistant");

    return res.json({
      success: true,
      data: { answer },
    });

  } catch (error) {
    console.error("ThinkBot Error:", error);

    // Handle insufficient credits
    if (error.statusCode === 402) {
      return res.status(402).json({
        success: false,
        error: "ThinkBot credits exhausted. Please purchase more credits at https://openrouter.ai/settings/credits or contact the administrator.",
        details: "Insufficient credits for the selected model",
      });
    }

    // Handle rate limiting
    if (error.message?.includes("429") || error.status === 429) {
      return res.status(429).json({
        success: false,
        error: "Rate limit exceeded. Please try again later.",
      });
    }

    // Handle authentication errors
    if (error.message?.includes("401") || error.status === 401) {
      return res.status(500).json({
        success: false,
        error: "ThinkBot authentication failed. Please contact the administrator.",
        details: "Invalid API key",
      });
    }

    // Handle network errors
    if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
      return res.status(503).json({
        success: false,
        error: "ThinkBot service is temporarily unavailable. Please try again later.",
        details: "Network connection error",
      });
    }

    // Generic error handler
    return res.status(500).json({
      success: false,
      error: "Failed to generate AI response. Please try again.",
      details: error.message || "Unknown error occurred",
    });
  }
});

export default router;