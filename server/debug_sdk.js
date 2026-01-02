const { GoogleGenAI } = require("@google/genai");
const dotenv = require('dotenv');
dotenv.config();

const API_KEY = process.env.GOOGLE_API_KEY;
const genAI = new GoogleGenAI({ apiKey: API_KEY });

const debugSDK = async () => {
    console.log("--- Debugging Google GenAI SDK ---");

    // 1. Test Text Generation
    try {
        console.log("\n1. Testing generateContent...");
        const result = await genAI.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: [{
                role: 'user',
                parts: [{ text: "Hello, tell me a joke." }]
            }]
        });

        console.log("Generate Result Keys:", Object.keys(result));
        if (result.response) console.log("Response Keys:", Object.keys(result.response));
        // console.log("Full Result:", JSON.stringify(result, null, 2));

    } catch (e) {
        console.error("Generate Error:", e.message);
    }

    // 2. Test Embedding
    try {
        console.log("\n2. Testing embedContent...");
        // Try current incorrect syntax to see error
        // models.embedContent(request: EmbedContentRequest, options?: RequestOptions): Promise<EmbedContentResponse>;
        const result = await genAI.models.embedContent({
            model: 'text-embedding-004',
            content: {
                parts: [{ text: "Civic issue" }]
            }
        });
        console.log("Embed Result Keys:", Object.keys(result));
        // console.log("Embedding length:", result.embedding?.values?.length);
    } catch (e) {
        console.error("Embed Error (Attempt 1):", e.message);

        // Try Alternative Syntax
        try {
            console.log("Retrying Embed with contents array...");
            const result = await genAI.models.embedContent({
                model: 'text-embedding-004',
                contents: [
                    { parts: [{ text: "Civic issue" }] }
                ]
            });
            console.log("Embed Attempt 2 Success:", Object.keys(result));
        } catch (e2) {
            console.error("Embed Error (Attempt 2):", e2.message);
        }
    }
};

debugSDK();
