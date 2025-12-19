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

    // 1. Extract Video ID (Improved Regex)
    const getYouTubeID = (url) => {
        const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const match = url.match(regex);
        return match ? match[1] : null;
    };

    const videoId = getYouTubeID(videoUrl);
    if (!videoId) {
        return res.status(400).json({ error: "Invalid YouTube URL" });
    }

    try {
        console.log(`Analyzing video: ${videoId}`);

        let title = "";
        let description = "";
        let keywords = "";
        let transcriptText = "";

        // 1. Fetch Basic Metadata via oEmbed (High Reliability, hard to block)
        try {
            const oRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
            if (oRes.ok) {
                const oData = await oRes.json();
                title = oData.title || "";
                console.log("oEmbed title fetched:", title);
            }
        } catch (e) {
            console.warn("oEmbed fetch failed:", e.message);
        }

        // 2. Try Innertube for deep metadata and transcript
        try {
            const youtube = await Innertube.create();
            const info = await youtube.getInfo(videoId);

            title = title || info.basic_info.title || "";
            description = info.basic_info.short_description || info.basic_info.description || "";
            keywords = info.basic_info.keywords?.join(", ") || "";

            try {
                const transcriptData = await info.getTranscript();
                transcriptText = transcriptData.transcript.content.body.initial_segments
                    .map((s) => s.snippet.text)
                    .join(" ");
                console.log("Innertube transcript fetched.");
            } catch (te) {
                console.warn("Innertube transcript failed:", te.message);
            }
        } catch (ie) {
            console.error("Innertube info fetch failed:", ie.message);
        }

        // 3. Fallback: Try youtube-transcript package if still no transcript
        if (!transcriptText) {
            try {
                const manualTranscript = await YoutubeTranscript.fetchTranscript(videoId);
                transcriptText = manualTranscript.map(t => t.text).join(" ");
                console.log("youtube-transcript package fetched successfully.");
            } catch (te) {
                console.warn("youtube-transcript package failed:", te.message);
            }
        }

        // Construct the final data for AI
        const fullText = `
VIDEO TITLE: ${title}
KEYWORDS: ${keywords}
VIDEO DESCRIPTION: ${description}
TRANSCRIPT: ${transcriptText || "No transcript available"}
        `.trim().slice(0, 15000);

        // Relaxed validation: as long as we have SOME content to work with
        if (!transcriptText && (!description || description.length < 5) && (!title || title.length < 5)) {
            throw new Error("YouTube blocked metadata extraction on this server. Please try again with a different video link.");
        }

        // 3. Summarize using OpenRouter (reasoning enabled)
        const aiRes = await fetch(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY_SUMMARIZE}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: "allenai/olmo-3.1-32b-think:free",
                    reasoning: { enabled: true },
                    messages: [
                        {
                            role: "system",
                            content:
                                "You are a professional YouTube content summarizer. You will be provided with a Video Title, Keywords, Description, and sometimes a Transcript. Your goal is to provide a structured intelligence report summarizing the video's core message. \n\nOUTPUT FORMAT:\n- Use clean Markdown formatting.\n- Start with a ### Key Takeaways section.\n- Use bold text for emphasis.\n- Ensure professional bullet points.\n- If no transcript is available, base your summary on the available title and description metadata.",
                        },
                        {
                            role: "user",
                            content: fullText,
                        },
                    ],
                }),
            }
        );

        const result = await aiRes.json();

        if (result.error) {
            console.error("OpenRouter Error:", result.error);
            throw new Error(`AI Summarization failed: ${result.error.message || "Unknown error"}`);
        }

        const summary = result.choices?.[0]?.message?.content;

        if (!summary) {
            throw new Error("No summary returned from AI");
        }

        res.json({ summary });

    } catch (err) {
        console.error("Summarize Error:", err.message);
        res.status(500).json({ error: err.message || "Something went wrong" });
    }
});

export default router;
