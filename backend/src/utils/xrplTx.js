const xrpl = require('xrpl');

// Decode and validate XRPL signed transactions against expected listing intent.
const decodeSignedTx = (signedTx) => {
  try {
    return xrpl.decode(signedTx);
  } catch (error) {
    throw new Error('signedTx is not valid XRPL transaction hex');
  }
};

// Validate a signed NFTokenCreateOffer for a specific ticket and price.
const assertNftSellOfferTx = (decoded, { sellerWallet, nftokenId, amountDrops }) => {
  if (decoded.TransactionType !== 'NFTokenCreateOffer') {
    throw new Error('signedTx must be NFTokenCreateOffer');
  }
  if (decoded.Account !== sellerWallet) {
    throw new Error('signedTx Account does not match sellerWallet');
  }
  if (decoded.NFTokenID !== nftokenId) {
    throw new Error('signedTx NFTokenID does not match ticket');
  }
  if (decoded.Amount !== amountDrops) {
    throw new Error('signedTx Amount does not match listing price');
  }
  const flags = Number(decoded.Flags || 0);
  if ((flags & xrpl.NFTokenCreateOfferFlags.tfSellNFToken) === 0) {
    throw new Error('signedTx must include tfSellNFToken flag');
  }
};

// Validate a signed NFTokenCancelOffer for a specific offer id.
const assertNftCancelOfferTx = (decoded, { sellerWallet, offerId }) => {
  if (decoded.TransactionType !== 'NFTokenCancelOffer') {
    throw new Error('signedTx must be NFTokenCancelOffer');
  }
  if (decoded.Account !== sellerWallet) {
    throw new Error('signedTx Account does not match sellerWallet');
  }
  if (!Array.isArray(decoded.NFTokenOffers)) {
    throw new Error('signedTx NFTokenOffers must be an array');
  }
  if (!decoded.NFTokenOffers.includes(offerId)) {
    throw new Error('signedTx does not cancel the expected offer');
  }
};

// Validate a signed NFTokenAcceptOffer for the listing's sell offer.
const assertNftAcceptOfferTx = (decoded, { buyerWallet, offerId }) => {
  if (decoded.TransactionType !== 'NFTokenAcceptOffer') {
    throw new Error('signedTx must be NFTokenAcceptOffer');
  }
  if (decoded.Account !== buyerWallet) {
    throw new Error('signedTx Account does not match buyerWallet');
  }
  if (decoded.NFTokenSellOffer !== offerId) {
    throw new Error('signedTx NFTokenSellOffer does not match listing');
  }
};

const assertMptSellOfferTx = (
  decoded,
  { sellerWallet, mptIssuanceId, mptAmount, priceDrops }
) => {
  if (decoded.TransactionType !== 'OfferCreate') {
    throw new Error('signedTx must be OfferCreate');
  }
  if (decoded.Account !== sellerWallet) {
    throw new Error('signedTx Account does not match sellerWallet');
  }
  const takerGets = decoded.TakerGets;
  if (!takerGets || typeof takerGets !== 'object') {
    throw new Error('signedTx TakerGets must be MPT amount');
  }
  if (takerGets.mpt_issuance_id !== mptIssuanceId) {
    throw new Error('signedTx MPT issuance does not match ticket');
  }
  if (String(takerGets.value) !== String(mptAmount)) {
    throw new Error('signedTx MPT amount does not match ticket');
  }
  if (String(decoded.TakerPays) !== String(priceDrops)) {
    throw new Error('signedTx TakerPays does not match listing price');
  }
  const flags = Number(decoded.Flags || 0);
  if ((flags & xrpl.OfferCreateFlags.tfSell) === 0) {
    throw new Error('signedTx must include tfSell flag');
  }
};

const assertMptBuyOfferTx = (
  decoded,
  { buyerWallet, mptIssuanceId, mptAmount, priceDrops }
) => {
  if (decoded.TransactionType !== 'OfferCreate') {
    throw new Error('signedTx must be OfferCreate');
  }
  if (decoded.Account !== buyerWallet) {
    throw new Error('signedTx Account does not match buyerWallet');
  }
  if (String(decoded.TakerGets) !== String(priceDrops)) {
    throw new Error('signedTx TakerGets does not match listing price');
  }
  const takerPays = decoded.TakerPays;
  if (!takerPays || typeof takerPays !== 'object') {
    throw new Error('signedTx TakerPays must be MPT amount');
  }
  if (takerPays.mpt_issuance_id !== mptIssuanceId) {
    throw new Error('signedTx MPT issuance does not match listing');
  }
  if (String(takerPays.value) !== String(mptAmount)) {
    throw new Error('signedTx MPT amount does not match listing');
  }
};

module.exports = {
  assertNftAcceptOfferTx,
  assertNftCancelOfferTx,
  assertNftSellOfferTx,
  assertMptBuyOfferTx,
  assertMptSellOfferTx,
  decodeSignedTx,
};
