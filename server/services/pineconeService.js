const { Pinecone } = require('@pinecone-database/pinecone');
const dotenv = require('dotenv');
dotenv.config();

// Initialize Pinecone
let pineconeIndex;

const initPinecone = async () => {
    try {
        if (!process.env.PINECONE_API_KEY || process.env.PINECONE_API_KEY === 'YOUR_PINECONE_API_KEY') {
            console.warn("Pinecone API Key missing, skipping connection.");
            return;
        }
        const pc = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY
        });
        pineconeIndex = pc.index(process.env.PINECONE_INDEX || 'civicfix-index');
        console.log("Pinecone Connected");
    } catch (err) {
        console.error("Pinecone Connection Error:", err);
    }
};

// Initialize on load
initPinecone();

const findPotentialDuplicates = async (embeddingVector, location, threshold = 0.8) => {
    // Mock for now if no Pinecone
    if (!pineconeIndex) return [];

    // Logic to query Pinecone would go here
    // We would filter by location approximation if possible or just use vector similarity
    return [];
};

module.exports = { findPotentialDuplicates };
