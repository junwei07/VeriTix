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
    tokenStandard: {
      type: String,
      enum: ['nft', 'mpt'],
      default: 'nft',
      index: true,
    },
    sellerWallet: { type: String, required: true },
    priceDrops: { type: String, required: true },
    mptIssuanceId: { type: String },
    mptAmount: { type: String, default: '1' },
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
    refundStatus: {
      type: String,
      enum: ['not_refunded', 'refund_pending', 'refunded'],
      default: 'not_refunded',
    },
    refundId: { type: mongoose.Schema.Types.ObjectId, ref: 'Refund' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Listing', listingSchema);
