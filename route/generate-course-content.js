import express from "express";
import axios from "axios";
import db from "../config/db.js";
import { coursesTable } from "../config/schema.js";
import { eq } from "drizzle-orm";
import { GoogleGenAI } from "@google/genai";

const router = express.Router();
const YOUTUBE_BASE_URL = "https://www.googleapis.com/youtube/v3/search";

// Initialize Gemini
const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API || process.env.GEMINI_API_KEY,
});

// Fetch exactly 4 YouTube videos based on the exact topic/chapterName query
const GetYoutubeVideo = async (query) => {
    if (!query) return [];
    try {
        const params = {
            part: "snippet",
            q: query,
            key: process.env.YOUTUBE_API_KEY,
            type: "video",
            maxResults: 4,
        };
        const resp = await axios.get(YOUTUBE_BASE_URL, { params });

        return resp.data.items.map((item) => ({
            videoId: item.id?.videoId,
            title: item.snippet?.title,
        }));
    } catch (error) {
        console.error("YouTube API error:", error.message);
        return [];
    }
};

// POST: Generate AI course content and save to DB
router.post("/", async (req, res) => {
    const PROMPT = `You are an AI that generates strictly valid JSON educational content.

Given a chapter name and its topics, generate json-formatted content for each topic. Embed a JSON structure.

⚠️ RULES:
- Do NOT include triple backticks, markdown formatting, or explanations.
- Only output raw, valid JSON.
- Ensure it is valid and parseable JSON.
- Use this format:

{
  "chapterName": "Chapter Name",
  "topics": [
    {
      "topic": "Topic Name",
      "content": "json formatted content here"
    }
  ]
}

Now here is the chapter data:
`;

    try {
        const { courseJson, courseTitle, courseId } = req.body;

        if (!courseId || !courseJson || !courseTitle) {
            return res.status(400).json({ error: "Missing courseId, courseJson, or courseTitle in request body" });
        }

        // For each chapter, generate AI content, parse, add YouTube videos
        const CourseContent = [];
        for (const chapter of courseJson?.chapters || []) {
            try {
                // Helper to generate content with retry logic
                const generateWithRetry = async (retries = 3) => {
                    const models = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"];

                    for (const model of models) {
                        try {
                            const response = await ai.models.generateContent({
                                model: model,
                                contents: [
                                    {
                                        role: "user",
                                        parts: [{ text: `${PROMPT} \n${JSON.stringify(chapter)}` }]
                                    }
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

                            const text = response?.candidates?.[0]?.content?.parts?.[0]?.text;
                            if (text) return text;

                        } catch (error) {
                            console.warn(`Model ${model} failed for chapter ${chapter.chapterName}:`, error.message);
                            if (error.status === 429) {
                                // If rate limited, wait a bit before trying next model
                                await new Promise(resolve => setTimeout(resolve, 5000));
                            }
                        }
                    }

                    if (retries > 0) {
                        console.warn(`Retrying chapter "${chapter.chapterName}" in 10 seconds...`);
                        await new Promise(resolve => setTimeout(resolve, 10000));
                        return generateWithRetry(retries - 1);
                    }

                    throw new Error("All models failed to generate content.");
                };

                const rawText = await generateWithRetry();

                // Clean up triple backticks or markdown if any
                const cleanText = rawText.replace(/^```.*\n?/, "").replace(/```$/, "").trim();

                // Parse AI JSON response
                let jsonResp;
                try {
                    jsonResp = JSON.parse(cleanText);
                } catch (e) {
                    console.error("Failed to parse JSON from AI:", cleanText);
                    // Fallback content for this chapter
                    jsonResp = {
                        chapterName: chapter.chapterName,
                        topics: chapter.topics.map(t => ({
                            topic: t,
                            content: "Content generation failed. Please try again later."
                        }))
                    };
                }

                // If topic.content is a stringified JSON, parse it
                if (Array.isArray(jsonResp.topics)) {
                    for (let topic of jsonResp.topics) {
                        if (typeof topic.content === "string") {
                            try {
                                topic.content = JSON.parse(topic.content);
                            } catch {
                                // leave as string if JSON parsing fails
                            }
                        }
                    }
                }

                // Fetch YouTube videos for the exact chapterName (from AI output)
                const chapterName = jsonResp.chapterName || chapter.chapterName || chapter.title || "";
                const youtubeData = await GetYoutubeVideo(chapterName);

                // Attach YouTube videos to the chapter content
                CourseContent.push({
                    ...jsonResp,
                    youtubeVideos: youtubeData,
                });

                // Add a small delay between successful requests too
                await new Promise(resolve => setTimeout(resolve, 2000));

            } catch (error) {
                console.error(
                    "❌ Error generating content for chapter:",
                    chapter?.title || chapter?.chapterName || "unknown",
                    error
                );
                // Push error state but don't break the whole loop
                CourseContent.push({
                    error: true,
                    chapter: chapter?.title || chapter?.chapterName || "unknown",
                    message: "Failed to generate content due to error."
                });
            }
        }

        // Save full parsed CourseContent JSON to DB under courseContent column
        const dbResp = await db
            .update(coursesTable)
            .set({
                courseContent: CourseContent,
            })
            .where(eq(coursesTable.cid, courseId));

        res.status(200).json({
            courseName: courseTitle,
            CourseContent,
            dbResp,
        });
    } catch (e) {
        console.error("❌ Fatal error in generate-course-content:", e);
        res.status(500).json({ error: "Failed to process request", details: e.message });
    }
});

export default router;
