import express from "express";
import { OpenRouter } from "@openrouter/sdk";
import axios from "axios";
import db from "../config/db.js";
import { coursesTable } from "../config/schema.js";
import { eq } from "drizzle-orm";

const router = express.Router();

/* =====================================================
   CONSTANTS
===================================================== */
const YOUTUBE_BASE_URL = "https://www.googleapis.com/youtube/v3/search";

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
    return [];
  }
};

/* =====================================================
   OPENROUTER STREAMING MODEL
===================================================== */
const openrouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY_CONTENT,
});

const callOpenRouterStreaming = async (prompt, previousMessages = []) => {
  const messages = [
    ...previousMessages,
    { role: "user", content: prompt },
  ];

  let fullResponse = "";

  try {
    const stream = await openrouter.chat.send({
      model: "tngtech/deepseek-r1t2-chimera:free",
      messages,
      stream: true,
      streamOptions: {
        includeUsage: true,
      },
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        fullResponse += content;
      }

      // Optional: log reasoning tokens when final chunk arrives
      if (chunk.usage) {
        console.log("Reasoning tokens:", chunk.usage.reasoningTokens);
      }
    }

    return {
      content: fullResponse,
      messages,
    };
  } catch (err) {
    console.error("OpenRouter streaming error:", err.message);
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
    let { courseJson, courseTitle, courseId, includeVideo: includeVideoFromReq, chapterIndex } = req.body;

    if (!courseId || !courseJson || !courseTitle) {
      return res.status(400).json({
        error: "Missing courseId, courseJson, or courseTitle",
      });
    }

    // Defensive: Parse courseJson if it's a string, and handle "course" wrapper
    try {
      if (typeof courseJson === "string") {
        courseJson = JSON.parse(courseJson);
      }
      // If it's wrapped in { course: { ... } }, unwrap it
      if (courseJson.course && !courseJson.chapters) {
        courseJson = courseJson.course;
      }
    } catch (e) {
      return res.status(400).json({ error: "Invalid courseJson format" });
    }

    if (!courseJson.chapters || !Array.isArray(courseJson.chapters)) {
      return res.status(400).json({ error: "courseJson is missing chapters array" });
    }

    // Determine if we should include videos (check req or DB)
    let includeVideo = includeVideoFromReq;
    if (includeVideo === undefined) {
      try {
        const courseData = await db.select().from(coursesTable).where(eq(coursesTable.cid, courseId)).limit(1);
        includeVideo = courseData[0]?.includeVideo ?? false;
      } catch (err) {
        includeVideo = false;
      }
    }

    let CourseContent = [];

    // If chapterIndex is provided, we are regenerating/generating ONLY that chapter
    if (chapterIndex !== undefined && chapterIndex !== null) {
      const existing = await db.select().from(coursesTable).where(eq(coursesTable.cid, courseId)).limit(1);
      if (existing.length > 0 && Array.isArray(existing[0].courseContent)) {
        CourseContent = [...existing[0].courseContent];
      } else {
        // Initialize if empty
        CourseContent = new Array(courseJson.chapters.length).fill({ error: true, message: "Not generated yet" });
      }

      const chapter = courseJson.chapters[chapterIndex];
      try {
        const { content: rawAiResponse } = await callOpenRouterStreaming(
          PROMPT + JSON.stringify(chapter)
        );

        let cleaned = rawAiResponse.trim();
        cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
        const firstBrace = cleaned.indexOf("{");
        const lastBrace = cleaned.lastIndexOf("}");
        if (firstBrace !== -1 && lastBrace !== -1) {
          cleaned = cleaned.slice(firstBrace, lastBrace + 1);
        }

        const jsonResp = JSON.parse(cleaned);

        if (Array.isArray(jsonResp.topics)) {
          for (const topic of jsonResp.topics) {
            if (includeVideo) {
              const videos = await GetYoutubeVideo(topic.topic || "");
              topic.youtubeVideos = videos;
            } else {
              topic.youtubeVideos = [];
            }
          }
        }

        CourseContent[chapterIndex] = jsonResp;
      } catch (err) {
        console.error("Single Chapter error:", err.message);
        CourseContent[chapterIndex] = {
          error: true,
          chapter: chapter.chapterName || "unknown",
          message: "Failed to generate content: " + err.message,
        };
      }
    } else {
      // Original behavior: Generate ALL chapters
      for (const chapter of courseJson.chapters) {
        try {
          const { content: rawAiResponse } = await callOpenRouterStreaming(
            PROMPT + JSON.stringify(chapter)
          );

          let cleaned = rawAiResponse.trim();
          cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
          const firstBrace = cleaned.indexOf("{");
          const lastBrace = cleaned.lastIndexOf("}");
          if (firstBrace !== -1 && lastBrace !== -1) {
            cleaned = cleaned.slice(firstBrace, lastBrace + 1);
          }

          const jsonResp = JSON.parse(cleaned);

          if (Array.isArray(jsonResp.topics)) {
            for (const topic of jsonResp.topics) {
              if (includeVideo) {
                const videos = await GetYoutubeVideo(topic.topic || "");
                topic.youtubeVideos = videos;
              } else {
                topic.youtubeVideos = [];
              }
            }
          }

          CourseContent.push(jsonResp);
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
