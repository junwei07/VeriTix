const mongoose = require('mongoose');

// Event model tracks event lifecycle and oracle configuration for auto-refund system.
const eventSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    eventName: { type: String, required: true },
    organizer: { type: String, required: true },
    venue: { type: String },
    eventDate: { type: Date, required: true },

    // Oracle configuration for event status monitoring
    oracleAccount: { type: String, required: true },
    oracleDocumentId: { type: Number, required: true },

    // Event status from oracle
    status: {
      type: String,
      enum: ['scheduled', 'cancelled', 'completed', 'postponed'],
      default: 'scheduled',
      index: true
    },

    // Cancellation tracking
    cancelledAt: { type: Date },
    cancellationReason: { type: String },
    lastOracleCheck: { type: Date },
    oracleLastUpdateTime: { type: Number }, // Unix timestamp from oracle

    // Refund policy
    refundPolicy: {
      enabled: { type: Boolean, default: true },
      fullRefund: { type: Boolean, default: true },
      partialRefundPercentage: { type: Number, min: 0, max: 100 },
      refundDeadline: { type: Date }
    },

    metadata: { type: mongoose.Schema.Types.Mixed }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Event', eventSchema);
