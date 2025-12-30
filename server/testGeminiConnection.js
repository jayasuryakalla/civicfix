require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testConnection() {
    try {
        console.log("Checking API Key...");
        if (!process.env.GOOGLE_API_KEY) {
            throw new Error("GOOGLE_API_KEY not found in .env");
        }
        console.log("API Key found (length: " + process.env.GOOGLE_API_KEY.length + ")");

        console.log("Initializing Gemini...");
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        console.log("Sending test prompt...");
        const result = await model.generateContent("Hello, are you working?");
        const response = await result.response;
        const text = response.text();

        console.log("Success! Model responded:");
        console.log(text);
    } catch (error) {
        console.error("Test Failed!");
        console.error(error);
    }
}

testConnection();
