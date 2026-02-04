import express from "express";
import axios from "axios";
import { GoogleGenAI } from "@google/genai";
import db from "../config/db.js";
import { coursesTable } from "../config/schema.js";
import { eq } from "drizzle-orm";

const router = express.Router();

/* =====================================================
   GEMINI INIT
===================================================== */
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_COURSE,
});

/* =====================================================
   CONSTANTS
===================================================== */
const YOUTUBE_BASE_URL = "https://www.googleapis.com/youtube/v3/search";

/* =====================================================
   UTILS
===================================================== */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const extractJSON = (text) => {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("Invalid JSON from Gemini");
  }
  return text.slice(start, end + 1);
};

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
    return [];
  }
};

/* =====================================================
   GEMINI CALL
===================================================== */
const callGemini = async (prompt) => {
  const response = await ai.models.generateContent({
    model: "gemini-flash-latest",
    contents: prompt,
  });

  const text =
    response.candidates?.[0]?.content?.parts?.[0]?.text || "";

  if (!text) {
    throw new Error("Empty response from Gemini");
  }

  const extracted = extractJSON(text);
  // Fix bad escapes (e.g. \s -> \\s) to prevent JSON.parse errors
  return extracted.replace(/\\(?!["\\/bfnrtu]|u[0-9a-fA-F]{4})/g, "\\\\");
};

/* =====================================================
   POST: GENERATE COURSE CONTENT
===================================================== */
router.post("/", async (req, res) => {
  const PROMPT = `You are an AI that generates strictly valid JSON educational content.

RULES:
- Output ONLY valid JSON.
- The "content" field MUST be formatted using Markdown (headings, lists, code, etc.).
- Use actual newline characters inside the "content" string for Markdown formatting.
- No explanations or extra text outside the JSON.
- Generate content for EVERY topic listed in the provided chapter data. Do not skip any topics.

FORMAT:
{
  "chapterName": "Chapter Name",
  "topics": [
    {
      "topic": "Topic Name",
      "content": "You are an expert educator, mentor, and subject-matter specialist.

Your task is to explain topics in a clear, deep, and practical way, exactly like an experienced teacher explaining to a student who wants true understanding, not shortcuts.

Response Rules (MANDATORY)

1. Use Markdown formatting strictly
   - Headingshere
   - Bullet points
   - Tables where helpful
   - Math equations (LaTeX when needed)
   - Code blocks with language labels

2. Always begin with a clear definition
   - Explain the concept in simple language
   - Then explain it again in technical/professional terms

3. Explain step-by-step
   - Break complex ideas into smaller parts
   - Use analogies and real-world comparisons
   - Assume the student is intelligent but new to the topic

4. Provide realistic examples
   - Real-world examples
   - Industry-level scenarios
   - Avoid shallow or generic explanations

5. Code-related topics
   - Show clean, production-style code
   - Use proper code blocks (language)
   - Explain every important line
   - Include common mistakes and best practices

6. Math-related topics
   - Show formulas clearly
   - Solve step-by-step
   - Include at least one solved example problem
   - Explain why each step is done

7. Medical-related topics
   - Use proper medical terminology
   - Include:
     - Definition
     - Causes
     - Symptoms
     - Diagnosis
     - Treatment
     - Example clinical case
   - Keep explanations educational (not giving personal medical advice)

8. Accounting / Finance topics
   - Use structured formats:
     - Definitions
     - Journal entries
     - Tables
     - Numerical examples
   - Explain logic behind calculations

9. End every answer with
   - A short summary
   - Key takeaways (bullet points)
   - Optional next topics to study

Tone & Style
- Friendly, patient, and confident
- Like a senior teacher or professor
- No emojis
- No unnecessary fluff
- Clear, logical, and meaningful explanations

Output Goal
The answer should feel like:
- A high-quality textbook explanation
- Combined with real classroom teaching
- Plus industry-ready knowledge"
    }
  ]
}

Chapter data:
`;

  try {
    let {
      courseJson,
      courseTitle,
      courseId,
      includeVideo: includeVideoFromReq,
      chapterIndex,
    } = req.body;

    if (!courseId || !courseJson || !courseTitle) {
      return res.status(400).json({
        error: "Missing courseId, courseJson, or courseTitle",
      });
    }

    // Parse & unwrap course JSON
    if (typeof courseJson === "string") {
      courseJson = JSON.parse(courseJson);
    }
    if (courseJson.course) {
      courseJson = courseJson.course;
    }

    if (!Array.isArray(courseJson.chapters)) {
      return res.status(400).json({ error: "Invalid chapters array" });
    }

    // Resolve includeVideo
    let includeVideo = includeVideoFromReq;
    if (includeVideo === undefined) {
      const dbCourse = await db
        .select()
        .from(coursesTable)
        .where(eq(coursesTable.cid, courseId))
        .limit(1);

      includeVideo = dbCourse[0]?.includeVideo ?? false;
    }

    let CourseContent = [];

    /* ================= SINGLE CHAPTER ================= */
    if (chapterIndex !== undefined && chapterIndex !== null) {
      const existing = await db
        .select()
        .from(coursesTable)
        .where(eq(coursesTable.cid, courseId))
        .limit(1);

      CourseContent = existing[0]?.courseContent || [];
      const chapter = courseJson.chapters[chapterIndex];

      const jsonText = await callGemini(
        PROMPT + JSON.stringify(chapter)
      );

      const jsonResp = JSON.parse(jsonText);

      for (const topic of jsonResp.topics || []) {
        topic.youtubeVideos = includeVideo
          ? await GetYoutubeVideo(topic.topic)
          : [];
      }

      CourseContent[chapterIndex] = jsonResp;
    }

    /* ================= ALL CHAPTERS ================= */
    else {
      for (const chapter of courseJson.chapters) {
        try {
          const jsonText = await callGemini(
            PROMPT + JSON.stringify(chapter)
          );

          const jsonResp = JSON.parse(jsonText);

          for (const topic of jsonResp.topics || []) {
            topic.youtubeVideos = includeVideo
              ? await GetYoutubeVideo(topic.topic)
              : [];
          }

          CourseContent.push(jsonResp);
          await sleep(2000);
        } catch (err) {
          CourseContent.push({
            error: true,
            chapter: chapter.chapterName,
            message: err.message,
          });
        }
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
    res.status(500).json({
      error: "Failed to fetch course content",
      details: err.message,
    });
  }
});

export default router;
