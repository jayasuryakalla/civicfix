const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const { extractSLAFromText, embedText } = require('./services/geminiService');
const { upsertSLAVectors } = require('./services/pineconeService');

const seedPDF = async () => {
    try {
        console.log("Reading PDF...");
        const pdfPath = path.join(__dirname, 'CivicFix_RAG_Citizen_Charter_SLA_Reference.pdf');

        if (!fs.existsSync(pdfPath)) {
            console.error("PDF NOT FOUND at", pdfPath);
            return;
        }

        const dataBuffer = fs.readFileSync(pdfPath);
        const data = await pdf(dataBuffer);
        const rawText = data.text;

        console.log(`Extracted ${rawText.length} characters. Analyzing with Gemini...`);

        // Extract structured data
        const slaItems = await extractSLAFromText(rawText);

        if (!slaItems || slaItems.length === 0) {
            console.error("No SLA items extracted.");
            return;
        }

        console.log(`Identified ${slaItems.length} SLA policies.`);

        const vectors = [];

        for (const item of slaItems) {
            console.log(`Processing: ${item.issueType}...`);
            const textToEmbed = `${item.category} - ${item.issueType}: ${item.text} (${item.sectionReference})`;
            const embedding = await embedText(textToEmbed);

            if (embedding) {
                vectors.push({
                    id: `SLA-PDF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
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
        }

        if (vectors.length > 0) {
            console.log(`Upserting ${vectors.length} vectors...`);
            await upsertSLAVectors(vectors);
            console.log("PDF Seeding Complete!");
        } else {
            console.warn("No vectors generated.");
        }

    } catch (error) {
        console.error("PDF Seeding Error:", error);
    }
};

seedPDF();
