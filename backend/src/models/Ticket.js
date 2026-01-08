const mongoose = require('mongoose');

// Core ticket metadata with XRPL token linkage and original price ceiling.
const ticketSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: true },
    eventName: { type: String, required: true },
    seat: { type: String },
    originalPriceDrops: { type: String, required: true },
    currentOwnerWallet: { type: String, required: true },
    issuerWallet: { type: String },
    tokenStandard: {
      type: String,
      enum: ['nft', 'mpt'],
      default: 'nft',
      index: true,
    },
    nftokenId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
      required: function requireNftId() {
        return this.tokenStandard === 'nft';
      },
    },
    mptIssuanceId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
      required: function requireMptId() {
        return this.tokenStandard === 'mpt';
      },
    },
    mptAmount: { type: String, default: '1' },
    metadata: { type: mongoose.Schema.Types.Mixed },
    metadataVersion: { type: Number, default: 1 },
    metadataVaultId: { type: String },
    status: {
      type: String,
      enum: ['active', 'clawed_back', 'revoked'],
      default: 'active',
    },
    refundStatus: {
      type: String,
      enum: ['not_refunded', 'refund_pending', 'refunded', 'refund_failed'],
      default: 'not_refunded',
      index: true,
    },
    refundId: { type: mongoose.Schema.Types.ObjectId, ref: 'Refund' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Ticket', ticketSchema);
