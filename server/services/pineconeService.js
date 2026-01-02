const { Pinecone } = require('@pinecone-database/pinecone');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

// Initialize Pinecone
let pineconeIndex;
let useLocalStore = false;
const LOCAL_VECTOR_PATH = path.join(__dirname, '../data/sla_vectors.json');

const initPinecone = async () => {
    try {
        if (!process.env.PINECONE_API_KEY || process.env.PINECONE_API_KEY.startsWith('YOUR_')) {
            console.warn("Pinecone API Key missing or invalid. Using Local Vector Store.");
            useLocalStore = true;
            return;
        }
        const pc = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY
        });
        pineconeIndex = pc.index(process.env.PINECONE_INDEX || 'civicfix-index');
        console.log("Pinecone Connected");
    } catch (err) {
        console.error("Pinecone Connection Error:", err);
        console.warn("Falling back to Local Vector Store.");
        useLocalStore = true;
    }
};

// Initialize on load
initPinecone();

// Helper: Cosine Similarity
const cosineSimilarity = (vecA, vecB) => {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

const upsertSLAVectors = async (vectors) => {
    if (useLocalStore) {
        console.log(`Saving ${vectors.length} vectors to local store...`);
        fs.writeFileSync(LOCAL_VECTOR_PATH, JSON.stringify(vectors, null, 2));
        return;
    }

    if (pineconeIndex) {
        try {
            // Batch upsert if needed, keeping it simple for now
            await pineconeIndex.upsert(vectors);
            console.log(`Upserted ${vectors.length} vectors to Pinecone.`);
        } catch (error) {
            console.error("Pinecone Upsert Error:", error);
            // Fallback to local if upsert fails
            fs.writeFileSync(LOCAL_VECTOR_PATH, JSON.stringify(vectors, null, 2));
        }
    }
};

const querySLA = async (queryEmbedding) => {
    if (useLocalStore) {
        if (!fs.existsSync(LOCAL_VECTOR_PATH)) {
            console.warn("Local vector store not found.");
            return [];
        }
        const vectors = JSON.parse(fs.readFileSync(LOCAL_VECTOR_PATH));

        // Calculate similarity for all
        const scored = vectors.map(vec => ({
            id: vec.id,
            metadata: vec.metadata,
            score: cosineSimilarity(queryEmbedding, vec.values)
        }));

        // Sort descending and take top 3
        return scored.sort((a, b) => b.score - a.score).slice(0, 3);
    }

    if (pineconeIndex) {
        try {
            const queryResponse = await pineconeIndex.query({
                vector: queryEmbedding,
                topK: 3,
                includeMetadata: true
            });
            return queryResponse.matches;
        } catch (error) {
            console.error("Pinecone Query Error:", error);
            return [];
        }
    }
    return [];
};

const findPotentialDuplicates = async (embeddingVector, location, threshold = 0.8) => {
    // Mock for now if no Pinecone, or implement local check if needed
    if (!pineconeIndex && !useLocalStore) return [];
    // ... existing duplicate logic or placeholder ...
    return [];
};

const upsertDepartmentVectors = async (vectors) => {
    if (useLocalStore) {
        const DEP_VECTOR_PATH = path.join(__dirname, '../data/dept_vectors.json');
        console.log(`Saving ${vectors.length} vectors to local department store...`);
        fs.writeFileSync(DEP_VECTOR_PATH, JSON.stringify(vectors, null, 2));
        return;
    }

    if (pineconeIndex) {
        try {
            await pineconeIndex.namespace('department-charter').upsert(vectors);
            console.log(`Upserted ${vectors.length} vectors to Pinecone (Namespace: department-charter).`);
        } catch (error) {
            console.error("Pinecone Department Upsert Error:", error);
        }
    }
};

const queryDepartmentCharter = async (queryEmbedding) => {
    if (useLocalStore) {
        const DEP_VECTOR_PATH = path.join(__dirname, '../data/dept_vectors.json');
        if (!fs.existsSync(DEP_VECTOR_PATH)) return [];

        const vectors = JSON.parse(fs.readFileSync(DEP_VECTOR_PATH));
        const scored = vectors.map(vec => ({
            id: vec.id,
            metadata: vec.metadata,
            score: cosineSimilarity(queryEmbedding, vec.values)
        }));
        return scored.sort((a, b) => b.score - a.score).slice(0, 3);
    }

    if (pineconeIndex) {
        try {
            const queryResponse = await pineconeIndex.namespace('department-charter').query({
                vector: queryEmbedding,
                topK: 3,
                includeMetadata: true
            });
            return queryResponse.matches;
        } catch (error) {
            console.error("Pinecone Department Query Error:", error);
            return [];
        }
    }
    return [];
};

module.exports = { findPotentialDuplicates, upsertSLAVectors, querySLA, upsertDepartmentVectors, queryDepartmentCharter };

