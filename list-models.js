import { GoogleGenAI } from "@google/genai";
import "dotenv/config";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API
});

async function listModels() {
    try {
        console.log("Fetching available models...\n");
        const models = await ai.models.list();
        
        console.log("Available models:");
        for (const model of models) {
            console.log(`- ${model.name}`);
            if (model.supportedGenerationMethods) {
                console.log(`  Methods: ${model.supportedGenerationMethods.join(", ")}`);
            }
        }
    } catch (error) {
        console.error("Error listing models:", error.message);
    }
}

listModels();
