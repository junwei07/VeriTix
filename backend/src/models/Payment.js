const mongoose = require('mongoose');

// Primary-sale payment records for idempotency and audit.
const paymentSchema = new mongoose.Schema(
  {
    provider: { type: String, default: 'stripe' },
    stripeSessionId: { type: String, unique: true, sparse: true },
    stripePaymentIntentId: { type: String, unique: true, sparse: true },
    wallet: { type: String, required: true, index: true },
    amount: { type: Number },
    currency: { type: String },
    status: {
      type: String,
      enum: ['pending', 'processed', 'failed'],
      default: 'pending',
    },
    sponsorshipTxHash: { type: String },
    mintTxHash: { type: String },
    nftokenId: { type: String },
    ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' },
    error: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
