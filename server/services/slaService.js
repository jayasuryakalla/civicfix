const { embedText, genAI } = require('./geminiService'); // Adjust import if needed
const { querySLA } = require('./pineconeService');

// Helper to calculate target date skipping weekends if needed (simplified for now)
const calculateTargetDate = (startDate, hours) => {
    const target = new Date(startDate);
    target.setHours(target.getHours() + hours);
    return target;
};

const getSLAForTicket = async (ticket) => {
    try {
        // 1. Construct query from ticket details
        const queryText = `${ticket.aiAnalysis?.category || ticket.department?.name} - ${ticket.aiAnalysis?.issueType || ticket.title}`;
        console.log(`Searching SLA for: ${queryText}`);

        // 2. Embed and Query Vector Store
        const embedding = await embedText(queryText);
        const matches = await querySLA(embedding);

        if (!matches || matches.length === 0) {
            return {
                found: false,
                reason: "No matching SLA policy found."
            };
        }

        // 3. Get best match
        const bestMatch = matches[0];
        const slaData = bestMatch.metadata;
        console.log("Best SLA Match:", slaData.sectionReference);

        // 4. Generate Explanation via LLM
        // We instantiate the model locally here or import a shared instance. 
        // Assuming geminiService allows us to get a model instance or provides a generate function.
        // For simplicity, reusing the pattern from geminiService if possible, or new instance.
        // Let's assume we can get a standard model here.

        // Check if we need to require GoogleGenerativeAI again or export the model/genAI from service
        // For now, I'll assume I can just use the genAI instance exported or text generation helper.
        // I'll add a generateText helper to geminiService in a moment if needed, 
        // but for now let's just do a direct call if we have the key, or mock it.

        let explanation = `Based on the Citizen Charter ${slaData.sectionReference}, ${slaData.issueType} issues must be resolved within ${slaData.slaDuration} ${slaData.slaUnit}.`;

        // 5. Calculate Date
        const creationDate = new Date(ticket.createdAt);
        const resolutionDate = calculateTargetDate(creationDate, slaData.slaDuration);

        return {
            found: true,
            slaReferenced: {
                section: slaData.sectionReference,
                policyText: slaData.text,
                duration: slaData.slaDuration,
                unit: slaData.slaUnit
            },
            expectedResolutionDate: resolutionDate,
            explanation: explanation
        };

    } catch (error) {
        console.error("SLA Retrieval Error:", error);
        return { found: false, error: error.message };
    }
};

module.exports = { getSLAForTicket };
