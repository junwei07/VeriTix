const xrpl = require('xrpl');

const Listing = require('../models/Listing');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');
const HttpError = require('../utils/httpError');
const { ensureLessOrEqualDrops, toDrops } = require('../utils/xrp');
const { decodeSignedTx, assertMptBuyOfferTx, assertMptSellOfferTx } = require('../utils/xrplTx');
const { prepareTransaction, submitSignedTransaction } = require('../services/xrplService');
const treasuryService = require('../services/treasuryService');

const XRPL_SUBMIT_ENABLED = process.env.XRPL_SUBMIT_ENABLED === 'true';
const MPT_REQUIRE_VERIFIED = process.env.MPT_REQUIRE_VERIFIED !== 'false';
const MPT_REQUIRE_AUTH = process.env.MPT_REQUIRE_AUTH !== 'false';

const prepareMptListing = asyncHandler(async (req, res) => {
  const { ticketId, priceXrp, sellerWallet: bodySellerWallet } = req.body;
  const sellerWallet = req.wallet || bodySellerWallet;
  if (!ticketId || !priceXrp || !sellerWallet) {
    throw new HttpError(400, 'ticketId, priceXrp, and sellerWallet are required');
  }
  if (bodySellerWallet && sellerWallet !== bodySellerWallet) {
    throw new HttpError(400, 'sellerWallet does not match authenticated wallet');
  }

  const ticket = await Ticket.findById(ticketId);
  if (!ticket) {
    throw new HttpError(404, 'Ticket not found');
  }
  if (ticket.tokenStandard !== 'mpt') {
    throw new HttpError(400, 'Ticket is not an MPT token');
  }
  if (ticket.currentOwnerWallet !== sellerWallet) {
    throw new HttpError(403, 'sellerWallet does not own this ticket');
  }

  const priceDrops = toDrops(priceXrp);
  ensureLessOrEqualDrops(
    priceDrops,
    ticket.originalPriceDrops,
    'Listing price exceeds original ticket price'
  );

  const tx = {
    TransactionType: 'OfferCreate',
    Account: sellerWallet,
    TakerGets: {
      mpt_issuance_id: ticket.mptIssuanceId,
      value: String(ticket.mptAmount || '1'),
    },
    TakerPays: priceDrops,
    Flags: xrpl.OfferCreateFlags.tfSell,
  };

  const prepared = await prepareTransaction(tx);
  res.json({ tx: prepared });
});

const createMptListing = asyncHandler(async (req, res) => {
  const { ticketId, priceXrp, sellerWallet: bodySellerWallet, signedTx } = req.body;
  const sellerWallet = req.wallet || bodySellerWallet;
  if (!ticketId || !priceXrp || !sellerWallet) {
    throw new HttpError(400, 'ticketId, priceXrp, and sellerWallet are required');
  }
  if (bodySellerWallet && sellerWallet !== bodySellerWallet) {
    throw new HttpError(400, 'sellerWallet does not match authenticated wallet');
  }
  if (XRPL_SUBMIT_ENABLED && !signedTx) {
    throw new HttpError(400, 'signedTx is required when XRPL_SUBMIT_ENABLED=true');
  }

  const ticket = await Ticket.findById(ticketId);
  if (!ticket) {
    throw new HttpError(404, 'Ticket not found');
  }
  if (ticket.tokenStandard !== 'mpt') {
    throw new HttpError(400, 'Ticket is not an MPT token');
  }
  if (ticket.currentOwnerWallet !== sellerWallet) {
    throw new HttpError(403, 'sellerWallet does not own this ticket');
  }

  const existing = await Listing.findOne({ ticket: ticketId, status: 'active' });
  if (existing) {
    throw new HttpError(409, 'Ticket already has an active listing');
  }

  const priceDrops = toDrops(priceXrp);
  ensureLessOrEqualDrops(
    priceDrops,
    ticket.originalPriceDrops,
    'Listing price exceeds original ticket price'
  );

  let ledger = null;
  let offerId = null;
  if (signedTx) {
    const decoded = decodeSignedTx(signedTx);
    assertMptSellOfferTx(decoded, {
      sellerWallet,
      mptIssuanceId: ticket.mptIssuanceId,
      mptAmount: String(ticket.mptAmount || '1'),
      priceDrops,
    });
    offerId = xrpl.hashes.hashOfferId(decoded.Account, decoded.Sequence);
    ledger = await submitSignedTransaction(signedTx);
  }

  const listing = await Listing.create({
    ticket: ticket._id,
    tokenStandard: 'mpt',
    sellerWallet,
    priceDrops,
    mptIssuanceId: ticket.mptIssuanceId,
    mptAmount: ticket.mptAmount || '1',
    status: 'active',
    xrplTxHash: ledger ? ledger.txHash : null,
    xrplOfferId: offerId || (ledger ? ledger.offerId : null),
  });

  res.status(201).json(listing);
});

const listMptListings = asyncHandler(async (req, res) => {
  const status = req.query.status || 'active';
  const listings = await Listing.find({
    status,
    tokenStandard: 'mpt',
  })
    .populate('ticket')
    .sort({ createdAt: -1 });
  res.json(listings);
});

const getMptListing = asyncHandler(async (req, res) => {
  const listing = await Listing.findById(req.params.id).populate('ticket');
  if (!listing || listing.tokenStandard !== 'mpt') {
    throw new HttpError(404, 'Listing not found');
  }
  res.json(listing);
});

const prepareMptPurchase = asyncHandler(async (req, res) => {
  const { buyerWallet: bodyBuyerWallet } = req.body;
  const buyerWallet = req.wallet || bodyBuyerWallet;
  if (!buyerWallet) {
    throw new HttpError(400, 'buyerWallet is required');
  }
  if (bodyBuyerWallet && buyerWallet !== bodyBuyerWallet) {
    throw new HttpError(400, 'buyerWallet does not match authenticated wallet');
  }

  const listing = await Listing.findById(req.params.id).populate('ticket');
  if (!listing || listing.tokenStandard !== 'mpt') {
    throw new HttpError(404, 'Listing not found');
  }
  if (listing.status !== 'active') {
    throw new HttpError(400, 'Only active listings can be purchased');
  }

  if (MPT_REQUIRE_VERIFIED) {
    const user = await User.findOne({ wallet: buyerWallet });
    if (!user || user.verificationStatus !== 'verified') {
      throw new HttpError(403, 'buyerWallet is not verified');
    }
  }

  if (MPT_REQUIRE_AUTH) {
    await treasuryService.authorizeMptHolder({
      mptIssuanceId: listing.mptIssuanceId,
      holder: buyerWallet,
      authorize: true,
    });
  }

  const tx = {
    TransactionType: 'OfferCreate',
    Account: buyerWallet,
    TakerGets: String(listing.priceDrops),
    TakerPays: {
      mpt_issuance_id: listing.mptIssuanceId,
      value: String(listing.mptAmount || '1'),
    },
    Flags: xrpl.OfferCreateFlags.tfImmediateOrCancel,
  };

  const prepared = await prepareTransaction(tx);
  res.json({ tx: prepared });
});

const purchaseMptListing = asyncHandler(async (req, res) => {
  const { buyerWallet: bodyBuyerWallet, signedTx } = req.body;
  const buyerWallet = req.wallet || bodyBuyerWallet;
  if (!buyerWallet) {
    throw new HttpError(400, 'buyerWallet is required');
  }
  if (bodyBuyerWallet && buyerWallet !== bodyBuyerWallet) {
    throw new HttpError(400, 'buyerWallet does not match authenticated wallet');
  }
  if (XRPL_SUBMIT_ENABLED && !signedTx) {
    throw new HttpError(400, 'signedTx is required when XRPL_SUBMIT_ENABLED=true');
  }

  const listing = await Listing.findById(req.params.id).populate('ticket');
  if (!listing || listing.tokenStandard !== 'mpt') {
    throw new HttpError(404, 'Listing not found');
  }
  if (listing.status !== 'active') {
    throw new HttpError(400, 'Only active listings can be purchased');
  }

  if (MPT_REQUIRE_VERIFIED) {
    const user = await User.findOne({ wallet: buyerWallet });
    if (!user || user.verificationStatus !== 'verified') {
      throw new HttpError(403, 'buyerWallet is not verified');
    }
  }

  let ledger = null;
  if (signedTx) {
    const decoded = decodeSignedTx(signedTx);
    assertMptBuyOfferTx(decoded, {
      buyerWallet,
      mptIssuanceId: listing.mptIssuanceId,
      mptAmount: String(listing.mptAmount || '1'),
      priceDrops: String(listing.priceDrops),
    });
    ledger = await submitSignedTransaction(signedTx);
  }

  listing.status = 'sold';
  listing.purchaseTxHash = ledger ? ledger.txHash : listing.purchaseTxHash;
  await listing.save();

  await Ticket.findByIdAndUpdate(listing.ticket, {
    currentOwnerWallet: buyerWallet,
  });

  res.json(listing);
});

module.exports = {
  createMptListing,
  getMptListing,
  listMptListings,
  prepareMptListing,
  prepareMptPurchase,
  purchaseMptListing,
};
