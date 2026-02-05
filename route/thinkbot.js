import express from "express";
import OpenAI from "openai";

const router = express.Router();

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY_THINKBOT;

// Validate API key exists
if (!NVIDIA_API_KEY) {
  console.error("❌ NVIDIA_API_KEY_THINKBOT is not set in environment variables");
}

const client = new OpenAI({
  baseURL: "https://integrate.api.nvidia.com/v1",
  apiKey: NVIDIA_API_KEY,
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
    if (!NVIDIA_API_KEY) {
      return res.status(500).json({
        success: false,
        error: "ThinkBot is not configured. Please contact the administrator.",
        details: "Missing NVIDIA API key configuration",
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

    // 🔹 Generate completion with reasoning enabled
    const completion = await client.chat.completions.create({
      model: "deepseek-ai/deepseek-v3.2", // Updated to fix 404
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: message },
      ],
      temperature: 1,
      top_p: 0.95,
      max_tokens: 4096,
      stream: true,
      extra_body: {
        chat_template_kwargs: {
          thinking: true
        }
      }
    });

    let answer = "";
    let reasoningText = "";

    for await (const chunk of completion) {
      if (!chunk.choices || chunk.choices.length === 0) continue;

      const delta = chunk.choices[0].delta;

      // Handle Reasoning/Thinking content
      if (delta.reasoning_content) {
        reasoningText += delta.reasoning_content;
      }

      // Handle Main Content
      if (delta.content) {
        answer += delta.content;
      }
    }

    // 🔹 Post-process identity safety
    let processedAnswer = answer
      .replace(/\bNex\b/gi, "ThinkBot")
      .replace(/\bDeepSeek\b/gi, "ThinkBot")
      .replace(/Shanghai Innovation Institution/gi, "Suraj Acharya")
      .replace(/I'm a large language model/gi, "I'm ThinkBot, an AI assistant")
      .replace(/I am a large language model/gi, "I am ThinkBot, an AI assistant");

    return res.json({
      success: true,
      data: {
        answer: processedAnswer,
        reasoning: reasoningText // Return this in case the frontend wants to show "thinking"
      },
    });

  } catch (error) {
    console.error("ThinkBot Error:", error);

    // Handle rate limiting
    if (error.status === 429) {
      return res.status(429).json({
        success: false,
        error: "Rate limit exceeded. Please try again later.",
      });
    }

    // Handle authentication errors
    if (error.status === 401) {
      return res.status(500).json({
        success: false,
        error: "ThinkBot authentication failed. Please contact the administrator.",
        details: "Invalid NVIDIA API key",
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