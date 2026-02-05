import express from "express";
import multer from "multer";
import fs from "fs";
import os from "os";
import fetch from "node-fetch";
import pdf from "pdf-parse/lib/pdf-parse.js";
import db from "../config/db.js";
import { userPdfsTable } from "../config/schema.js";
import { eq } from "drizzle-orm";

import OpenAI from "openai";

const router = express.Router();

// ================= CONFIG =================
const upload = multer({ dest: os.tmpdir() });

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY_CHATPDF;

if (!NVIDIA_API_KEY) {
    console.error("❌ NVIDIA_API_KEY_CHATPDF is not set");
}

const client = new OpenAI({
    baseURL: "https://integrate.api.nvidia.com/v1",
    apiKey: NVIDIA_API_KEY,
});

// ================= HELPERS =================
async function askNvidiaThink(context, question) {
    const completion = await client.chat.completions.create({
        model: "qwen/qwen3-next-80b-a3b-thinking",
        messages: [
            {
                role: "system",
                content: "You are an AI assistant. Answer strictly based on the provided PDF content. Use markdown formatting.",
            },
            {
                role: "user",
                content: `PDF Content:\n${context}\n\nQuestion:\n${question}`,
            },
        ],
        temperature: 0.6,
        top_p: 0.7,
        max_tokens: 4096,
        stream: true,
    });

    let answer = "";
    let reasoningText = "";

    for await (const chunk of completion) {
        if (!chunk.choices || chunk.choices.length === 0) continue;
        const delta = chunk.choices[0].delta;

        if (delta.reasoning_content) {
            reasoningText += delta.reasoning_content;
        }
        if (delta.content) {
            answer += delta.content;
        }
    }

    return { answer, reasoning: reasoningText };
}

// ================= ROUTES =================

// 📄 List PDFs
router.get("/list", async (req, res) => {
    try {
        const { userEmail } = req.query;

        if (!userEmail) {
            return res.status(400).json({ message: "User email is required" });
        }

        const pdfs = await db
            .select()
            .from(userPdfsTable)
            .where(eq(userPdfsTable.userEmail, userEmail));

        res.json({ pdfs });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch PDFs" });
    }
});

// 📤 Upload PDF
router.post("/upload", upload.single("pdf"), async (req, res) => {
    try {
        const { userEmail } = req.body;
        const file = req.file;

        if (!userEmail || !file) {
            if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
            return res.status(400).json({ message: "Email and PDF required" });
        }

        if (file.mimetype !== "application/pdf") {
            fs.unlinkSync(file.path);
            return res.status(400).json({ message: "Only PDF files allowed" });
        }

        // ✅ Extract PDF text
        const buffer = fs.readFileSync(file.path);
        const parsed = await pdf(buffer); // ✅ FIXED

        const inserted = await db
            .insert(userPdfsTable)
            .values({
                userEmail,
                fileName: file.originalname,
                pdfText: parsed.text,
                uploadedAt: new Date().toISOString(),
            })
            .returning();

        fs.unlinkSync(file.path);

        res.json({
            message: "PDF uploaded successfully",
            pdf: inserted[0],
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "PDF upload failed",
            error: err.message,
        });
    }
});

// 💬 Chat with PDF
router.post("/chat", async (req, res) => {
    try {
        const { pdfId, question, userEmail } = req.body;

        if (!pdfId || !question) {
            return res.status(400).json({ message: "PDF ID and question required" });
        }

        const pdfs = await db
            .select()
            .from(userPdfsTable)
            .where(eq(userPdfsTable.id, Number(pdfId)));

        if (!pdfs.length) {
            return res.status(404).json({ message: "PDF not found" });
        }

        const pdfRow = pdfs[0];

        if (userEmail && pdfRow.userEmail !== userEmail) {
            return res.status(403).json({ message: "Unauthorized access" });
        }

        const { answer, reasoning } = await askNvidiaThink(pdfRow.pdfText, question);

        res.json({ answer, reasoning });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Failed to generate answer",
            error: err.message,
        });
    }
});

// 🗑 Delete PDF
router.delete("/delete/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { userEmail } = req.body;

        const pdfs = await db
            .select()
            .from(userPdfsTable)
            .where(eq(userPdfsTable.id, Number(id)));

        if (!pdfs.length) {
            return res.status(404).json({ message: "PDF not found" });
        }

        const pdfRow = pdfs[0];

        if (userEmail && pdfRow.userEmail !== userEmail) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        await db
            .delete(userPdfsTable)
            .where(eq(userPdfsTable.id, Number(id)));

        res.json({ message: "PDF deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Delete failed" });
    }
});

export default router;
