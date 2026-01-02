const { embedText } = require('./services/geminiService');
const { upsertSLAVectors } = require('./services/pineconeService');
const fs = require('fs');
const path = require('path');

const seedSLA = async () => {
    try {
        console.log("Reading SLa data...");
        const dataPath = path.join(__dirname, 'data/citizen_charter_sla.json');

        if (!fs.existsSync(dataPath)) {
            throw new Error(`Data file not found at: ${dataPath} `);
        }

        const rawData = fs.readFileSync(dataPath, 'utf-8');
        const slaItems = JSON.parse(rawData);

        console.log(`Found ${slaItems.length} SLA items.Generating embeddings...`);

        const vectors = [];

        for (const item of slaItems) {
            // Create a rich text representation for embedding
            const textToEmbed = `${item.category} - ${item.issueType}: ${item.text} (${item.sectionReference})`;

            console.log(`Embedding: ${item.issueType}...`);
            const embedding = await embedText(textToEmbed);

            if (!embedding || embedding.length === 0) {
                console.warn(`Failed to embed ${item.issueType}, skipping.`);
                continue;
            }

            vectors.push({
                id: item.id,
                values: embedding,
                metadata: {
                    category: item.category,
                    issueType: item.issueType,
                    sectionReference: item.sectionReference,
                    slaDuration: item.slaDuration,
                    slaUnit: item.slaUnit,
                    text: item.text
                }
            });
        }

        console.log("Upserting vectors...");
        await upsertSLAVectors(vectors);
        console.log("SLA Seeding Complete!");
    } catch (error) {
        console.error("FATAL SEEDING ERROR:", error);
        process.exit(1);
    }
};

seedSLA();
