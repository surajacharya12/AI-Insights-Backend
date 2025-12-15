import express from "express";

const router = express.Router();

const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY_THINK_BOT}`;

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

    const geminiRes = await fetch(GEMINI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return res.status(geminiRes.status).json({
        success: false,
        error: "Gemini API error",
        details: errText,
      });
    }

    const data = await geminiRes.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return res.json({
      success: true,
      data: {
        answer: text,
      },
    });
  } catch (error) {
    console.error("ThinkBot Error:", error);

    // 🔹 Handle quota exceeded
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
