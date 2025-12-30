require('dotenv').config();
const mongoose = require('mongoose');
const Ticket = require('./models/Ticket');

const MONGO_URI = process.env.MONGO_URI;

const checkData = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        const badTickets = await Ticket.find({
            $or: [
                { aiAnalysis: { $exists: false } },
                { 'aiAnalysis.severity': { $exists: false } }
            ]
        });

        console.log(`Found ${badTickets.length} tickets with missing aiAnalysis data.`);
        if (badTickets.length > 0) {
            console.log("Sample bad ticket ID:", badTickets[0]._id);
        }

        mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
};

checkData();
