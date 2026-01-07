const express = require('express');

const { issueNonce } = require('../controllers/authController');

// Wallet auth endpoints for nonce issuance.
const router = express.Router();

router.post('/nonce', issueNonce);

module.exports = router;
