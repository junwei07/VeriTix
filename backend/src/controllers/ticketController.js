const Ticket = require('../models/Ticket');
const HttpError = require('../utils/httpError');
const asyncHandler = require('../middleware/asyncHandler');
const { toDrops } = require('../utils/xrp');

// Basic ticket CRUD used to seed marketplace listings.
const createTicket = asyncHandler(async (req, res) => {
  const {
    eventId,
    eventName,
    seat,
    originalPriceXrp,
    currentOwnerWallet,
    issuerWallet,
    nftokenId,
    mptIssuanceId,
    mptAmount,
    tokenStandard = 'nft',
  } = req.body;

  if (!eventId || !eventName || !originalPriceXrp || !currentOwnerWallet) {
    throw new HttpError(400, 'eventId, eventName, originalPriceXrp, and currentOwnerWallet are required');
  }
  if (tokenStandard === 'nft' && !nftokenId) {
    throw new HttpError(400, 'nftokenId is required for nft tickets');
  }
  if (tokenStandard === 'mpt' && !mptIssuanceId) {
    throw new HttpError(400, 'mptIssuanceId is required for mpt tickets');
  }

  const originalPriceDrops = toDrops(originalPriceXrp);

  const existing = tokenStandard === 'mpt'
    ? await Ticket.findOne({ mptIssuanceId })
    : await Ticket.findOne({ nftokenId });
  if (existing) {
    throw new HttpError(409, 'Ticket already exists for token identifier');
  }

  const ticket = await Ticket.create({
    eventId,
    eventName,
    seat,
    originalPriceDrops,
    currentOwnerWallet,
    issuerWallet,
    tokenStandard,
    nftokenId,
    mptIssuanceId,
    mptAmount,
  });

  res.status(201).json(ticket);
});

const getTicket = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) {
    throw new HttpError(404, 'Ticket not found');
  }
  res.json(ticket);
});

const listTickets = asyncHandler(async (_req, res) => {
  const tickets = await Ticket.find().sort({ createdAt: -1 });
  res.json(tickets);
});

module.exports = {
  createTicket,
  getTicket,
  listTickets,
};
