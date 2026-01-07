const express = require('express');
const {
  cancelListing,
  createListing,
  getListing,
  listListings,
  prepareListing,
  purchaseListing,
  updateListingPrice,
} = require('../controllers/marketplaceController');
const requireWalletAuth = require('../middleware/requireWalletAuth');

// Marketplace endpoints for listing lifecycle and XRPL offer actions.
const router = express.Router();

router.post('/listings/prepare', requireWalletAuth, prepareListing);
router.post('/listings', requireWalletAuth, createListing);
router.get('/listings', listListings);
router.get('/listings/:id', getListing);
router.patch('/listings/:id/price', requireWalletAuth, updateListingPrice);
router.post('/listings/:id/cancel', requireWalletAuth, cancelListing);
router.post('/listings/:id/purchase', requireWalletAuth, purchaseListing);

module.exports = router;
