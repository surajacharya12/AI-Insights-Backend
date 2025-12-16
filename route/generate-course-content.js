import express from "express";
import axios from "axios";
import { GoogleGenAI } from "@google/genai";
import db from "../config/db.js";
import { coursesTable } from "../config/schema.js";
import { eq } from "drizzle-orm";

const router = express.Router();
const YOUTUBE_BASE_URL = "https://www.googleapis.com/youtube/v3/search";

/* =====================================================
   GEMINI INIT
===================================================== */
const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_COURSE_CONTENT,
});

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

/* =====================================================
   POST: GENERATE COURSE CONTENT
===================================================== */
router.post("/", async (req, res) => {
    const PROMPT = `You are an AI that generates strictly valid JSON educational content.

Given a chapter name and its topics, generate json-formatted content.

RULES:
- Output ONLY valid JSON
- No markdown
- No explanations

FORMAT:
{
  "chapterName": "Chapter Name",
  "topics": [
    { "topic": "Topic Name", "content": "json formatted content" }
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

        const CourseContent = await Promise.all(
            courseJson.chapters.map(async (chapter) => {
                try {
                    const response = await ai.models.generateContent({
                        model: "gemini-2.0-flash",
                        contents: [
                            {
                                role: "user",
                                parts: [{ text: PROMPT + JSON.stringify(chapter) }],
                            },
                        ],
                    });

                    let rawText =
                        response?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

                    rawText = rawText.replace(/^```.*\n?/, "").replace(/```$/, "");

                    const jsonResp = JSON.parse(rawText);

                    if (Array.isArray(jsonResp.topics)) {
                        for (const topic of jsonResp.topics) {
                            if (typeof topic.content === "string") {
                                try {
                                    topic.content = JSON.parse(topic.content);
                                } catch { }
                            }
                        }
                    }

                    const chapterName =
                        jsonResp.chapterName ||
                        chapter.chapterName ||
                        chapter.title ||
                        "";

                    const youtubeVideos = await GetYoutubeVideo(chapterName);

                    return {
                        ...jsonResp,
                        youtubeVideos,
                    };
                } catch (err) {
                    console.error("Chapter error:", err);
                    return {
                        error: true,
                        chapter: chapter.chapterName || "unknown",
                        message: "Failed to generate content",
                    };
                }
            })
        );

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
