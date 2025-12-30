require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Helper to access model listing (not directly exposed in all SDK versions simpler to just try standard ones)
// But wait, the SDK doesn't always have list_models.
// Let's try to just test "gemini-pro" as a fallback.

async function listModels() {
    try {
        console.log("Testing fallback model 'gemini-pro'...");
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const result = await model.generateContent("Test");
        const response = await result.response;
        console.log("gemini-pro works: " + response.text());

    } catch (error) {
        console.error("gemini-pro failed:", error.message);
    }

    try {
        console.log("Testing 'gemini-1.5-flash'...");
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const result = await model.generateContent("Test");
        const response = await result.response;
        console.log("gemini-1.5-flash works: " + response.text());

    } catch (error) {
        console.error("gemini-1.5-flash failed:", error.message);
    }
}

listModels();
