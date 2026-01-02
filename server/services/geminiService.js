const { GoogleGenAI } = require("@google/genai");
const dotenv = require('dotenv');
dotenv.config();

// Configuration
const API_KEY = process.env.GOOGLE_API_KEY;

// Initialize client
const genAI = new GoogleGenAI({ apiKey: API_KEY });

// DefineSchema for structured output
const responseSchema = {
    type: "OBJECT",
    properties: {
        category: {
            type: "STRING",
            description: "The department responsible (e.g., Sanitation, Infrastructure)",
            nullable: false,
        },
        issueType: {
            type: "STRING",
            description: "Specific name of the issue (e.g., Pothole, Illegal Dumping)",
            nullable: false,
        },
        severity: {
            type: "STRING",
            enum: ["Low", "Medium", "High"],
            description: "Urgency of the issue",
            nullable: false,
        },
        issueDescription: {
            type: "STRING",
            description: "2-3 technical sentences describing the visual evidence and hazards",
            nullable: false,
        },
        confidence: {
            type: "NUMBER",
            description: "Confidence score between 0.0 and 1.0",
            nullable: false,
        },
    },
    required: ["category", "issueType", "severity", "issueDescription", "confidence"],
};

// Helper to safely extract text from various possible SDK response structures
const extractTextFromResponse = (result) => {
    try {
        // 1. Try direct candidates (newer SDK)
        if (result.candidates && result.candidates.length > 0) {
            return result.candidates[0].content.parts[0].text;
        }
        // 2. Try nested data object
        if (result.data && result.data.candidates && result.data.candidates.length > 0) {
            return result.data.candidates[0].content.parts[0].text;
        }
        // 3. Try response object (older/alternate SDK)
        if (result.response && result.response.candidates && result.response.candidates.length > 0) {
            return result.response.candidates[0].content.parts[0].text;
        }
    } catch (e) {
        console.error("Extraction Parsing Error:", e);
    }

    // console.log("Unknown Response Structure:", JSON.stringify(result, null, 2));
    return "{}"; // Fail safe
};

/**
 * Analyzes an image to generate a detailed description and categorization for a civic issue.
 */
const analyzeIssue = async (imageBuffer, mimeType, userText = "") => {
    // 1. Validate API Key
    if (!API_KEY || API_KEY.startsWith('YOUR_')) {
        console.warn("Missing valid Google API Key. Returning mock data.");
        return getMockAnalysis();
    }

    try {
        const prompt = userText
            ? `Identify the civic issue in this image. Additional context from reporter: ${userText} limit response to 30 words`
            : "Identify the civic issue in this image and provide a technical assessment. Populated the issueDescription field with a clear summary.limit response to 30 words";

        const imagePart = {
            inlineData: {
                data: imageBuffer.toString("base64"),
                mimeType,
            },
        };

        const result = await genAI.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: prompt },
                        imagePart
                    ]
                }
            ],
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            }
        });

        const text = extractTextFromResponse(result);
        console.log("Gemini Raw Response:", text); // Debug Log

        // JSON handling
        let jsonStr = text.replace(/```json|```/g, '').trim();
        return JSON.parse(jsonStr);

    } catch (error) {
        console.error("Gemini Analysis Error:", error.message);
        if (error.message.includes('safety')) {
            return { error: "Image flagged by safety filters." };
        }
        return getMockAnalysis();
    }
};

/**
 * Fallback mock data
 */
function getMockAnalysis() {
    return {
        category: "General",
        issueType: "Unidentified Civic Issue",
        severity: "Medium",
        description: "An issue was reported but could not be automatically analyzed. Requires manual review.",
        confidence: 0.0
    };
}

/**
 * Analyzes complaint text to determine department and urgency.
 */
const analyzeComplaintText = async (text) => {
    if (!API_KEY || API_KEY.startsWith('YOUR_')) {
        return {
            category: "General",
            confidence: 0.0,
            reasoning: "Mock analysis: API Key missing."
        };
    }

    try {
        const result = await genAI.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{
                role: 'user',
                parts: [{ text: text }]
            }],
            config: {
                systemInstruction: {
                    parts: [{ text: "You are a Smart City Routing System. Analyze the citizen's complaint and map it to one of these Departments: [Roads & Infrastructure, Sanitation & Waste, Water Supply, Electrical, Public Safety, Health, Transport]. Provide a confidence score and brief reasoning." }]
                },
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        department: { type: "STRING" },
                        confidence: { type: "NUMBER" },
                        reasoning: { type: "STRING" },
                        priority: { type: "STRING", enum: ["Low", "Medium", "High", "Critical"] }
                    },
                    required: ["department", "confidence", "reasoning", "priority"]
                }
            }
        });

        const responseText = extractTextFromResponse(result);
        return JSON.parse(responseText);

    } catch (error) {
        console.error("Gemini Text Analysis Error:", error.message);
        return {
            department: "General Administration",
            confidence: 0.0,
            reasoning: "Analysis failed due to error.",
            priority: "Medium"
        };
    }
};

// Check for duplicates
const checkDuplicateIssue = async (newReport, candidateTickets) => {
    if (!API_KEY || API_KEY.startsWith('YOUR_')) {
        return { isDuplicate: false };
    }

    try {
        const prompt = `
        You are an intelligent civic issue management system.
        I will provide a 'New Report' and a list of 'Existing Reports' nearby.
        Your task is to determine if the 'New Report' is a Duplicate of any of the 'Existing Reports'.

        Ignore minor differences in phrasing. Look for:
        1. Same specific location (implied by context).
        2. Same specific issue (e.g., "Pothole in front of Starbucks" vs "Road damage near coffee shop").
        3. Similar visual description.

        New Report:
        Description: ${newReport.description}
        Location Context: ${newReport.address}

        Existing Reports:
        ${JSON.stringify(candidateTickets.map(t => ({ id: t._id, desc: t.userDescription, type: t.aiAnalysis?.issueType, address: t.location?.address })))}

        Return ONLY a JSON object:
        {
            "isDuplicate": boolean,
            "duplicateTicketId": "string (ID of the match) or null",
            "confidence": number (0-1),
            "reason": "string (short explanation)"
        }
        `;

        const result = await genAI.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                responseMimeType: "application/json"
            }
        });

        const text = extractTextFromResponse(result);
        const jsonStr = text.replace(/```json|```/g, '').trim();
        return JSON.parse(jsonStr);

    } catch (error) {
        console.error("Gemini Duplicate Check Error:", error);
        return { isDuplicate: false };
    }
};

// Generate Embeddings
const embedText = async (text) => {
    if (!API_KEY || API_KEY.startsWith('YOUR_')) {
        return Array(768).fill(0).map(() => Math.random());
    }

    try {
        const result = await genAI.models.embedContent({
            model: 'gemini-embedding-001',
            contents: [
                { parts: [{ text: text }] }
            ]
        });

        const embeddings = result.embeddings || result.data?.embeddings;
        if (embeddings && embeddings.length > 0) {
            return embeddings[0].values;
        }
        return Array(768).fill(0).map(() => Math.random());
    } catch (error) {
        console.error("Gemini Embedding Error:", error.message);
        return Array(768).fill(0).map(() => Math.random());
    }
};

// Extract structured SLA data from raw text
const extractSLAFromText = async (rawText) => {
    if (!API_KEY || API_KEY.startsWith('YOUR_')) {
        return [];
    }

    try {
        const prompt = `
        You are a Data Extraction Specialist.
        Extract specific Service Level Agreement (SLA) policies from the following text (from a Citizen Charter).
        
        Return a JSON Array where each object represents a specific service standard:
        [
            {
                "category": "Department Name (e.g. Infrastructure, Sanitation)",
                "issueType": "Specific Issue (e.g. Potholes, Streetlights)",
                "sectionReference": "Section Number/Name",
                "text": "The exact policy text",
                "slaDuration": Number (hours),
                "slaUnit": "hours"
            }
        ]

        Rules:
        - Convert days to working hours (8 hours/day) if needed, OR just use total hours if specified.
        - Ensure strictly valid JSON.
        
        Raw Text:
        ${rawText.substring(0, 30000)} // Limit context window if needed
        `;

        const result = await genAI.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ parts: [{ text: prompt }] }],
            config: { responseMimeType: "application/json" }
        });

        const text = extractTextFromResponse(result);
        return JSON.parse(text);

    } catch (error) {
        console.error("SLA Extraction Error:", error);
        return [];
    }
};

// Extract structured Department data from raw text
const extractDepartmentDataFromText = async (rawText) => {
    if (!API_KEY || API_KEY.startsWith('YOUR_')) {
        return [];
    }

    try {
        const prompt = `
        You are a Data Extraction Specialist.
        Analyze the provided Department Responsibility Charter.
        
        Extract a list of Municipal Departments and their specific responsibilities.
        For each department, provide:
        1. "departmentName": The official name.
        2. "handledIssues": A list of specific issues they handle (e.g., "Potholes", "Water Logging").
        3. "keywords": Key terms associated with them.
        4. "summary": A concise summary of their responsibility scope (for embedding).
        
        Return a JSON Array:
        [
            {
                "departmentName": "String",
                "handledIssues": ["String", "String"],
                "keywords": ["String"],
                "summary": "String",
                "examplePhrases": ["Citizen complaint example 1", "Citizen complaint example 2"]
            }
        ]

        Raw Text:
        ${rawText.substring(0, 30000)}
        `;

        const result = await genAI.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ parts: [{ text: prompt }] }],
            config: { responseMimeType: "application/json" }
        });

        const text = extractTextFromResponse(result);
        return JSON.parse(text);

    } catch (error) {
        console.error("Department Data Extraction Error:", error);
        return [];
    }
};

module.exports = { analyzeIssue, analyzeComplaintText, checkDuplicateIssue, embedText, extractSLAFromText, extractDepartmentDataFromText };