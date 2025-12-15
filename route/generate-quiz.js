import express from 'express';
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = express.Router();

const MODELS_TO_TRY = ["gemini-2.0-flash-exp", "gemini-1.5-flash", "gemini-1.5-pro"];

router.post('/', async (req, res) => {
    try {
        const { topic } = req.body;

        if (!topic) {
            return res.status(400).json({ error: "Topic is required" });
        }

        const apiKey = process.env.GEMINI_API || process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("❌ GEMINI_API or GEMINI_API_KEY is missing!");
            return res.status(500).json({ error: "Server configuration error" });
        }

        const genAI = new GoogleGenerativeAI(apiKey);

        const prompt = `Generate a quiz with 5 multiple-choice questions about the topic: "${topic}".
Each question should be a JSON object like this:
{
  "question": "Your question?",
  "options": ["A", "B", "C", "D"],
  "answer": "Correct answer"
}
Return an array of 5 such question objects in valid JSON format.
Do not include any markdown or code fences (like \`\`\`json) in the response. Return only the pure JSON.`;

        let lastError = null;

        for (const modelName of MODELS_TO_TRY) {
            try {
                console.log(`🤖 Generating quiz with model: ${modelName}`);
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    safetySettings: [
                        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
                    ]
                });

                const result = await model.generateContent(prompt);
                const responseText = result.response.text();

                // Clean up potential markdown
                const cleanedText = responseText.replace(/```json|```/g, "").trim();

                // Validate JSON
                JSON.parse(cleanedText);

                return res.json({ quiz: cleanedText });

            } catch (error) {
                console.warn(`⚠️ Model ${modelName} failed:`, error.message);
                lastError = error;

                if (error.status === 429 || (error.message && error.message.includes("429"))) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }
        }

        throw lastError || new Error("All models failed to generate quiz.");

    } catch (error) {
        console.error("Error generating quiz:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

export default router;