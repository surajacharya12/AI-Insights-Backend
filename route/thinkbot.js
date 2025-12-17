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

    // 🔹 Prompt aligned with your frontend ThinkBot behavior
    const prompt = `
You are a helpful AI assistant. Answer the user's question clearly and concisely.
Use Markdown formatting to structure your response.
- Use paragraphs for explanations.
- Use bullet points or numbered lists where appropriate.
- Use tables for comparisons or structured data.
- Use code blocks for code snippets.

Question:
${message}
`;

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
            role: "user",
            content: prompt,
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
    const answer =
      data?.choices?.[0]?.message?.content || "";

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
