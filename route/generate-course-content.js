import express from "express";
import axios from "axios";
import OpenAI from "openai";
import db from "../config/db.js";
import { coursesTable } from "../config/schema.js";
import { eq } from "drizzle-orm";

const router = express.Router();

/* =====================================================
   OPENAI (NVIDIA) INIT
===================================================== */
const client = new OpenAI({
  baseURL: "https://integrate.api.nvidia.com/v1",
  apiKey: process.env.NVIDIA_API_KEY_CONTENT,
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
  let cleaned = text.trim();
  // Remove markdown code block markers if they wrap the JSON
  if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/^```json/, '');
  if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```/, '');
  if (cleaned.endsWith('```')) cleaned = cleaned.replace(/```$/, '');

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1) {
    throw new Error("Invalid JSON: braces not found");
  }

  return cleaned.slice(start, end + 1);
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
   OPENAI CALL
===================================================== */
const callOpenAI = async (prompt) => {
  try {
    const completion = await client.chat.completions.create({
      model: "meta/llama-3.1-405b-instruct",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.2,
      top_p: 1,
      max_tokens: 8192,
    });

    if (!completion || !completion.choices || completion.choices.length === 0) {
      console.error("OpenAI Response Structure:", JSON.stringify(completion, null, 2));
      throw new Error("Empty choices array from OpenAI");
    }

    const text = completion.choices?.[0]?.message?.content || "";

    if (!text) {
      console.error("OpenAI Response Structure (No Content):", JSON.stringify(completion, null, 2));
      throw new Error("Empty content in OpenAI response");
    }

    const extracted = extractJSON(text);

    // Robustly fix bad escapes
    return extracted.replace(/\\/g, (match, offset, str) => {
      const nextChar = str[offset + 1];
      if (!nextChar) return "\\\\";
      if (['"', '\\', '/', 'b', 'f', 'n', 'r', 't'].includes(nextChar)) return "\\";
      if (nextChar === 'u') {
        const hex = str.slice(offset + 2, offset + 6);
        if (/^[0-9a-fA-F]{4}$/.test(hex)) return "\\";
      }
      return "\\\\";
    });
  } catch (err) {
    console.error("Error in callOpenAI:", err.message);
    if (err.response) {
      console.error("API Error Response:", err.response.data);
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
- Output ONLY valid JSON.
- The "content" field MUST be formatted using Markdown (headings, lists, code, etc.).
- Use "\\n" for newline characters inside the "content" string. (CRITICAL: Do not use actual literal newlines).
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
   - Headings (###, ####) for every sub-concept
   - Bullet points for lists
   - Tables for comparisons and structured data
   - Math equations (LaTeX when needed)
   - Code blocks with language labels immediately following each sub-topic explanation

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

5. Code-related topics (MANDATORY INTERWEAVING)
   - For technical topics, you MUST NOT just put one big code block at the end.
   - For EVERY individual technique or sub-step mentioned (e.g., Handling Missing Values, Removing Duplicates, Handling Outliers), provide a detailed explanation followed immediately by a functional code block for that specific step.
   - Show clean, production-style, well-commented code.
   - Explain every important line.
   - Include common mistakes and best practices for each code block.

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
The answer should be an exhaustive, long-form masterclass (1500+ words per topic if technical). It should feel like:
- A premium, high-quality textbook chapter
- Combined with real-world professional coding and hands-on teaching
- Proactively covering all sub-steps with individual code implementations for each"
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

    if (typeof courseJson === "string") {
      courseJson = JSON.parse(courseJson);
    }

    if (courseJson.course) {
      courseJson = courseJson.course;
    }

    if (!Array.isArray(courseJson.chapters)) {
      return res.status(400).json({ error: "Invalid chapters array" });
    }

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

      const jsonText = await callOpenAI(
        PROMPT + JSON.stringify(chapter)
      );

      let jsonResp;
      try {
        jsonResp = JSON.parse(jsonText);
      } catch (parseErr) {
        console.error("JSON Parse Error:", parseErr.message);
        console.log("Raw JSON Text was:", jsonText);
        throw new Error("Failed to parse AI response into JSON");
      }

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
          const jsonText = await callOpenAI(
            PROMPT + JSON.stringify(chapter)
          );

          let jsonResp;
          try {
            jsonResp = JSON.parse(jsonText);
          } catch (parseErr) {
            console.error("JSON Parse Error (loop):", parseErr.message);
            console.log("Raw JSON Text was:", jsonText);
            throw new Error("Failed to parse AI response into JSON");
          }

          for (const topic of jsonResp.topics || []) {
            topic.youtubeVideos = includeVideo
              ? await GetYoutubeVideo(topic.topic)
              : [];
          }

          CourseContent.push(jsonResp);

          // rate-limit safety
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
