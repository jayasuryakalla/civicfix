const Ticket = require('../models/Ticket');
const { analyzeIssue } = require('../services/geminiService');
// const { findPotentialDuplicates } = require('../services/pineconeService');

// @desc    Report a new issue
// @route   POST /api/tickets/report
// @access  Public
const reportIssue = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Image is required' });
        }

        const { userDescription, lat, lng, address } = req.body;
        const imageBuffer = req.file.buffer;
        const mimeType = req.file.mimetype;

        // 1. AI Analysis
        const analysis = await analyzeIssue(imageBuffer, mimeType, userDescription || '');

        // 2. Duplicate Detection (TODO: Implement Pinecone check)
        // const duplicates = await findPotentialDuplicates(analysis.embedding, { lat, lng });

        // 3. Create Ticket
        const ticket = new Ticket({
            imageUrl: "data:image/jpeg;base64," + imageBuffer.toString('base64'), // Storing base64 for MVP simplicity. Prod use Cloudinary/S3.
            userDescription,
            aiAnalysis: analysis,
            location: {
                lat: parseFloat(lat),
                lng: parseFloat(lng),
                address
            },
            status: 'Open',
            // SLA logic (Stub)
            sla: {
                expectedResolutionDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // +3 days mock
                breachWarning: false
            }
        });

        await ticket.save();

        res.status(201).json({
            success: true,
            data: ticket,
            message: 'Ticket created successfully via AI analysis.'
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get all tickets with filters
// @route   GET /api/tickets
// @access  Public (or Admin)
const getTickets = async (req, res) => {
    try {
        const { status, limit } = req.query;
        let query = {};
        if (status) query.status = status;

        const tickets = await Ticket.find(query).sort({ createdAt: -1 }).limit(Number(limit) || 50);
        res.json(tickets);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Analyze image without creating ticket
// @route   POST /api/tickets/analyze
// @access  Public
const analyzeImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Image is required' });
        }

        const imageBuffer = req.file.buffer;
        const mimeType = req.file.mimetype;

        const analysis = await analyzeIssue(imageBuffer, mimeType, '');

        res.json({
            success: true,
            data: analysis
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

module.exports = { reportIssue, getTickets, analyzeImage };
