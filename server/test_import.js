console.log("Starting test_import.js");
try {
    console.log("Current directory:", __dirname);
    console.log("Requiring geminiService...");
    const gemini = require('./services/geminiService');
    console.log("geminiService loaded. Keys:", Object.keys(gemini));

    console.log("Requiring pineconeService...");
    const pinecone = require('./services/pineconeService');
    console.log("pineconeService loaded. Keys:", Object.keys(pinecone));

    console.log("Imports successful.");
} catch (e) {
    console.error("IMPORT ERROR:", e);
}
