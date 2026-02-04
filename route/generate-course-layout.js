import express from "express";
import crypto from "crypto";

import { GoogleGenAI } from "@google/genai";
import db from "../config/db.js";
import { coursesTable } from "../config/schema.js";

const router = express.Router();

/* =====================================================
   GEMINI INIT (TEXT ONLY)
===================================================== */
const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_COURSE,
});

/* =====================================================
   COURSE PROMPT
===================================================== */
const COURSE_PROMPT = `
Generate Learning Course based on user input.

Include:
- Course Name
- Description
- Category
- Level
- Duration
- Include Video (boolean)
- Number of Chapters
- Course Banner Image Prompt
- Chapters with topics

Return ONLY valid JSON.

Schema:
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
}
`;

/* =====================================================
   HELPERS
===================================================== */
function extractJSON(text) {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1) {
        throw new Error("Invalid JSON from AI");
    }
    return text.slice(start, end + 1);
}

/* =====================================================
   GENERATE BANNER VIA POLLINATIONS
===================================================== */
async function fetchCourseBanner(course) {
    const prompt = course.bannerImagePrompt ||
        `${course.name} ${course.category} ${course.level} course cover`;

    // Generate image using Pollinations API (with nologo)
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?nologo=true`;

    return url;
}

/* =====================================================
   ROUTE
===================================================== */
router.post("/generate", async (req, res) => {
    try {
        let { courseId, ...formData } = req.body;

        const email = req.user?.email || formData.email;
        if (!email) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        if (!courseId) courseId = crypto.randomUUID();

        /* ---------- GENERATE COURSE JSON ---------- */
        const textResponse = await ai.models.generateContent({
            model: "gemini-flash-latest",
            contents: `${COURSE_PROMPT}\nUser Input:\n${JSON.stringify(formData)}`,
        });

        const rawText =
            textResponse.candidates?.[0]?.content?.parts?.[0]?.text || "";

        let courseJSON = extractJSON(rawText);
        // Fix bad escapes to prevent JSON.parse errors
        courseJSON = courseJSON.replace(/\\(?!["\\/bfnrtu]|u[0-9a-fA-F]{4})/g, "\\\\");
        const parsed = JSON.parse(courseJSON);
        const course = parsed.course;

        /* ---------- FETCH BANNER IMAGE ---------- */
        let bannerImageURL = null;
        try {
            bannerImageURL = await fetchCourseBanner(course);
        } catch (err) {
            console.warn("⚠️ Banner fetch failed:", err.message);
        }

        /* ---------- SAVE TO DB ---------- */
        await db.insert(coursesTable).values({
            cid: courseId,
            userEmail: email,
            name: course.name,
            description: course.description,
            category: course.category,
            level: course.level,
            includeVideo: course.includeVideo,
            noOfChapters: course.noOfChapters,
            courseJson: courseJSON,
            bannerImageURL: bannerImageURL,
        });

        return res.status(200).json({
            success: true,
            courseId,
        });
    } catch (error) {
        console.error("❌ Generate Course Error:", error);
        return res.status(500).json({
            error: error.message || "Internal Server Error",
        });
    }
});

export default router;