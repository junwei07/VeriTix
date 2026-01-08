const mongoose = require('mongoose');

// Wallet-level state for sponsorship and onboarding tracking.
const userSchema = new mongoose.Schema(
  {
    wallet: { type: String, required: true, unique: true, index: true },
    sponsoredAt: { type: Date },
    sponsorshipTxHash: { type: String },
    verificationStatus: {
      type: String,
      enum: ['unverified', 'verified', 'revoked'],
      default: 'unverified',
      index: true,
    },
    verifiedAt: { type: Date },
    singpassId: { type: String },
    credentialTypeHex: { type: String },
    credentialId: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
