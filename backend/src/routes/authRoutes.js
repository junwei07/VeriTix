const express = require('express');

const { issueNonce } = require('../controllers/authController');

// Wallet auth endpoints for nonce issuance.
const router = express.Router();
const { createWallet } = require('../services/xrplService');

// Mock database (In a real app, use MongoDB or PostgreSQL)
let users = {}; 

/**
 * @route   POST /api/auth/login
 * @desc    Login with NRIC and auto-generate XRPL wallet if new
 */
router.post('/login', async (req, res) => {
  try {
    const { nric } = req.body;

    if (!nric) {
      return res.status(400).json({ message: "NRIC is required" });
    }

    // Check if user exists in our mock DB
    if (!users[nric]) {
      console.log(`Creating new XRPL wallet for NRIC: ${nric}`);
      const newWallet = await createWallet();
      
      users[nric] = {
        nric: nric,
        walletAddress: newWallet.address,
        seed: newWallet.seed // Note: In production, encrypt this!
      };
    }

    res.status(200).json(users[nric]);
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
