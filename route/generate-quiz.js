import express from "express";
import db from "../config/db.js";
import { quizHistoryTable } from "../config/schema.js";
import { eq } from "drizzle-orm";
import OpenAI from 'openai';

const router = express.Router();

// ================= ENV =================
const openai = new OpenAI({
    apiKey: process.env.NVIDIA_API_KEY_QUIZ,
    baseURL: 'https://integrate.api.nvidia.com/v1',
})

// ================= Helper =================
async function generateQuiz(prompt) {
    try {
        const completion = await openai.chat.completions.create({
            model: "google/gemma-3-1b-it",
            messages: [{ "role": "user", "content": prompt }],
            temperature: 0.1,
            top_p: 0.7,
            max_tokens: 512,
            stream: false
        })

        const responseText = completion.choices[0]?.message?.content;

        if (!responseText) throw new Error("Empty response from OpenAI");

        // Clean JSON (same idea as before)
        const cleaned = String(responseText)
            .replace(/```json|```/g, "")
            .trim();

        // Validate JSON
        JSON.parse(cleaned);

        return cleaned;

    } catch (err) {
        console.error("Quiz generation error:", err);
        throw err;
    }
}

// ================= Generate Quiz =================
router.post("/", async (req, res) => {
    const { topic, numQuestions = 5 } = req.body;

    if (!topic) return res.status(400).json({ error: "Topic is required" });


    const prompt = `Generate a quiz with exactly ${numQuestions} multiple-choice questions about "${topic}" in JSON format:
[{
  "question": "Question?",
  "options": ["A","B","C","D"],
  "answer": "Correct answer"
}]
Return pure JSON only. No markdown. No code fences.`;

    try {
        const quiz = await generateQuiz(prompt);
        res.json({ quiz });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message || "Failed to generate quiz" });
    }
});

// ================= Save Quiz Result =================
router.post("/save-result", async (req, res) => {
    try {
        const { userEmail, topic, score, totalQuestions, date } = req.body;

        if (!userEmail || !topic)
            return res.status(400).json({ error: "Missing fields" });

        const result = await db
            .insert(quizHistoryTable)
            .values({ userEmail, topic, score, totalQuestions, date })
            .returning();

        res.json({ success: true, result: result[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to save quiz result" });
    }
});

// ================= Get Quiz History =================
router.get("/history/:email", async (req, res) => {
    try {
        const { email } = req.params;

        const history = await db
            .select()
            .from(quizHistoryTable)
            .where(eq(quizHistoryTable.userEmail, email));

        res.json({ history });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch history" });
    }
});

export default router;
