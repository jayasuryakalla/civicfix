const { analyzeComplaintText, embedText } = require('../services/geminiService');
const { queryDepartmentCharter } = require('../services/pineconeService');

// Mock Geo-Fencing Data
const getZoneFromLocation = (lat, lng) => {
    const latCenter = 20.0;
    const lngCenter = 78.0;

    // Simple Quadrant Logic (Placeholder for Point-in-Polygon)
    if (lat > latCenter && lng > lngCenter) return "North-East Zone";
    if (lat > latCenter && lng < lngCenter) return "North-West Zone";
    if (lat < latCenter && lng > lngCenter) return "South-East Zone";
    return "South-West Zone";
};

const analyzeComplaint = async (req, res) => {
    try {
        const { text, lat, lng } = req.body;

        if (!text) {
            return res.status(400).json({ success: false, message: "Complaint text is required" });
        }

        console.log(`Analyzing complaint: "${text.substring(0, 50)}..."`);

        // 1. Generate Embedding
        const embedding = await embedText(text);

        // 2. Query Vector DB (RAG)
        const matches = await queryDepartmentCharter(embedding);

        // 3. Geographic Routing
        const zone = (lat && lng) ? getZoneFromLocation(lat, lng) : "General Zone";

        let routingResult;

        if (matches && matches.length > 0) {
            const topMatch = matches[0];
            console.log("RAG Match Found:", topMatch.metadata.departmentName);

            routingResult = {
                department: topMatch.metadata.departmentName,
                confidence: topMatch.score,
                reasoning: `Based on official charter: ${topMatch.metadata.summary || "Matches department responsibilities."}`,
                priority: "Medium", // Default, or can be inferred
                zone: zone,
                finalAssignment: `${topMatch.metadata.departmentName} - ${zone}`,
                routingMethod: "Semantic Search (RAG)"
            };
        } else {
            // Fallback to pure Gemini if Vector DB fails or has no data
            console.log("No RAG match, falling back to Gemini.");
            const semanticResult = await analyzeComplaintText(text);
            routingResult = {
                ...semanticResult,
                zone: zone,
                finalAssignment: `${semanticResult.department} - ${zone}`,
                routingMethod: "Fallback: Gemini LLM"
            };
        }

        res.json({
            success: true,
            data: routingResult
        });

    } catch (error) {
        console.error("Routing Error:", error);
        res.status(500).json({ success: false, message: "Smart routing failed" });
    }
};

module.exports = { analyzeComplaint };
