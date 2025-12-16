import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import db from '../config/db.js';
import { quizHistoryTable } from '../config/schema.js';
import { eq } from "drizzle-orm";

const router = express.Router();
const MODELS_TO_TRY = ['gemini-flash-latest'];

// Generate quiz
router.post('/', async (req, res) => {
    const { topic, numQuestions = 5 } = req.body;
    if (!topic) return res.status(400).json({ error: 'Topic is required' });

    const apiKey = process.env.GEMINI_API_KEY_QUIZ;
    if (!apiKey) return res.status(500).json({ error: 'API key missing' });

    const genAI = new GoogleGenerativeAI(apiKey);
    const prompt = `Generate a quiz with exactly ${numQuestions} multiple-choice questions about "${topic}" in JSON format:
[{
  "question": "Question?",
  "options": ["A","B","C","D"],
  "answer": "Correct answer"
}]
Return pure JSON only. No markdown, no code fences.`;

    let lastError = null;

    for (const modelName of ['gemini-1.5-flash', 'gemini-2.0-flash']) {
        try {
            const model = genAI.getGenerativeModel({
                model: modelName,
                safetySettings: [
                    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
                ]
            });

            let result;
            let attempt = 0;
            const maxRetries = 5;

            while (attempt < maxRetries) {
                try {
                    result = await model.generateContent(prompt);
                    break;
                } catch (e) {
                    if (e.message.includes('429') || e.status === 429) {
                        attempt++;
                        if (attempt >= maxRetries) throw e;

                        let delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;

                        // Try to parse retry time from error message
                        const match = e.message.match(/retry in (\d+(\.\d+)?)s/);
                        if (match && match[1]) {
                            delay = Math.ceil(parseFloat(match[1])) * 1000 + 1000; // Add 1s buffer
                        }

                        console.log(`Model ${modelName} hit 429, retrying in ${Math.round(delay)}ms...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                    } else {
                        throw e;
                    }
                }
            }

            const response = await result.response;
            const responseText = response.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!responseText) {
                throw new Error("Empty response from AI model");
            }

            const cleaned = responseText.replace(/```json|```/g, '').trim();
            // Validate JSON
            JSON.parse(cleaned);
            return res.json({ quiz: cleaned });
        } catch (err) {
            console.warn(`Model ${modelName} failed:`, err.message);
            lastError = err;
        }
    }

    return res.status(500).json({ error: lastError?.message || 'Failed to generate quiz' });
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
