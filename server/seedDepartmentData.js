const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const { extractDepartmentDataFromText, embedText } = require('./services/geminiService');
const { upsertDepartmentVectors } = require('./services/pineconeService');

const seedDepartmentCharter = async () => {
    try {
        console.log("Reading Department Charter PDF...");
        const pdfPath = path.join(__dirname, 'CivicFix_Department_Responsibility_Charter.pdf');

        if (!fs.existsSync(pdfPath)) {
            console.error("PDF NOT FOUND at", pdfPath);
            return;
        }

        const dataBuffer = fs.readFileSync(pdfPath);
        const data = await pdf(dataBuffer);
        const rawText = data.text;

        console.log(`Extracted ${rawText.length} characters. Analyzing with Gemini...`);

        // Extract structured data
        const deptItems = await extractDepartmentDataFromText(rawText);

        if (!deptItems || deptItems.length === 0) {
            console.error("No Department items extracted.");
            return;
        }

        console.log(`Identified ${deptItems.length} Departments.`);

        const vectors = [];

        for (const item of deptItems) {
            console.log(`Processing: ${item.departmentName}...`);
            // Create a rich context string for embedding
            const textToEmbed = `${item.departmentName} handles: ${item.handledIssues.join(', ')}. ${item.summary}. Common phrases: ${item.examplePhrases?.join(', ') || ''}`;
            const embedding = await embedText(textToEmbed);

            if (embedding) {
                vectors.push({
                    id: `DEPT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    values: embedding,
                    metadata: {
                        departmentName: item.departmentName,
                        handledIssues: item.handledIssues, // Pinecone supports string arrays
                        summary: item.summary,
                        textVal: textToEmbed // For context reference
                    }
                });
            }
        }

        if (vectors.length > 0) {
            console.log(`Upserting ${vectors.length} vectors to namespace 'department-charter'...`);
            await upsertDepartmentVectors(vectors);
            console.log("Department Charter Seeding Complete!");
        } else {
            console.warn("No vectors generated.");
        }

    } catch (error) {
        console.error("Department Seeding Error:", error);
    }
};

seedDepartmentCharter();
