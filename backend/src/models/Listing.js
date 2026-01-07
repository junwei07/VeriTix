const mongoose = require('mongoose');

// Off-ledger listing record that mirrors XRPL offer intent and status.
const listingSchema = new mongoose.Schema(
  {
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ticket',
      required: true,
      index: true,
    },
    sellerWallet: { type: String, required: true },
    priceDrops: { type: String, required: true },
    status: {
      type: String,
      enum: ['active', 'sold', 'cancelled'],
      default: 'active',
      index: true,
    },
    xrplTxHash: { type: String },
    xrplOfferId: { type: String },
    lastPriceUpdateTxHash: { type: String },
    cancelTxHash: { type: String },
    purchaseTxHash: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Listing', listingSchema);
