const Listing = require('../models/Listing');
const Ticket = require('../models/Ticket');
const asyncHandler = require('../middleware/asyncHandler');
const HttpError = require('../utils/httpError');
const { ensureLessOrEqualDrops, toDrops } = require('../utils/xrp');
const {
  assertNftAcceptOfferTx,
  assertNftCancelOfferTx,
  assertNftSellOfferTx,
  decodeSignedTx,
} = require('../utils/xrplTx');
const { prepareSellOffer, submitSignedTransaction } = require('../services/xrplService');

// Marketplace flows enforce the original price ceiling and XRPL offer validation.
const XRPL_SUBMIT_ENABLED = process.env.XRPL_SUBMIT_ENABLED === 'true';

const prepareListing = asyncHandler(async (req, res) => {
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
  if (ticket.tokenStandard === 'mpt') {
    throw new HttpError(400, 'MPT tickets must be listed via MPT marketplace');
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

  const tx = await prepareSellOffer({
    sellerWallet,
    nftokenId: ticket.nftokenId,
    amountDrops: priceDrops,
  });

  res.json({ tx });
});

const createListing = asyncHandler(async (req, res) => {
  const {
    ticketId,
    priceXrp,
    sellerWallet: bodySellerWallet,
    signedTx,
  } = req.body;
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
  if (ticket.tokenStandard === 'mpt') {
    throw new HttpError(400, 'MPT tickets must be listed via MPT marketplace');
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
  if (signedTx) {
    const decoded = decodeSignedTx(signedTx);
    assertNftSellOfferTx(decoded, {
      sellerWallet,
      nftokenId: ticket.nftokenId,
      amountDrops: priceDrops,
    });
    ledger = await submitSignedTransaction(signedTx);
  }

  const listing = await Listing.create({
    ticket: ticket._id,
    sellerWallet,
    priceDrops,
    status: 'active',
    xrplTxHash: ledger ? ledger.txHash : null,
    xrplOfferId: ledger ? ledger.offerId : null,
  });

  res.status(201).json(listing);
});

const listListings = asyncHandler(async (req, res) => {
  const status = req.query.status || 'active';
  const listings = await Listing.find(status ? { status } : {})
    .populate('ticket')
    .sort({ createdAt: -1 });
  res.json(listings);
});

const getListing = asyncHandler(async (req, res) => {
  const listing = await Listing.findById(req.params.id).populate('ticket');
  if (!listing) {
    throw new HttpError(404, 'Listing not found');
  }
  res.json(listing);
});

const updateListingPrice = asyncHandler(async (req, res) => {
  const {
    newPriceXrp,
    sellerWallet: bodySellerWallet,
    signedTx,
    cancelSignedTx,
  } = req.body;
  const sellerWallet = req.wallet || bodySellerWallet;
  if (!newPriceXrp || !sellerWallet) {
    throw new HttpError(400, 'newPriceXrp and sellerWallet are required');
  }
  if (bodySellerWallet && sellerWallet !== bodySellerWallet) {
    throw new HttpError(400, 'sellerWallet does not match authenticated wallet');
  }
  if (XRPL_SUBMIT_ENABLED && !signedTx) {
    throw new HttpError(400, 'signedTx is required when XRPL_SUBMIT_ENABLED=true');
  }

  const listing = await Listing.findById(req.params.id);
  if (!listing) {
    throw new HttpError(404, 'Listing not found');
  }
  if (listing.status !== 'active') {
    throw new HttpError(400, 'Only active listings can be updated');
  }
  if (listing.sellerWallet !== sellerWallet) {
    throw new HttpError(403, 'sellerWallet does not own this listing');
  }

  const ticket = await Ticket.findById(listing.ticket);
  if (!ticket) {
    throw new HttpError(404, 'Ticket not found');
  }

  const newPriceDrops = toDrops(newPriceXrp);
  ensureLessOrEqualDrops(
    newPriceDrops,
    ticket.originalPriceDrops,
    'Listing price exceeds original ticket price'
  );
  ensureLessOrEqualDrops(
    newPriceDrops,
    listing.priceDrops,
    'New price must be less than or equal to current price'
  );

  if (XRPL_SUBMIT_ENABLED && listing.xrplOfferId && !cancelSignedTx) {
    throw new HttpError(400, 'cancelSignedTx is required to replace an on-ledger offer');
  }

  let cancelLedger = null;
  // XRPL price changes require cancel + recreate of the sell offer.
  if (cancelSignedTx) {
    if (!listing.xrplOfferId) {
      throw new HttpError(400, 'Listing does not have an offer id to cancel');
    }
    const decodedCancel = decodeSignedTx(cancelSignedTx);
    assertNftCancelOfferTx(decodedCancel, {
      sellerWallet,
      offerId: listing.xrplOfferId,
    });
    cancelLedger = await submitSignedTransaction(cancelSignedTx);
  }

  let createLedger = null;
  if (signedTx) {
    const decodedCreate = decodeSignedTx(signedTx);
    assertNftSellOfferTx(decodedCreate, {
      sellerWallet,
      nftokenId: ticket.nftokenId,
      amountDrops: newPriceDrops,
    });
    createLedger = await submitSignedTransaction(signedTx);
  }

  listing.priceDrops = newPriceDrops;
  if (createLedger) {
    listing.lastPriceUpdateTxHash = createLedger.txHash;
    listing.xrplOfferId = createLedger.offerId || listing.xrplOfferId;
  }
  if (cancelLedger) {
    listing.cancelTxHash = cancelLedger.txHash;
  }

  await listing.save();
  res.json(listing);
});

const cancelListing = asyncHandler(async (req, res) => {
  const { sellerWallet: bodySellerWallet, signedTx } = req.body;
  const sellerWallet = req.wallet || bodySellerWallet;
  if (!sellerWallet) {
    throw new HttpError(400, 'sellerWallet is required');
  }
  if (bodySellerWallet && sellerWallet !== bodySellerWallet) {
    throw new HttpError(400, 'sellerWallet does not match authenticated wallet');
  }

  const listing = await Listing.findById(req.params.id);
  if (!listing) {
    throw new HttpError(404, 'Listing not found');
  }
  if (listing.status !== 'active') {
    throw new HttpError(400, 'Only active listings can be cancelled');
  }
  if (listing.sellerWallet !== sellerWallet) {
    throw new HttpError(403, 'sellerWallet does not own this listing');
  }
  if (XRPL_SUBMIT_ENABLED && !signedTx) {
    throw new HttpError(400, 'signedTx is required when XRPL_SUBMIT_ENABLED=true');
  }

  let ledger = null;
  if (signedTx) {
    if (!listing.xrplOfferId) {
      throw new HttpError(400, 'Listing does not have an offer id to cancel');
    }
    const decoded = decodeSignedTx(signedTx);
    assertNftCancelOfferTx(decoded, {
      sellerWallet,
      offerId: listing.xrplOfferId,
    });
    ledger = await submitSignedTransaction(signedTx);
  }

  listing.status = 'cancelled';
  listing.cancelTxHash = ledger ? ledger.txHash : listing.cancelTxHash;
  await listing.save();

  res.json(listing);
});

const purchaseListing = asyncHandler(async (req, res) => {
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

  const listing = await Listing.findById(req.params.id);
  if (!listing) {
    throw new HttpError(404, 'Listing not found');
  }
  if (listing.status !== 'active') {
    throw new HttpError(400, 'Only active listings can be purchased');
  }
  if (!listing.xrplOfferId) {
    throw new HttpError(400, 'Listing does not have an offer id to accept');
  }

  let ledger = null;
  if (signedTx) {
    const decoded = decodeSignedTx(signedTx);
    assertNftAcceptOfferTx(decoded, {
      buyerWallet,
      offerId: listing.xrplOfferId,
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
  cancelListing,
  createListing,
  getListing,
  listListings,
  prepareListing,
  purchaseListing,
  updateListingPrice,
};
