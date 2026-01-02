const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Database Connection
const connectDB = async () => {
    try {
        // Check if MONGO_URI is set, otherwise use local fallback or mock
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/civicfix');
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        // For MVP, we might not want to crash if DB isn't there yet, but for now let's exit
        // process.exit(1);
        console.warn("Continuing without MongoDB connection (Mock Mode).");
    }
};

// Only connect if not in test mode/environment
if (process.env.NODE_ENV !== 'test') {
    connectDB();
}

// Basic Route
app.get('/', (req, res) => {
    res.send('CivicFix API is running...');
});

// Import Routes (Placeholder)
app.use('/api/tickets', require('./routes/ticketRoutes'));
app.use('/api/routing', require('./routes/routingRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
//app.use('/api/auth', require('./routes/authRoutes'));

// Error Handling Middleware
app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
