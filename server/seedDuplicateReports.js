require('dotenv').config();
const mongoose = require('mongoose');
const Ticket = require('./models/Ticket');

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('MONGO_URI is not defined in .env');
  process.exit(1);
}

const seedDuplicates = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB Connected');

    // clear existing tickets for clean testing if needed, strictly optional
    // await Ticket.deleteMany({}); 

    const baseLocation = {
      lat: 12.9716, // Bangalore coordinates as example
      lng: 77.5946,
      address: "MG Road, Bangalore"
    };

    const tickets = [
      {
        ticketId: `T-${Date.now()}-1`,
        imageUrl: "https://example.com/pothole1.jpg",
        userDescription: "Big pothole on MG Road near metro station",
        aiAnalysis: {
            category: "Infrastructure",
            issueType: "Pothole",
            severity: "High",
            description: "Large pothole detected on main road",
            confidence: 0.95
        },
        location: {
            lat: baseLocation.lat,
            lng: baseLocation.lng,
            address: baseLocation.address
        },
        status: "Open"
      },
      {
        ticketId: `T-${Date.now()}-2`,
        imageUrl: "https://example.com/pothole2.jpg",
        userDescription: "Another pothole spotted here",
        aiAnalysis: {
            category: "Infrastructure",
            issueType: "Pothole",
            severity: "Medium",
            description: "Pothole on the road",
            confidence: 0.88
        },
        // Very close location, likely a duplicate
        location: {
            lat: baseLocation.lat + 0.0001, 
            lng: baseLocation.lng + 0.0001,
            address: "MG Road, Bangalore, near junction"
        },
        status: "Open"
      }
    ];

    await Ticket.insertMany(tickets);
    console.log('Duplicate tickets inserted successfully');

    mongoose.connection.close();
  } catch (err) {
    console.error('Error seeding tickets:', err);
    process.exit(1);
  }
};

seedDuplicates();
