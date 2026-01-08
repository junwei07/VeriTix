const xrpl = require('xrpl');

const asyncHandler = require('../middleware/asyncHandler');
const HttpError = require('../utils/httpError');
const nonceStore = require('../services/nonceStore');

// Provide a nonce and message for wallet signature authentication.
const issueNonce = asyncHandler(async (req, res) => {
  const { wallet } = req.body;
  if (!wallet) {
    throw new HttpError(400, 'wallet is required');
  }
  if (!xrpl.isValidAddress(wallet)) {
    throw new HttpError(400, 'wallet is invalid');
  }

  const { nonce, expiresAt } = nonceStore.issueNonce(wallet);
  const message = `VeriTixAuth:${wallet}:${nonce}`;

  res.json({ wallet, nonce, expiresAt, message });
});

module.exports = {
  issueNonce,
};
