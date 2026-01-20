import express from "express";
import fetch from "node-fetch";
import { Innertube } from "youtubei.js";
import { YoutubeTranscript } from "youtube-transcript";

const router = express.Router();

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
    const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY_SUMMARIZE}`,
        "HTTP-Referer": "https://ai-insights-web.vercel.app", // <-- Update to your actual site
        "X-Title": "AI Insights", // <-- Update to your site name
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.3-70b-instruct:free",
        messages: [
          {
            role: "system",
            content: `
You are an expert YouTube video analyst and technical content writer.

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
            `,
          },
          { role: "user", content: fullText },
        ],
      }),
    });

    // Safe JSON parse
    let result;
    try {
      result = await aiRes.json();
    } catch (e) {
      throw new Error(`AI Service returned invalid response: ${e.message}`);
    }

    if (result.error)
      throw new Error(result.error.message || "Unknown AI error");

    const summary = result.choices?.[0]?.message?.content;
    if (!summary) throw new Error("AI returned an empty summary.");

    res.json({ summary });
  } catch (e) {
    console.error("[Summarize Error]", e.message);
    res.status(500).json({ error: e.message });
  }
});

export default router;
