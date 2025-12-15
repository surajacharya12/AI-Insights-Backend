import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

async function testImageGen() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API);
    const prompt = "modern flat - style 2D illustration with UI / UX elements for a course about AI";

    try {
        console.log("Starting image generation...");
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Image generation timed out")), 15000)
        );

        const model = genAI.getGenerativeModel({
            model: "imagen-3.0-generate-001",
        });

        const generationPromise = model.generateContent(prompt);

        const result = await Promise.race([generationPromise, timeoutPromise]);
        const response = result.response;

        let imageBase64 = null;

        if (response.candidates && response.candidates[0].content.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    imageBase64 = part.inlineData.data;
                }
            }
        }

        if (!imageBase64) throw new Error("No image data received from Gemini");

        console.log("Image generation successful!");
        console.log("Base64 length:", imageBase64.length);
        console.log("First 50 chars:", imageBase64.substring(0, 50));

    } catch (error) {
        console.error("Image generation failed:", error);
    }
}

testImageGen();
