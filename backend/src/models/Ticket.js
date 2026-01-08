const mongoose = require('mongoose');

// Core ticket metadata with XRPL NFT linkage and original price ceiling.
const ticketSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: true },
    eventName: { type: String, required: true },
    seat: { type: String },
    originalPriceDrops: { type: String, required: true },
    currentOwnerWallet: { type: String, required: true },
    issuerWallet: { type: String },
    nftokenId: { type: String, required: true, unique: true, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Ticket', ticketSchema);
