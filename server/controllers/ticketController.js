const Ticket = require('../models/Ticket');
const { analyzeIssue, checkDuplicateIssue } = require('../services/geminiService');
// const { findPotentialDuplicates } = require('../services/pineconeService');

// @desc    Report a new issue
// @route   POST /api/tickets/report
// @access  Public
const reportIssue = async (req, res) => {
    try {
        if (!req.file) {
            // return res.status(400).json({ message: 'Image is required' });
            // Allow no image for smart report
        }

        const { userDescription, lat, lng, address, name, contact, email, routingData } = req.body;
        const imageBuffer = req.file ? req.file.buffer : null; // Handle optional image for Smart Report

        // 1. AI Analysis (If image provided)
        let analysis = {};
        if (imageBuffer) {
            const mimeType = req.file.mimetype;
            analysis = await analyzeIssue(imageBuffer, mimeType, userDescription || '');
        }

        // Parse routing data if sent as string (Multipart form handling)
        let parsedRoutingData = {};
        if (routingData) {
            try {
                parsedRoutingData = JSON.parse(routingData);
            } catch (e) {
                console.error("Failed to parse routing data", e);
            }
        }

        // Determine Final Department
        // Priority: Routing Data > AI Image Analysis > Default
        const finalDepartment = parsedRoutingData.department || analysis.category || 'General Administration';

        // 3. Create Ticket
        const ticket = new Ticket({
            imageUrl: imageBuffer ? "data:image/jpeg;base64," + imageBuffer.toString('base64') : "https://placehold.co/600x400?text=No+Image",
            userDescription,
            reporter: {
                name,
                contact,
                email
            },
            aiAnalysis: analysis,
            smartRouting: parsedRoutingData, // Store the Smart Routing info
            location: {
                lat: parseFloat(lat),
                lng: parseFloat(lng),
                address
            },
            department: {
                name: finalDepartment,
                assignedAt: new Date()
            },
            status: 'Open',
            // SLA logic (Stub)
            sla: {
                expectedResolutionDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Default fallback
                breachWarning: false
            }
        });

        // 4. Content-Aware SLA Calculation (RAG)
        try {
            // Lazy load service
            const { getSLAForTicket } = require('../services/slaService');
            const slaResult = await getSLAForTicket(ticket);

            if (slaResult.found) {
                ticket.sla = {
                    expectedResolutionDate: slaResult.expectedResolutionDate,
                    policyReference: slaResult.slaReferenced.section,
                    policyDurationHours: slaResult.slaReferenced.duration,
                    breachWarning: false,
                    explanation: slaResult.explanation
                };
            }
        } catch (slaError) {
            console.error("SLA Calculation Failed during report:", slaError);
            // Continue without crashing, using default/fallback
        }

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
        console.log("Controller Analysis Result:", analysis);

        res.json({
            success: true,
            data: analysis
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get single ticket by ID
// @route   GET /api/tickets/:id
// @access  Public (or Admin)
const getTicketById = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }
        res.json(ticket);
    } catch (error) {
        console.error(error);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Ticket not found' });
        }
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update ticket status
// @route   PUT /api/tickets/:id/status
// @access  Admin
const updateTicketStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const ticket = await Ticket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        ticket.status = status;
        await ticket.save();

        res.json({ success: true, data: ticket });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update ticket department (Override)
// @route   PUT /api/tickets/:id/department
// @access  Admin
const updateTicketDepartment = async (req, res) => {
    try {
        const { department, reason } = req.body;
        const ticket = await Ticket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        ticket.department = {
            name: department,
            assignedAt: new Date(),
            isOverridden: true,
            overrideReason: reason || "Admin Manual Override"
        };

        await ticket.save();

        res.json({ success: true, data: ticket });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};



// @desc    Check for duplicates
// @route   POST /api/tickets/check-duplicate
// @access  Public
const checkDuplicate = async (req, res) => {
    try {
        const { description, lat, lng, address } = req.body;

        // 1. Geo-Fencing: Find tickets within 500m created in last 72 hours
        // Note: MongoDB $near requires 2dsphere index (added in Model)
        // For simplicity in this demo without ensuring index, we can just filter all open tickets
        // In Prod: use $near or $geoWithin
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

        const candidateTickets = await Ticket.find({
            status: { $ne: 'Resolved' },
            createdAt: { $gte: threeDaysAgo },
            // Basic lat/lng bounding box for speed (approx 200m)
            "location.lat": { $gt: lat - 0.002, $lt: lat + 0.002 },
            "location.lng": { $gt: lng - 0.002, $lt: lng + 0.002 }
        }).limit(5);

        if (candidateTickets.length === 0) {
            return res.json({ isDuplicate: false });
        }

        // 2. AI Semantic Check
        const analysis = await checkDuplicateIssue(
            { description, address },
            candidateTickets
        );

        res.json(analysis);

    } catch (error) {
        console.error("Duplicate Check Error:", error);
        res.status(500).json({ isDuplicate: false, error: error.message });
    }
};

// @desc    Upvote a ticket
// @route   PUT /api/tickets/:id/upvote
// @access  Public
const upvoteTicket = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ message: "Ticket not found" });

        ticket.upvotes = (ticket.upvotes || 0) + 1;
        await ticket.save();

        res.json({ success: true, count: ticket.upvotes });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get SLA for a ticket
// @route   GET /api/tickets/:id/sla
// @access  Public
const getTicketSLA = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        // If SLA is already calculated and valid, return it? 
        // For now, let's always re-fetch or fetch if missing to demonstrate RAG.
        // Actually, let's check if we have it. If not, fetch it.

        // Import basic SLA service here (lazy load to avoid circular deps if any)
        const { getSLAForTicket } = require('../services/slaService');

        const slaResult = await getSLAForTicket(ticket);

        if (slaResult.found) {
            // Update ticket with latest SLA availability
            ticket.sla = {
                expectedResolutionDate: slaResult.expectedResolutionDate,
                policyReference: slaResult.slaReferenced.section,
                policyDurationHours: slaResult.slaReferenced.duration,
                breachWarning: false // logic to check if breached could go here
            };
            await ticket.save();
        }

        res.json({
            success: true,
            ticketId: ticket._id,
            sla: slaResult
        });

    } catch (error) {
        console.error("SLA API Error:", error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

module.exports = { reportIssue, getTickets, analyzeImage, getTicketById, updateTicketStatus, updateTicketDepartment, checkDuplicate, upvoteTicket, getTicketSLA };
