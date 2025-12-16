import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
    apiKey: "AIzaSyBq3cgs5M7rb-JTVrfYO9_uCbGuSslCreA" // Leaked key
});

async function run() {
    try {
        console.log("Sending request...");
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: "Hello",
        });
        console.log("Response:", response);
    } catch (error) {
        console.error("Caught Error:", error);
        console.error("Error Message:", error.message);
    }
}

run();
