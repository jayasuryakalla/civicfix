const express = require('express');
const router = express.Router();
const multer = require('multer');
const { reportIssue, getTickets, analyzeImage } = require('../controllers/ticketController');

// Multer Setup for Memory Storage
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

router.post('/report', upload.single('image'), reportIssue);
router.post('/analyze', upload.single('image'), analyzeImage);
router.get('/', getTickets);

module.exports = router;
