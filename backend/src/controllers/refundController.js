const Refund = require('../models/Refund');
const asyncHandler = require('../middleware/asyncHandler');
const HttpError = require('../utils/httpError');
const refundService = require('../services/refundService');

// List all refunds
const listRefunds = asyncHandler(async (req, res) => {
  const { status, eventId, wallet } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (eventId) filter.eventId = eventId;
  if (wallet) filter.recipientWallet = wallet;

  const refunds = await Refund.find(filter)
    .populate('ticketId')
    .populate('originalPaymentId')
    .populate('originalListingId')
    .sort({ createdAt: -1 });

  res.json(refunds);
});

// Get single refund
const getRefund = asyncHandler(async (req, res) => {
  const refund = await Refund.findById(req.params.id)
    .populate('ticketId')
    .populate('originalPaymentId')
    .populate('originalListingId');

  if (!refund) {
    throw new HttpError(404, 'Refund not found');
  }

  res.json(refund);
});

// Manually retry a failed refund
const retryRefund = asyncHandler(async (req, res) => {
  const refund = await refundService.processRefund(req.params.id);
  res.json(refund);
});

// Get refunds for a specific wallet
const getWalletRefunds = asyncHandler(async (req, res) => {
  const { wallet } = req.params;

  const refunds = await Refund.find({ recipientWallet: wallet })
    .populate('ticketId')
    .sort({ createdAt: -1 });

  res.json(refunds);
});

module.exports = {
  listRefunds,
  getRefund,
  retryRefund,
  getWalletRefunds
};
