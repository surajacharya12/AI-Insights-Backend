import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("AIzaSyAbs5cES26lmXtkwLPSD_IEMBC7Teq7zzk"); // Leaked QUIZ key
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

async function run() {
    try {
        console.log("Sending request...");
        const result = await model.generateContent("Hello");
        console.log("Response Text:", result.response.text());
    } catch (error) {
        console.error("Caught Error:", error);
        console.error("Error Message:", error.message);
    }
}

run();
