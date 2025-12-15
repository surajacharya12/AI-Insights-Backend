import { GoogleGenAI } from "@google/genai";
import "dotenv/config";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API
});

async function testGrammar() {
    try {
        console.log("Testing gemini-1.5-flash...");
        
        const response = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: "Say 'Hello from gemini-1.5-flash' and nothing else.",
        });
        
        console.log("✅ Success:", response.text);
    } catch (error) {
        console.error("❌ Failed:", error.message);
        console.error("Status:", error.status);
    }
}

testGrammar();
