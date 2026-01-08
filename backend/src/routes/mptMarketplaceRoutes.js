const express = require('express');

const requireWalletAuth = require('../middleware/requireWalletAuth');
const {
  createMptListing,
  getMptListing,
  listMptListings,
  prepareMptListing,
  prepareMptPurchase,
  purchaseMptListing,
} = require('../controllers/mptMarketplaceController');

// MPT marketplace endpoints with on-ledger OfferCreate swaps.
const router = express.Router();

router.post('/listings/prepare', requireWalletAuth, prepareMptListing);
router.post('/listings', requireWalletAuth, createMptListing);
router.get('/listings', listMptListings);
router.get('/listings/:id', getMptListing);
router.post('/listings/:id/purchase/prepare', requireWalletAuth, prepareMptPurchase);
router.post('/listings/:id/purchase', requireWalletAuth, purchaseMptListing);

module.exports = router;
