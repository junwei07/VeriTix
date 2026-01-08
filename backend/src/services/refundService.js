const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Refund = require('../models/Refund');
const Ticket = require('../models/Ticket');
const Payment = require('../models/Payment');
const Listing = require('../models/Listing');
const Event = require('../models/Event');
const treasuryService = require('./treasuryService');

const MAX_RETRY_ATTEMPTS = 3;

/**
 * Create refund records for all tickets of a cancelled event
 * @param {string} eventId - Event ID to create refunds for
 * @returns {Promise<Array>} Created refund records
 */
async function createRefundsForCancelledEvent(eventId) {
  const event = await Event.findOne({ eventId });
  if (!event) {
    throw new Error(`Event ${eventId} not found`);
  }

  if (event.status !== 'cancelled') {
    throw new Error(`Event ${eventId} is not cancelled`);
  }

  // Find all active tickets for this event that haven't been refunded
  const tickets = await Ticket.find({
    eventId,
    status: 'active',
    refundStatus: 'not_refunded'
  });

  const refunds = [];

  for (const ticket of tickets) {
    try {
      // Determine refund type and amount
      const refundData = await determineRefundDetails(ticket);

      // Create refund record
      const refund = await Refund.create({
        ticketId: ticket._id,
        eventId: ticket.eventId,
        originalPaymentId: refundData.paymentId,
        originalListingId: refundData.listingId,
        refundType: refundData.refundType,
        recipientWallet: refundData.recipientWallet,
        originalPriceDrops: ticket.originalPriceDrops,
        refundAmountDrops: refundData.refundAmountDrops,
        refundAmountFiat: refundData.refundAmountFiat,
        refundCurrency: refundData.refundCurrency,
        status: 'pending'
      });

      // Update ticket status
      ticket.refundStatus = 'refund_pending';
      ticket.refundId = refund._id;
      await ticket.save();

      refunds.push(refund);
    } catch (error) {
      console.error(`Error creating refund for ticket ${ticket._id}:`, error);
      // Continue processing other tickets even if one fails
    }
  }

  return refunds;
}

/**
 * Determine refund details based on purchase history
 * @param {object} ticket - Ticket document
 * @returns {Promise<object>} Refund details
 */
async function determineRefundDetails(ticket) {
  // Check if this was a secondary sale (look for sold listing)
  const soldListing = await Listing.findOne({
    ticket: ticket._id,
    status: 'sold'
  }).sort({ updatedAt: -1 });

  if (soldListing) {
    // Secondary sale - refund in XRP to current owner
    return {
      refundType: 'secondary_sale',
      refundAmountDrops: soldListing.priceDrops,
      recipientWallet: ticket.currentOwnerWallet,
      listingId: soldListing._id,
      paymentId: null,
      refundAmountFiat: null,
      refundCurrency: null
    };
  } else {
    // Primary sale - refund via Stripe to original buyer
    const payment = await Payment.findOne({
      ticketId: ticket._id,
      status: 'processed'
    });

    if (!payment) {
      throw new Error(`No payment record found for ticket ${ticket._id}`);
    }

    return {
      refundType: 'primary_sale',
      refundAmountDrops: ticket.originalPriceDrops,
      refundAmountFiat: payment.amount,
      refundCurrency: payment.currency,
      recipientWallet: ticket.currentOwnerWallet,
      paymentId: payment._id,
      listingId: null
    };
  }
}

/**
 * Process a single refund
 * @param {string} refundId - Refund ID to process
 * @returns {Promise<object>} Updated refund record
 */
async function processRefund(refundId) {
  const refund = await Refund.findById(refundId)
    .populate('ticketId')
    .populate('originalPaymentId');

  if (!refund) {
    throw new Error(`Refund ${refundId} not found`);
  }

  if (refund.status !== 'pending' && refund.status !== 'failed') {
    throw new Error(`Refund ${refundId} is not in pending/failed status`);
  }

  if (refund.retryCount >= MAX_RETRY_ATTEMPTS) {
    throw new Error(`Refund ${refundId} has exceeded max retry attempts`);
  }

  refund.status = 'processing';
  refund.retryCount += 1;
  refund.lastRetryAt = new Date();
  await refund.save();

  try {
    // Process refund based on type
    if (refund.refundType === 'primary_sale') {
      await processPrimarySaleRefund(refund);
    } else {
      await processSecondarySaleRefund(refund);
    }

    // Burn the NFT
    await burnTicketNft(refund);

    // Mark refund as completed
    refund.status = 'completed';
    refund.completedAt = new Date();
    await refund.save();

    // Update ticket status
    await Ticket.findByIdAndUpdate(refund.ticketId, {
      status: 'clawed_back',
      refundStatus: 'refunded'
    });

    return refund;
  } catch (error) {
    console.error(`Error processing refund ${refundId}:`, error);

    refund.status = 'failed';
    refund.error = error.message;
    await refund.save();

    throw error;
  }
}

/**
 * Process primary sale refund via Stripe
 * @param {object} refund - Refund document (populated with originalPaymentId)
 * @returns {Promise<object>} Stripe refund result
 */
async function processPrimarySaleRefund(refund) {
  const payment = refund.originalPaymentId;

  if (!payment || !payment.stripePaymentIntentId) {
    throw new Error('No Stripe payment intent found');
  }

  const stripeRefund = await stripe.refunds.create({
    payment_intent: payment.stripePaymentIntentId,
    amount: refund.refundAmountFiat,
    reason: 'requested_by_customer',
    metadata: {
      refundId: refund._id.toString(),
      ticketId: refund.ticketId._id.toString(),
      eventId: refund.eventId
    }
  });

  refund.stripeRefundId = stripeRefund.id;
  refund.stripeRefundStatus = stripeRefund.status;
  await refund.save();

  return stripeRefund;
}

/**
 * Process secondary sale refund via XRP payment
 * @param {object} refund - Refund document
 * @returns {Promise<object>} XRP payment result
 */
async function processSecondarySaleRefund(refund) {
  const result = await treasuryService.refundXrpToBuyer({
    destination: refund.recipientWallet,
    amountDrops: refund.refundAmountDrops
  });

  refund.xrpPaymentTxHash = result.txHash;
  await refund.save();

  return result;
}

/**
 * Burn the NFT after refund
 * @param {object} refund - Refund document (populated with ticketId)
 * @returns {Promise<object>} NFT burn result
 */
async function burnTicketNft(refund) {
  const ticket = refund.ticketId;

  const result = await treasuryService.burnNft({
    nftokenId: ticket.nftokenId,
    owner: ticket.currentOwnerWallet
  });

  refund.nftBurnTxHash = result.txHash;
  await refund.save();

  return result;
}

/**
 * Process all pending refunds
 * @returns {Promise<object>} Processing results summary
 */
async function processAllPendingRefunds() {
  const pendingRefunds = await Refund.find({
    status: { $in: ['pending', 'failed'] },
    retryCount: { $lt: MAX_RETRY_ATTEMPTS }
  }).limit(100);

  const results = {
    total: pendingRefunds.length,
    succeeded: 0,
    failed: 0,
    errors: []
  };

  for (const refund of pendingRefunds) {
    try {
      await processRefund(refund._id);
      results.succeeded++;
    } catch (error) {
      results.failed++;
      results.errors.push({
        refundId: refund._id,
        error: error.message
      });
    }
  }

  return results;
}

module.exports = {
  createRefundsForCancelledEvent,
  processRefund,
  processAllPendingRefunds,
  determineRefundDetails
};
