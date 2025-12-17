import express from "express";
import axios from "axios";
import db from "../config/db.js";
import { coursesTable } from "../config/schema.js";
import { eq } from "drizzle-orm";

const router = express.Router();

/* =====================================================
   CONSTANTS
===================================================== */
const YOUTUBE_BASE_URL = "https://www.googleapis.com/youtube/v3/search";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

/* =====================================================
   UTILS
===================================================== */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* =====================================================
   YOUTUBE FETCH
===================================================== */
const GetYoutubeVideo = async (query) => {
    if (!query) return [];
    try {
        const params = {
            part: "snippet",
            q: query,
            key: process.env.YOUTUBE_API_KEY,
            type: "video",
            maxResults: 5,
        };

        const resp = await axios.get(YOUTUBE_BASE_URL, { params });

        return resp.data.items.map((item) => ({
            videoId: item.id?.videoId,
            title: item.snippet?.title,
        }));
    } catch (error) {
        console.error("YouTube API error:", error.message);
        return []
    }
};
/* =====================================================
   OPENROUTER XIAOMI MIMO-V2 (RATE-LIMIT SAFE)
===================================================== */
const callOpenRouter = async (prompt, retries = 3) => {
    try {
        const response = await axios.post(
            OPENROUTER_URL,
            {
                model: "xiaomi/mimo-v2-flash:free",
                messages: [{ role: "user", content: prompt }],
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY_CONTENT}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": process.env.SITE_URL || "http://localhost:3000",
                    "X-Title": "AI Insight Course Generator",
                },
                timeout: 20000,
            }
        );

        return response.data.choices[0].message.content;
    } catch (err) {
        if (err.response?.status === 429 && retries > 0) {
            console.warn("⚠️ OpenRouter rate limit hit. Retrying in 3s...");
            await sleep(3000);
            return callOpenRouter(prompt, retries - 1);
        }
        throw err;
    }
};

/* =====================================================
   POST: GENERATE COURSE CONTENT
===================================================== */
router.post("/", async (req, res) => {
    const PROMPT = `You are an AI that generates strictly valid JSON educational content.

RULES:
- Output ONLY valid JSON
- No markdown in JSON
- No explanations

FORMAT:
{
  "chapterName": "Chapter Name",
  "topics": [
    {
      "topic": "Topic Name",
      "content": "Detailed explanation with code examples in Markdown format"
    }
  ]
}

Chapter data:
`;

    try {
        const { courseJson, courseTitle, courseId } = req.body;

        if (!courseId || !courseJson || !courseTitle) {
            return res.status(400).json({
                error: "Missing courseId, courseJson, or courseTitle",
            });
        }

        const CourseContent = [];

        // 🚫 NO Promise.all — sequential generation only
        for (const chapter of courseJson.chapters) {
            try {
                let rawText = await callOpenRouter(
                    PROMPT + JSON.stringify(chapter)
                );

                rawText = rawText
                    .trim()
                    .replace(/^```.*\n?/, "")
                    .replace(/```$/, "");

                const jsonResp = JSON.parse(rawText);

                if (Array.isArray(jsonResp.topics)) {
                    for (const topic of jsonResp.topics) {
                        const videos = await GetYoutubeVideo(topic.topic || "");
                        topic.youtubeVideos = videos;
                    }
                }

                CourseContent.push(jsonResp);

                // ⏳ REQUIRED delay for free tier
                await sleep(2000);

            } catch (err) {
                console.error("Chapter error:", err.message);
                CourseContent.push({
                    error: true,
                    chapter: chapter.chapterName || "unknown",
                    message: "Failed to generate content",
                });
            }
        }

        await db
            .update(coursesTable)
            .set({ courseContent: CourseContent })
            .where(eq(coursesTable.cid, courseId));

        res.json({
            courseName: courseTitle,
            CourseContent,
        });

    } catch (err) {
        console.error("Fatal error:", err);
        res.status(500).json({
            error: "Failed to generate course content",
            details: err.message,
        });
    }
});

/* =====================================================
   GET: FETCH COURSE CONTENT
===================================================== */
router.get("/", async (req, res) => {
    try {
        const { courseId } = req.query;

        if (!courseId) {
            return res.status(400).json({ error: "Missing courseId" });
        }

        const courseData = await db
            .select()
            .from(coursesTable)
            .where(eq(coursesTable.cid, courseId))
            .limit(1);

        if (!courseData.length) {
            return res.status(404).json({ error: "Course not found" });
        }

        res.json({
            courseName: courseData[0].courseName,
            CourseContent: courseData[0].courseContent,
        });
    } catch (err) {
        console.error("GET error:", err);
        res.status(500).json({
            error: "Failed to fetch course content",
            details: err.message,
        });
    }
});

export default router;
