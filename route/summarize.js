import express from "express";
import fetch from "node-fetch";
import { Innertube } from "youtubei.js";
import { YoutubeTranscript } from "youtube-transcript";
import { OpenRouter } from "@openrouter/sdk";

const router = express.Router();

const openrouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY_SUMMARIZE,
});

router.post("/summarize", async (req, res) => {
  const { videoUrl } = req.body;

  if (!videoUrl) return res.status(400).json({ error: "Video URL required" });

  // Extract YouTube Video ID
  const getYouTubeID = (url) => {
    const regex =
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const videoId = getYouTubeID(videoUrl);
  if (!videoId) return res.status(400).json({ error: "Invalid YouTube URL" });

  let title = "",
    description = "",
    keywords = "",
    transcriptText = "";

  try {
    console.log(`[Summarize] Processing video ID: ${videoId}`);

    // --- Phase 1: Metadata Extraction ---
    try {
      const oRes = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
        { headers: { "User-Agent": "Mozilla/5.0" } },
      );
      if (oRes.ok) {
        const oData = await oRes.json();
        title = oData.title || "";
        console.log("[Summarize] oEmbed title fetched");
      }
    } catch (e) {
      console.warn("[Summarize] oEmbed fetch failed:", e.message);
    }

    try {
      const youtube = await Innertube.create();
      const info = await youtube.getInfo(videoId, "ANDROID_TESTSUITE");

      title = title || info.basic_info.title || "";
      description =
        info.basic_info.short_description || info.basic_info.description || "";
      keywords = info.basic_info.keywords?.join(", ") || "";

      try {
        const transcriptData = await info.getTranscript();
        transcriptText = transcriptData.transcript.content.body.initial_segments
          .map((s) => s.snippet.text)
          .join(" ");
        console.log("[Summarize] Innertube transcript fetched");
      } catch {
        console.warn("[Summarize] Innertube transcript unavailable");
      }
    } catch (e) {
      console.warn("[Summarize] Innertube metadata fetch failed:", e.message);
    }

    // --- Phase 2: Transcript Fallback ---
    if (!transcriptText) {
      try {
        const ttRes = await fetch(
          `https://video.google.com/timedtext?v=${videoId}&lang=en`,
        );
        if (ttRes.ok) {
          const ttData = await ttRes.text();
          const matches = ttData.match(/text="([^"]*)"/g);
          if (matches)
            transcriptText = matches
              .map((m) => m.replace(/text="|"$/g, ""))
              .join(" ");
          console.log("[Summarize] TimedText transcript fetched");
        }
      } catch {}
    }

    if (!transcriptText) {
      try {
        const manualTranscript =
          await YoutubeTranscript.fetchTranscript(videoId);
        transcriptText = manualTranscript.map((t) => t.text).join(" ");
        console.log("[Summarize] youtube-transcript package fetched");
      } catch {}
    }

    // --- Phase 3: Prepare AI Input ---
    const fullText = `
VIDEO TITLE: ${title}
KEYWORDS: ${keywords}
VIDEO DESCRIPTION: ${description}
TRANSCRIPT: ${transcriptText || "No transcript available"}
    `
      .trim()
      .slice(0, 15000);

    if (!title && !transcriptText) {
      throw new Error("YouTube metadata unavailable for this video.");
    }

    console.log("[Summarize] Sending request to OpenRouter AI...");
    
    const summaryPrompt = `You are an expert YouTube video analyst and technical content writer.

Your task is to generate a **detailed, in-depth, professional summary** of the provided YouTube content.

RULES (VERY IMPORTANT):
- Be **extensive and detailed**
- Do NOT give a short summary
- Prefer **more information over brevity**
- Use **clear section headings**
- Use **bullet points, numbered lists, and tables where helpful**
- If the content is technical, include:
  - Code snippets (in proper Markdown code blocks)
  - Examples
  - Concepts explained step-by-step
- If multiple topics are discussed, separate them clearly
- Do NOT say "this video discusses" — write as a knowledge report

OUTPUT FORMAT (STRICT):
Use Markdown and follow this structure exactly:

### 📌 Video Overview
(2–4 detailed paragraphs explaining the overall topic and intent)

### 🧠 Key Concepts Explained
- Explain each major concept in depth
- Use sub-bullets where necessary

### 🧩 Detailed Breakdown
- Step-by-step explanation of important sections
- Expand ideas instead of summarizing briefly

### 📊 Tables / Structured Data (if applicable)
- Use tables when comparisons, lists, or structured facts exist

### 💻 Code Examples (if applicable)
- Include code blocks with proper language formatting
- Explain what the code does

### 🎯 Practical Takeaways
- Actionable insights
- Real-world applications
- Best practices or warnings

If NO transcript is available:
- Infer intelligently from title, description, and keywords
- Still produce a **long, educational report**

Never refuse. Never shorten. Never summarize aggressively.

Now analyze this content:

${fullText}`;

    let summary = "";
    try {
      const stream = await openrouter.chat.send({
        model: "allenai/molmo-2-8b:free",
        messages: [
          {
            role: "user",
            content: summaryPrompt,
          },
        ],
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          summary += content;
        }
      }

      if (!summary) {
        throw new Error("AI returned an empty summary.");
      }

      res.json({ summary });
    } catch (error) {
      console.error("[Summarize Error] OpenRouter Error:", error.message);
      
      let userMessage = error.message;
      if (error.status === 402) {
        userMessage = "API spending limit exceeded. Please check your OpenRouter account.";
      } else if (error.status === 429) {
        userMessage = "Rate limit exceeded. Please try again later.";
      } else if (error.status === 401) {
        userMessage = "API authentication failed. Check your API key.";
      }
      
      const statusCode = error.status || 500;
      res.status(statusCode).json({ 
        error: userMessage,
        hint: statusCode === 504 ? "Request timed out. Try again later." : "Failed to summarize video"
      });
    }
  } catch (error) {
    console.error("[Summarize] Unexpected error:", error.message);
    res.status(500).json({ error: "An unexpected error occurred while processing the video." });
  }
});

export default router;
