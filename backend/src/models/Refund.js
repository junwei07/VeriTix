const mongoose = require('mongoose');

// Refund model tracks all refund transactions for cancelled events.
const refundSchema = new mongoose.Schema(
  {
    ticketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ticket',
      required: true,
      index: true
    },
    eventId: { type: String, required: true, index: true },

    // Original purchase info
    originalPaymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment'
    },
    originalListingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing'
    },

    // Refund type
    refundType: {
      type: String,
      enum: ['primary_sale', 'secondary_sale'],
      required: true,
      index: true
    },

    // Recipient
    recipientWallet: { type: String, required: true },

    // Amounts
    originalPriceDrops: { type: String, required: true },
    refundAmountDrops: { type: String, required: true },
    refundAmountFiat: { type: Number }, // For Stripe refunds
    refundCurrency: { type: String }, // For Stripe refunds

    // Status tracking
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
      default: 'pending',
      index: true
    },

    // Execution tracking
    stripeRefundId: { type: String },
    stripeRefundStatus: { type: String },
    xrpPaymentTxHash: { type: String },
    nftBurnTxHash: { type: String },

    // Error handling
    error: { type: String },
    retryCount: { type: Number, default: 0 },
    lastRetryAt: { type: Date },

    // Processing timestamps
    processedAt: { type: Date },
    completedAt: { type: Date }
  },
  { timestamps: true }
);

// Ensure we don't double-refund the same ticket
refundSchema.index({ ticketId: 1 }, { unique: true });

module.exports = mongoose.model('Refund', refundSchema);
