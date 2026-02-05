import express from "express";
import crypto from "crypto";
import OpenAI from "openai";
import fetch from "node-fetch";
import db from "../config/db.js";
import { coursesTable } from "../config/schema.js";

const router = express.Router();

/* =====================================================
   NVIDIA NIM INIT (Layout Generation)
===================================================== */
const client = new OpenAI({
    baseURL: "https://integrate.api.nvidia.com/v1",
    apiKey: process.env.NVIDIA_API_KEY_LAYOUT, // Using LLAMA key for layout
});

/* =====================================================
   COURSE PROMPT
===================================================== */
const COURSE_PROMPT = `
Generate a professional Learning Course based on user input.

Include:
- Course Name: A catchy and relevant title.
- Description: A comprehensive and detailed summary (2-4 sentences) that covers the target audience, key learning outcomes, and unique value proposition.
- Category: The technical field it belongs to.
- Level: Beginner, Intermediate, or Advanced.
- Duration: Approximate total time to complete.
- Include Video: true/false.
- Number of Chapters: As requested.
- Course Banner Image Prompt: A high-quality, detailed AI image generation prompt (vibrant colors, modern design) representing the course theme.
- Chapters: A list of chapters, each with a name, duration, and 5-8 specific, detailed topics/sub-topics.

Return ONLY valid JSON.

### GOOD EXAMPLE FOR WOW FACTOR:
{
  "course": {
    "name": "Mastering Django: From Setup to Superuser and Dynamic Dashboards",
    "description": "A comprehensive, intermediate-level course designed to take developers from the foundational setup of a Django project through database integration (models and migrations), creating robust user interfaces (forms), and implementing secure administrative controls, culminating in the creation of a welcoming, dynamic dashboard.",
    "category": "Backend Development",
    "level": "Intermediate",
    "duration": "3 hours 50 minutes",
    "includeVideo": true,
    "noOfChapters": 6,
    "bannerImagePrompt": "Vibrant digital illustration of the Django logo (D-shaped framework icon) overlaid on abstract Python code, showing database connection lines and a minimalist web dashboard UI on a dark monitor screen.",
    "chapters": [
      {
        "chapterName": "Chapter 1: Setting up the Django Environment",
        "duration": "40 minutes",
        "topics": [
          "Prerequisites and Python installation review",
          "Setting up a virtual environment (venv)",
          "Installing Django and basic project structure",
          "Understanding settings.py and configuration",
          "Creating the first application (startapp)",
          "Configuring basic URLs and project routing"
        ]
      }
    ]
  }
}

Schema:
{
  "course": {
    "name": "string",
    "description": "string",
    "category": "string",
    "level": "string",
    "duration": "string",
    "includeVideo": boolean,
    "noOfChapters": number,
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
   GENERATE BANNER VIA NVIDIA (Flux.1-Schnell)
===================================================== */
async function fetchCourseBanner(course) {
    const prompt = course.bannerImagePrompt ||
        `${course.name} ${course.category} ${course.level} course cover`;

    const invokeUrl = "https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-schnell";

    const headers = {
        "Authorization": `Bearer ${process.env.NVIDIA_API_KEY_IMAGE}`,
        "Accept": "application/json",
        "Content-Type": "application/json"
    };

    const payload = {
        "prompt": prompt,
        "width": 1024,
        "height": 1024,
        "seed": 0,
        "steps": 4
    };

    console.log("Fetching banner for course:", course.name);

    const response = await fetch(invokeUrl, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: headers
    });

    if (!response.ok) {
        const errBody = await response.text();
        console.error("Nvidia Banner Error Body:", errBody);
        throw new Error(`Nvidia Image API failed (${response.status})`);
    }

    const contentType = response.headers.get("content-type") || "";

    // If API returns physical image binary
    if (contentType.includes("image/")) {
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        return `data:${contentType};base64,${buffer.toString("base64")}`;
    }

    // If API returns JSON
    const responseBody = await response.json();
    const imageBase64 = responseBody.artifacts?.[0]?.base64 || responseBody.image || responseBody.b64_json;

    if (!imageBase64) {
        throw new Error("No image data found in Nvidia response");
    }

    // Handle case where it might already be a data URL or just raw base64
    if (imageBase64.startsWith("data:")) return imageBase64;
    return `data:image/png;base64,${imageBase64}`;
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
        const completion = await client.chat.completions.create({
            model: "meta/llama-4-maverick-17b-128e-instruct",
            messages: [
                {
                    role: "user",
                    content: `${COURSE_PROMPT}\nUser Input:\n${JSON.stringify(formData)}`,
                },
            ],
            temperature: 0.4, // Balanced for stability and creativity
            top_p: 1.0,
            max_tokens: 4096,
        });

        const rawText = completion.choices?.[0]?.message?.content || "";

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