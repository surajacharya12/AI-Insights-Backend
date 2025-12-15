import express from "express";
import db from "../config/db.js";
import { coursesTable } from "../config/schema.js";
import { GoogleGenAI, Modality } from "@google/genai";
import crypto from "crypto";

const router = express.Router();

const PROMPT = `Generate a Learning Course based on the following details.

IMPORTANT INSTRUCTIONS:
1. **Description**: Generate a NEW, comprehensive, and engaging description for the course. Do NOT just copy the user's input description. It should be suitable for a course landing page.
2. **Chapters & Topics**: Generate detailed and relevant chapters and topics. Do NOT simply repeat the course name or category. Ensure the content is educational and structured logically.
3. **Banner Image**: Create a prompt for a modern, flat-style 2D digital illustration with UI/UX elements, icons, mockups, text blocks, sticky notes, charts, and a 3D look using a vibrant color palette.

The response should be strictly valid JSON matching this structure:
{
  "course": {
    "name": "string",
    "description": "string",
    "category": "string",
    "level": "string",
    "duration": "string",
    "includeVideo": "boolean",
    "noOfChapters": "number",
    "bannerImagePrompt": "string",
    "chapters": [
      {
        "chapterName": "string",
        "duration": "string",
        "topics": ["string"]
      }
    ]
  }
}`;

const TEXT_MODELS_TO_TRY = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"];
const IMAGE_MODELS_TO_TRY = ["gemini-2.0-flash-exp", "gemini-1.5-flash", "gemini-flash-latest"]; // Image generation models

async function GenerateImageWithGemini(prompt) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_API;
    if (!apiKey) {
        throw new Error("Gemini API key is missing. Set GEMINI_API_KEY or GEMINI_API in .env");
    }
    const ai = new GoogleGenAI({ apiKey });

    // Try primary image model
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash-exp", // Using a model known for image gen capabilities if available, or the one user had
            contents: prompt,
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
                image: { width: 1024, height: 1024 },
            },
        });
        const imagePart = response.candidates?.[0]?.content?.parts.find(
            (part) => part.inlineData?.data
        );
        if (imagePart) return imagePart.inlineData.data;
    } catch (e) {
        console.warn("Primary image model failed:", e.message);
    }

    throw new Error("Image generation failed.");
}

function getFallbackCourse(formData) {
    const noOfChapters = Number(formData.noOfChapters) || 3;
    return {
        course: {
            name: formData.name || "Generated Course",
            description: formData.description || "Course description unavailable.",
            category: formData.category || "General",
            level: formData.level || "Beginner",
            duration: "1 Hour",
            includeVideo: formData.includeVideo === 'true' || formData.includeVideo === true,
            noOfChapters: noOfChapters,
            bannerImagePrompt: "Educational course banner",
            chapters: Array.from({ length: noOfChapters }, (_, i) => ({
                chapterName: `Chapter ${i + 1}: Introduction`,
                duration: "10 min",
                topics: ["Overview", "Key Concepts", "Summary"]
            }))
        }
    };
}

async function generateCourseContentWithRetry(ai, prompt, formData) {
    let lastError = null;
    for (const model of TEXT_MODELS_TO_TRY) {
        try {
            console.log(`Attempting to generate course with model: ${model}`);
            const response = await ai.models.generateContent({
                model: model,
                contents: [
                    {
                        role: "user",
                        parts: [
                            {
                                text: `${prompt}\n${JSON.stringify(formData)}`,
                            },
                        ],
                    },
                ],
                config: {
                    safetySettings: [
                        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
                    ]
                }
            });
            const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) return text;
        } catch (error) {
            console.warn(`Model ${model} failed:`, error.message);
            lastError = error;
            // Continue to next model
        }
    }
    throw lastError || new Error("All models failed to generate content.");
}

async function addNewCourse(req, res) {
    try {
        let { courseId, ...formData } = req.body;
        const email = req.user?.email || formData.email;
        if (!email) {
            return res
                .status(401)
                .json({ error: "Unauthorized: user not logged in" });
        }
        if (!courseId) courseId = crypto.randomUUID();

        const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_API;
        if (!apiKey) {
            throw new Error("Gemini API key is missing. Set GEMINI_API_KEY or GEMINI_API in .env");
        }

        // 1. Generate course structure using Gemini
        const ai = new GoogleGenAI({ apiKey });
        let jsonString;
        let generatedText;

        try {
            generatedText = await generateCourseContentWithRetry(ai, PROMPT, formData);

            // Extract JSON
            const extractJSON = (text) => {
                const first = text.indexOf("{");
                const last = text.lastIndexOf("}");
                if (first === -1 || last === -1) return null;
                return text.substring(first, last + 1);
            };
            jsonString = extractJSON(generatedText);
            if (!jsonString) throw new Error("Invalid JSON in AI output");

            // Validate JSON
            JSON.parse(jsonString);

        } catch (error) {
            console.error("AI Generation failed, using fallback:", error.message);
            const fallback = getFallbackCourse(formData);
            jsonString = JSON.stringify(fallback);
        }

        const parsedCourse = JSON.parse(jsonString);
        const course = parsedCourse.course;
        const noOfChapters = course.noOfChapters;
        const imagePrompt = course.bannerImagePrompt;

        // 3. Generate image using Gemini's multimodal capability (Optional)
        let bannerImageBase64 = null;
        try {
            bannerImageBase64 = await GenerateImageWithGemini(imagePrompt);
        } catch (error) {
            console.warn("Image generation failed, skipping image:", error.message);
        }

        // 4. Save course to DB
        await db.insert(coursesTable).values({
            cid: courseId,
            userEmail: email,
            name: formData.name,
            description: formData.description,
            category: formData.category,
            level: formData.level,
            includeVideo: formData.includeVideo,
            noOfChapters,
            courseJson: jsonString,
            bannerImageURL: bannerImageBase64 ? `data:image/png;base64,${bannerImageBase64}` : null,
        });
        return res.status(200).json({ courseId });
    } catch (error) {
        console.error("API error:", error);
        return res
            .status(500)
            .json({ error: error.message || "Internal server error" });
    }
}

router.post("/generate", addNewCourse);

export default router;