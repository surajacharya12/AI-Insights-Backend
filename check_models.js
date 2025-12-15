import "dotenv/config";
import axios from "axios";

const apiKey = process.env.GEMINI_API || process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error("❌ GEMINI_API or GEMINI_API_KEY is missing!");
    process.exit(1);
}

async function listModels() {
    try {
        console.log("Listing models via REST API...");
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const response = await axios.get(url);

        if (response.data && response.data.models) {
            console.log("✅ Available Models:");
            response.data.models.forEach(model => {
                if (model.supportedGenerationMethods && model.supportedGenerationMethods.includes("generateContent")) {
                    console.log(`- ${model.name.replace("models/", "")}`);
                }
            });
        } else {
            console.log("❌ No models found in response.");
        }

    } catch (error) {
        console.error("Error listing models:", error.response ? error.response.data : error.message);
    }
}

listModels();
