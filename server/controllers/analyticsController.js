const Ticket = require('../models/Ticket');

// @desc    Get Analytics Dashboard Stats
// @route   GET /api/analytics/dashboard
// @access  Public (should be Admin)
const getDashboardStats = async (req, res) => {
    try {
        // 1. Total Tickets
        const totalTickets = await Ticket.countDocuments();

        // 2. By Status
        const statusStats = await Ticket.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        // 3. By Severity (AI)
        const severityStats = await Ticket.aggregate([
            { $group: { _id: "$aiAnalysis.severity", count: { $sum: 1 } } }
        ]);

        // 4. By Department (Smart Routing)
        const departmentStats = await Ticket.aggregate([
            { $group: { _id: "$department.name", count: { $sum: 1 } } }
        ]);

        // 5. Recent (Last 7 Days)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const recentTickets = await Ticket.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

        res.json({
            success: true,
            data: {
                totalTickets,
                recentTickets,
                statusBreakdown: statusStats.map(s => ({ name: s._id || 'Unknown', value: s.count })),
                severityBreakdown: severityStats.map(s => ({ name: s._id || 'Unrated', value: s.count })),
                departmentBreakdown: departmentStats.map(s => ({ name: s._id || 'Unassigned', value: s.count }))
            }
        });

    } catch (error) {
        console.error("Analytics Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

module.exports = { getDashboardStats };
