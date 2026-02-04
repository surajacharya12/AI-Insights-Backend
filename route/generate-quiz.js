import express from 'express';
import db from '../config/db.js';
import { quizHistoryTable } from '../config/schema.js';
import { eq } from 'drizzle-orm';

const router = express.Router();
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY_GRAMMAR;
const OPENROUTER_MODEL = 'google/gemma-3n-e2b-it:free';

// Helper function to call OpenRouter API
async function generateQuizFromOpenRouter(prompt) {
    const maxRetries = 5;
    let attempt = 0;

    while (attempt < maxRetries) {
        try {
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: OPENROUTER_MODEL,
                    messages: [{ role: "user", content: prompt }]
                })
            });

            if (response.status === 429) {
                attempt++;
                const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
                console.log(`Hit 429, retrying in ${Math.round(delay)}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`OpenRouter API error: ${response.status} - ${text}`);
            }

            const data = await response.json();
            const responseText = data.choices?.[0]?.message?.content;
            if (!responseText) throw new Error("Empty response from OpenRouter");

            // Clean up JSON formatting
            const cleaned = responseText.replace(/```json|```/g, '').trim();
            JSON.parse(cleaned); // Validate JSON
            return cleaned;

        } catch (err) {
            if (attempt >= maxRetries - 1) throw err;
            attempt++;
            const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
            console.warn(`Attempt ${attempt} failed, retrying in ${Math.round(delay)}ms...`, err.message);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

// Generate quiz
router.post('/', async (req, res) => {
    const { topic, numQuestions = 5 } = req.body;
    if (!topic) return res.status(400).json({ error: 'Topic is required' });
    if (!OPENROUTER_API_KEY) return res.status(500).json({ error: 'API key missing' });

    const prompt = `Generate a quiz with exactly ${numQuestions} multiple-choice questions about "${topic}" in JSON format:
[{
  "question": "Question?",
  "options": ["A","B","C","D"],
  "answer": "Correct answer"
}]
Return pure JSON only. No markdown, no code fences.`;

    try {
        const quiz = await generateQuizFromOpenRouter(prompt);
        res.json({ quiz });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message || 'Failed to generate quiz' });
    }
});

// Save quiz result
router.post('/save-result', async (req, res) => {
    try {
        const { userEmail, topic, score, totalQuestions, date } = req.body;
        if (!userEmail || !topic) return res.status(400).json({ error: 'Missing fields' });

        const result = await db.insert(quizHistoryTable).values({ userEmail, topic, score, totalQuestions, date }).returning();
        res.json({ success: true, result: result[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to save quiz result' });
    }
});

// Get quiz history
router.get('/history/:email', async (req, res) => {
    try {
        const { email } = req.params;
        const history = await db.select().from(quizHistoryTable).where(eq(quizHistoryTable.userEmail, email));
        res.json({ history });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

export default router;
