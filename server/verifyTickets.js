require('dotenv').config();
const mongoose = require('mongoose');
const Ticket = require('./models/Ticket');

const MONGO_URI = process.env.MONGO_URI;

const verifyTickets = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        const tickets = await Ticket.find().sort({ createdAt: -1 }).limit(5);
        console.log("Found " + tickets.length + " tickets.");
        tickets.forEach(t => {
            console.log(`- ID: ${t.ticketId}, Status: ${t.status}, Loc: ${t.location.lat},${t.location.lng}`);
        });
        mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
};

verifyTickets();
