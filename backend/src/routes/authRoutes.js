const express = require('express');
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

/**
 * @route   GET /api/auth/user
 * @desc    Get user info by NRIC (from query parameter)
 */
router.get('/user', async (req, res) => {
  try {
    const nric = req.query.nric;

    if (!nric) {
      return res.status(400).json({ message: "NRIC is required" });
    }

    // Check if user exists in our mock DB
    if (!users[nric]) {
      return res.status(404).json({ message: "User not found" });
    }

    // Return user without seed (never expose seed in API responses)
    res.status(200).json({
      nric: users[nric].nric,
      walletAddress: users[nric].walletAddress,
    });
  } catch (error) {
    console.error("Get User Error:", error);
    res.status(500).json({ 
      message: "Internal Server Error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
