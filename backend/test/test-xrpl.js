require('dotenv').config();
const { createWallet, mintTicketNFT } = require('../src/services/xrplService');

async function runTest() {
  try {
    console.log("🚀 Starting XRPL Test...");

    // 1. Test Wallet Creation
    console.log("--- Step 1: Creating & Funding Wallet ---");
    const userWallet = await createWallet();
    console.log("✅ User Wallet Created:", userWallet.address);
    console.log("💰 Balance:", userWallet.balance, "XRP");

    // 2. Test NFT Minting (Soulbound)
    console.log("\n--- Step 2: Minting Soulbound Ticket ---");
    // For this test, use the user's own seed as the "issuer"
    const mintResult = await mintTicketNFT({
      issuerSeed: userWallet.seed, 
      uri: "https://veritix.com/metadata/ticket-123.json",
      taxon: 0
    });

    console.log("✅ NFT Minted!");
    console.log("🎫 TokenID:", mintResult.tokenId);
    console.log("🔗 TX Hash:", mintResult.txHash);

    process.exit(0);
  } catch (error) {
    console.error("❌ Test Failed:", error);
    process.exit(1);
  }
}

runTest();