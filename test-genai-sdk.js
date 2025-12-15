import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";
import "dotenv/config";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API
});

async function testTextGeneration() {
    console.log("=== Testing Text Generation ===");
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: "Say 'Hello World' and nothing else.",
        });
        console.log("✅ Text Generation Success:");
        console.log(response.text);
    } catch (error) {
        console.error("❌ Text Generation Failed:");
        console.error(error.message);
    }
}

async function testImageGeneration() {
    console.log("\n=== Testing Image Generation ===");
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-image",
            contents: "A simple red circle on white background",
        });

        let imageFound = false;
        for (const part of response.candidates[0].content.parts) {
            if (part.text) {
                console.log("Text:", part.text);
            } else if (part.inlineData) {
                imageFound = true;
                const imageData = part.inlineData.data;
                const buffer = Buffer.from(imageData, "base64");
                fs.writeFileSync("test-image.png", buffer);
                console.log("✅ Image Generation Success: test-image.png saved");
            }
        }
        if (!imageFound) {
            console.log("⚠️ No image data in response");
        }
    } catch (error) {
        console.error("❌ Image Generation Failed:");
        console.error(error.message);
    }
}

async function main() {
    await testTextGeneration();
    await testImageGeneration();
}

main();
