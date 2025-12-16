import express from "express";
import multer from "multer";
import fs from "fs";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import db from "../config/db.js";
import { userPdfsTable } from "../config/schema.js";
import { eq } from "drizzle-orm";

const router = express.Router();

const apiKey = process.env.GEMINI_API_KEY_CHATPDF;

if (!apiKey) {
    console.error("WARNING: GEMINI_API_KEY_CHATPDF is not set!");
}

const genAI = new GoogleGenerativeAI(apiKey);
const fileManager = new GoogleAIFileManager(apiKey);

// Configure multer to handle file uploads
const upload = multer({ dest: "uploads/" });

// Safety settings to prevent content blocking
const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

const generationConfig = {
    temperature: 0.7,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
};

const MODELS = ["gemini-flash-latest"];

function getModel(modelName = "gemini-flash-latest") {
    return genAI.getGenerativeModel({
        model: modelName,
        safetySettings,
    });
}

async function generateWithRetry(prompt, fileData) {
    let lastError = null;
    for (const modelName of MODELS) {
        try {
            console.log(`Trying model: ${modelName}`);
            const model = getModel(modelName);

            let result;
            let attempt = 0;
            const maxRetries = 5;

            while (attempt < maxRetries) {
                try {
                    result = await model.generateContent([
                        { fileData },
                        { text: prompt },
                    ]);
                    break;
                } catch (e) {
                    // Handle specific file access errors (403/404 for files)
                    if (e.message.includes('403') && (e.message.includes('File') || e.message.includes('permission'))) {
                        throw new Error("FILE_EXPIRED_OR_MISSING");
                    }

                    if (e.message.includes('429') || e.status === 429) {
                        attempt++;
                        if (attempt >= maxRetries) throw e;

                        let delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
                        const match = e.message.match(/retry in (\d+(\.\d+)?)s/);
                        if (match && match[1]) {
                            delay = Math.ceil(parseFloat(match[1])) * 1000 + 1000;
                        }

                        console.log(`Model ${modelName} hit 429, retrying in ${Math.round(delay)}ms...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                    } else {
                        throw e;
                    }
                }
            }

            const response = result.response;
            const text = response.text();
            if (text) return text;
        } catch (error) {
            console.error(`Error with ${modelName}:`, error.message);
            if (error.message === "FILE_EXPIRED_OR_MISSING") {
                throw error;
            }
            lastError = error;
        }
    }
    throw lastError || new Error("All models failed to generate content");
}

// Get user's uploaded PDFs
router.get("/list", async (req, res) => {
    try {
        const { userEmail } = req.query;

        if (!userEmail) {
            return res.status(400).json({ message: "User email is required." });
        }

        const pdfs = await db
            .select()
            .from(userPdfsTable)
            .where(eq(userPdfsTable.userEmail, userEmail));

        res.status(200).json({ pdfs });
    } catch (error) {
        console.error("Error fetching PDFs:", error);
        res.status(500).json({ message: "Error fetching PDFs" });
    }
});

// Upload PDF (no immediate summary - just store it)
router.post("/upload", upload.single("pdf"), async (req, res) => {
    console.log("Received PDF upload request");

    try {
        const file = req.file;
        const { userEmail } = req.body;

        if (!userEmail) {
            if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
            return res.status(400).json({ message: "User email is required." });
        }

        if (!file) {
            return res.status(400).json({ message: "No file uploaded." });
        }

        console.log(`File received: ${file.originalname}, size: ${file.size} bytes`);

        if (file.mimetype !== "application/pdf") {
            fs.unlinkSync(file.path);
            return res.status(400).json({ message: "Only PDF files are allowed." });
        }

        try {
            // Upload the PDF to Gemini File API
            console.log("Uploading file to Gemini...");
            const uploadResult = await fileManager.uploadFile(file.path, {
                mimeType: "application/pdf",
                displayName: file.originalname,
            });

            console.log(`File uploaded: ${uploadResult.file.uri}`);

            // Wait for file processing
            let geminiFile = uploadResult.file;
            while (geminiFile.state === "PROCESSING") {
                console.log("Waiting for file processing...");
                await new Promise(resolve => setTimeout(resolve, 2000));
                geminiFile = await fileManager.getFile(geminiFile.name);
            }

            if (geminiFile.state === "FAILED") {
                throw new Error("File processing failed");
            }

            // Store in database
            const newPdf = await db.insert(userPdfsTable).values({
                userEmail,
                fileName: file.originalname,
                geminiFileName: geminiFile.name,
                geminiFileUri: geminiFile.uri,
                geminiMimeType: geminiFile.mimeType,
                uploadedAt: new Date().toISOString(),
            }).returning();

            // Clean up local file
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }

            res.status(200).json({
                message: "PDF uploaded successfully! You can now ask questions about it.",
                pdf: newPdf[0],
            });
        } catch (error) {
            console.error("Error processing PDF:", error);
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
            res.status(500).json({
                message: "Error processing PDF",
                error: error.message
            });
        }
    } catch (error) {
        console.error("Error in /upload route:", error);
        res.status(500).json({ message: "Error with request" });
    }
});

// Chat with a specific PDF
router.post("/chat", async (req, res) => {
    console.log("Received chat request");

    try {
        const { pdfId, question, userEmail } = req.body;

        if (!pdfId) {
            return res.status(400).json({ message: "PDF ID is required." });
        }

        if (!question || !question.trim()) {
            return res.status(400).json({ message: "Question is required." });
        }

        // Get PDF from database
        const pdfs = await db
            .select()
            .from(userPdfsTable)
            .where(eq(userPdfsTable.id, pdfId));

        if (pdfs.length === 0) {
            return res.status(404).json({
                message: "PDF not found. Please upload a PDF first."
            });
        }

        const pdf = pdfs[0];

        // Verify ownership if userEmail provided
        if (userEmail && pdf.userEmail !== userEmail) {
            return res.status(403).json({ message: "You don't have access to this PDF." });
        }

        console.log(`Answering question about: ${pdf.fileName}`);

        try {
            const prompt = `Based on the PDF document, please answer the following question using **markdown formatting** for better readability:\n\n**Question:** ${question}\n\nProvide a clear, well-structured answer with bullet points or numbered lists where appropriate.`;

            const fileData = {
                mimeType: pdf.geminiMimeType,
                fileUri: pdf.geminiFileUri,
            };

            const answer = await generateWithRetry(prompt, fileData);

            res.status(200).json({
                answer: answer || "I couldn't find an answer to that question in the document.",
            });
        } catch (error) {
            console.error("Error generating answer:", error);

            if (error.message === "FILE_EXPIRED_OR_MISSING") {
                return res.status(410).json({
                    message: "The PDF file has expired or is no longer available on the server. Please delete this PDF from your list and re-upload it to continue chatting.",
                    error: "FILE_EXPIRED"
                });
            }

            res.status(500).json({
                message: "Error generating answer",
                error: error.message
            });
        }
    } catch (error) {
        console.error("Error in /chat route:", error);
        res.status(500).json({ message: "Error with request" });
    }
});

// Delete a PDF
router.delete("/delete/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { userEmail } = req.body;

        // Get PDF from database
        const pdfs = await db
            .select()
            .from(userPdfsTable)
            .where(eq(userPdfsTable.id, parseInt(id)));

        if (pdfs.length === 0) {
            return res.status(404).json({ message: "PDF not found." });
        }

        const pdf = pdfs[0];

        // Verify ownership
        if (userEmail && pdf.userEmail !== userEmail) {
            return res.status(403).json({ message: "You don't have access to this PDF." });
        }

        // Delete from Gemini
        try {
            await fileManager.deleteFile(pdf.geminiFileName);
        } catch (e) {
            console.log("Could not delete remote file:", e.message);
        }

        // Delete from database
        await db.delete(userPdfsTable).where(eq(userPdfsTable.id, parseInt(id)));

        res.status(200).json({ message: "PDF deleted successfully." });
    } catch (error) {
        console.error("Error deleting PDF:", error);
        res.status(500).json({ message: "Error deleting PDF" });
    }
});

export default router;