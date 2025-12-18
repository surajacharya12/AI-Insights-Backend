import express from "express";

const router = express.Router();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY_THINK_BOT; // Add your OpenRouter API key here
const SITE_URL = process.env.SITE_URL || "http://localhost:3000"; // optional
const SITE_NAME = process.env.SITE_NAME || "ThinkBot"; // optional

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

    const openRouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": SITE_URL,
        "X-Title": SITE_NAME,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "nex-agi/deepseek-v3.1-nex-n1:free",
        messages: [
          {
            role: "system",
            content: systemMessage,
          },
          {
            role: "user",
            content: message,
          },
        ],
      }),
    });

    if (!openRouterRes.ok) {
      const errText = await openRouterRes.text();
      return res.status(openRouterRes.status).json({
        success: false,
        error: "OpenRouter API error",
        details: errText,
      });
    }

    const data = await openRouterRes.json();

    // The response structure might vary depending on the OpenRouter model
    let answer = data?.choices?.[0]?.message?.content || "";

    // 🔹 Post-process the response to ensure correct identity
    // Replace any mentions of incorrect identity with ThinkBot
    answer = answer
      .replace(/\bNex\b/g, "ThinkBot")
      .replace(/\bnex\b/g, "ThinkBot")
      .replace(/Shanghai Innovation Institution/gi, "Suraj Acharya")
      .replace(/DeepSeek/gi, "ThinkBot")
      .replace(/I'm a large language model/gi, "I'm ThinkBot, an AI assistant")
      .replace(/I am a large language model/gi, "I am ThinkBot, an AI assistant")
      .replace(/developed by Shanghai Innovation Institution and its entrepreneurial partners/gi, "developed by Suraj Acharya");

    return res.json({
      success: true,
      data: {
        answer,
      },
    });
  } catch (error) {
    console.error("ThinkBot Error:", error);

    if (error.message?.includes("429")) {
      return res.status(429).json({
        success: false,
        error: "Quota exceeded. Please try again later.",
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to generate AI response",
      details: error.message,
    });
  }
});

export default router;
