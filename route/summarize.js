import express from "express";
import fetch from "node-fetch";
import { Innertube } from 'youtubei.js';
import { YoutubeTranscript } from "youtube-transcript";

const router = express.Router();

router.post("/summarize", async (req, res) => {
    const { videoUrl } = req.body;

    if (!videoUrl) {
        return res.status(400).json({ error: "Video URL required" });
    }

    // 1. Extract Video ID
    const getYouTubeID = (url) => {
        const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const match = url.match(regex);
        return match ? match[1] : null;
    };

    const videoId = getYouTubeID(videoUrl);
    if (!videoId) {
        return res.status(400).json({ error: "Invalid YouTube URL" });
    }

    let title = "";
    let description = "";
    let keywords = "";
    let transcriptText = "";

    try {
        console.log(`[Summarize] Analyzing video ID: ${videoId}`);

        // --- PHASE 1: Metadata Extraction ---

        // 1.1 oEmbed (High reliability for Title)
        try {
            const oRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
            });
            if (oRes.ok) {
                const oData = await oRes.json();
                title = oData.title || "";
                console.log("[Summarize] oEmbed title success");
            }
        } catch (e) {
            console.warn("[Summarize] oEmbed failed:", e.message);
        }

        // 1.2 Innertube (Metadata & Transcript)
        try {
            const youtube = await Innertube.create();
            // ANDROID_TESTSUITE is often less throttled in cloud environments
            const info = await youtube.getInfo(videoId, 'ANDROID_TESTSUITE');

            title = title || info.basic_info.title || "";
            description = info.basic_info.short_description || info.basic_info.description || "";
            keywords = info.basic_info.keywords?.join(", ") || "";

            try {
                const transcriptData = await info.getTranscript();
                transcriptText = transcriptData.transcript.content.body.initial_segments
                    .map((s) => s.snippet.text)
                    .join(" ");
                console.log("[Summarize] Innertube transcript success");
            } catch (te) {
                console.warn("[Summarize] Innertube transcript failed");
            }
        } catch (ie) {
            console.warn("[Summarize] Innertube info failed:", ie.message);
        }

        // --- PHASE 2: Transcript Fallbacks ---

        // 2.1 TimedText API
        if (!transcriptText) {
            try {
                const ttRes = await fetch(`https://video.google.com/timedtext?v=${videoId}&lang=en`);
                if (ttRes.ok) {
                    const ttData = await ttRes.text();
                    const matches = ttData.match(/text="([^"]*)"/g);
                    if (matches) {
                        transcriptText = matches.map(m => m.replace(/text="|"$/g, '')).join(" ");
                        console.log("[Summarize] TimedText API success");
                    }
                }
            } catch (te) {
                console.warn("[Summarize] TimedText API failed");
            }
        }

        // 2.2 youtube-transcript package
        if (!transcriptText) {
            try {
                const manualTranscript = await YoutubeTranscript.fetchTranscript(videoId);
                transcriptText = manualTranscript.map(t => t.text).join(" ");
                console.log("[Summarize] youtube-transcript package success");
            } catch (te) {
                console.warn("[Summarize] youtube-transcript package failed");
            }
        }

        // --- PHASE 3: AI Summarization ---

        // Prepare context
        const fullText = `
VIDEO TITLE: ${title}
KEYWORDS: ${keywords}
VIDEO DESCRIPTION: ${description}
TRANSCRIPT: ${transcriptText || "No transcript available"}
        `.trim().slice(0, 15000);

        // Validation: Need at least a title or transcript to be useful
        if (!title && !transcriptText) {
            throw new Error("YouTube is currently blocking access to this video's metadata on this server. Please try again with a different link.");
        }

        console.log("[Summarize] Sending to AI...");
        const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY_SUMMARIZE}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "allenai/olmo-3.1-32b-think:free",
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
                        `
                    },

                    { role: "user", content: fullText }
                ],
            }),
        });

        const result = await aiRes.json();

        if (result.error) {
            throw new Error(`AI Service Error: ${result.error.message || "Unknown error"}`);
        }

        const summary = result.choices?.[0]?.message?.content;
        if (!summary) throw new Error("AI returned an empty summary.");

        res.json({ summary });

    } catch (err) {
        console.error("[Summarize Error]", err.message);
        res.status(500).json({ error: err.message });
    }
});

export default router;