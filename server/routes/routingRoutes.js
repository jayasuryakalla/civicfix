const express = require('express');
const router = express.Router();
const { analyzeComplaint } = require('../controllers/routingController');

router.post('/analyze', analyzeComplaint);

module.exports = router;
