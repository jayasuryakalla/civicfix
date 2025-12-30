const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");
const dotenv = require('dotenv');
dotenv.config();

// Configuration
const API_KEY = process.env.GOOGLE_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

// Define the JSON schema to ensure structured output without manual parsing
const responseSchema = {
    description: "Civic issue analysis report",
    type: SchemaType.OBJECT,
    properties: {
        category: {
            type: SchemaType.STRING,
            description: "The department responsible (e.g., Sanitation, Infrastructure)",
            nullable: false,
        },
        issueType: {
            type: SchemaType.STRING,
            description: "Specific name of the issue (e.g., Pothole, Illegal Dumping)",
            nullable: false,
        },
        severity: {
            type: SchemaType.STRING,
            enum: ["Low", "Medium", "High"],
            description: "Urgency of the issue",
            nullable: false,
        },
        description: {
            type: SchemaType.STRING,
            description: "2-3 technical sentences describing the visual evidence and hazards",
            nullable: false,
        },
        confidence: {
            type: SchemaType.NUMBER,
            description: "Confidence score between 0.0 and 1.0",
            nullable: false,
        },
    },
    required: ["category", "issueType", "severity", "description", "confidence"],
};

// Initialize model with System Instructions
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash", // Flash is faster/cheaper for vision tasks
    systemInstruction: "You are an expert City Inspector and Civil Engineer. Your task is to analyze images of civic issues and provide technical, structured reports for city maintenance crews.",
    generationConfig: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
    },
});

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
            ? `Identify the civic issue in this image. Additional context from reporter: ${userText}`
            : "Identify the civic issue in this image and provide a technical assessment.";

        const imagePart = {
            inlineData: {
                data: imageBuffer.toString("base64"),
                mimeType,
            },
        };

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;

        // No need for regex cleaning; generateContent with responseSchema returns valid JSON
        return JSON.parse(response.text());

    } catch (error) {
        console.error("Gemini Analysis Error:", error.message);

        // Handle specific safety or quota errors if necessary
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

module.exports = { analyzeIssue };