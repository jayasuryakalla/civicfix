const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
    ticketId: {
        type: String,
        unique: true,
        required: true,
        default: () => `T-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    },
    imageUrl: {
        type: String,
        required: true
    },
    reporter: {
        name: { type: String, required: true },
        contact: { type: String, required: true },
        email: String
    },
    userDescription: {
        type: String,
    },
    aiAnalysis: {
        category: String, // e.g., Infrastructure, Sanitation
        issueType: String, // e.g., Pothole, Garbage
        severity: {
            type: String,
            enum: ['Low', 'Medium', 'High'],
            default: 'Medium'
        },
        description: String, // AI refined description
        confidence: Number
    },
    smartRouting: {
        recommendedDepartment: String,
        confidence: Number,
        reasoning: String,
        priority: String,
        routingMethod: String
    },
    location: {
        lat: Number,
        lng: Number,
        address: String
    },
    department: {
        name: String,
        assignedAt: Date,
        isOverridden: { type: Boolean, default: false },
        overrideReason: String
    },
    status: {
        type: String,
        enum: ['Open', 'In Progress', 'Resolved', 'Duplicate'],
        default: 'Open'
    },
    sla: {
        expectedResolutionDate: Date,
        breachWarning: Boolean,
        policyReference: String, // e.g. "Section 1.a"
        policyDurationHours: Number
    },
    duplicateOf: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ticket'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    upvotes: {
        type: Number,
        default: 0
    }
});

// Create geospatial index for location duplicate search
TicketSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Ticket', TicketSchema);
