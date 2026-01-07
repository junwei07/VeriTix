const express = require('express');
const router = express.Router();
const { mintTicketNFT } = require('../services/xrplService');

/**
 * @route   POST /api/tickets/purchase
 * @desc    Mint a Soulbound Ticket NFT for a user
 */
router.post('/purchase', async (req, res) => {
  try {
    const { userAddress, ticketType } = req.body;

    // Use the Issuer Seed from your .env file
    const issuerSeed = process.env.ISSUER_SEED; 

    if (!issuerSeed) {
      return res.status(500).json({ message: "Issuer configuration missing" });
    }

    console.log(`Minting ${ticketType} ticket for ${userAddress}...`);

    // Prepare metadata URI (Mocking a JSON link)
    const metadataUri = `https://veritix.com/metadata/${ticketType}.json`;

    // Create the Soulbound Ticket NFT
    const mintResult = await mintTicketNFT({
      issuerSeed: issuerSeed,
      uri: metadataUri,
      taxon: 1 // Grouping all tickets under Taxon 1
    });

    res.status(200).json({
      message: "Ticket purchased successfully!",
      tokenId: mintResult.tokenId,
      txHash: mintResult.txHash
    });

  } catch (error) {
    console.error("Purchase Error:", error);
    res.status(500).json({ message: "Failed to mint ticket" });
  }
});

module.exports = router;