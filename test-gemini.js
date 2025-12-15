import "dotenv/config";
import { GoogleGenAI, Modality } from "@google/genai";

const apiKey = process.env.GEMINI_API;
const ai = new GoogleGenAI({ apiKey });

async function testImageGeneration() {
    console.log("\nTesting Image Generation with 'gemini-2.5-flash-image'...");
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-image",
            contents: "A futuristic city skyline",
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
        const imagePart = response.candidates?.[0]?.content?.parts.find((part) => part.inlineData?.data);
        if (imagePart) {
            console.log("✅ Image Generation Success (gemini-2.5-flash-image)");
        } else {
            console.log("❌ Image Generation Failed (gemini-2.5-flash-image): No image data");
        }
    } catch (error) {
        console.error("❌ Image Generation Failed (gemini-2.5-flash-image):", error.message);
    }

    console.log("\nTesting Image Generation with 'imagen-4.0-fast-generate-001'...");
    try {
        const response = await ai.models.generateContent({
            model: "imagen-4.0-fast-generate-001",
            contents: "A futuristic city skyline",
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
        const imagePart = response.candidates?.[0]?.content?.parts.find((part) => part.inlineData?.data);
        if (imagePart) {
            console.log("✅ Image Generation Success (imagen-4.0-fast-generate-001)");
        } else {
            console.log("❌ Image Generation Failed (imagen-4.0-fast-generate-001): No image data");
        }
    } catch (error) {
        console.error("❌ Image Generation Failed (imagen-4.0-fast-generate-001):", error.message);
    }
}

(async () => {
    await testImageGeneration();
})();
