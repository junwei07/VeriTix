const xrpl = require('xrpl');

const HttpError = require('../utils/httpError');
const nonceStore = require('../services/nonceStore');

const AUTH_REQUIRED = process.env.AUTH_REQUIRED !== 'false';

// Verify wallet ownership using a signed challenge message.
const requireWalletAuth = (req, _res, next) => {
  try {
    if (!AUTH_REQUIRED) {
      const fallbackWallet = req.body.sellerWallet || req.body.buyerWallet;
      if (fallbackWallet) {
        req.wallet = fallbackWallet;
      }
      return next();
    }

    const wallet = (req.header('x-wallet') || '').trim();
    const publicKey = (req.header('x-public-key') || '').trim();
    const signature = (req.header('x-signature') || '').trim();
    const nonce = (req.header('x-nonce') || '').trim();

    if (!wallet || !publicKey || !signature || !nonce) {
      throw new HttpError(401, 'Wallet auth headers are required');
    }
    if (!xrpl.isValidAddress(wallet)) {
      throw new HttpError(400, 'Wallet address is invalid');
    }
    if (!nonceStore.isNonceValid(wallet, nonce)) {
      throw new HttpError(401, 'Nonce is invalid or expired');
    }

    const message = `VeriTixAuth:${wallet}:${nonce}`;
    const messageHex = xrpl.convertStringToHex(message);
    const isValidSignature = xrpl.verifyKeypairSignature(
      messageHex,
      signature,
      publicKey
    );
    if (!isValidSignature) {
      throw new HttpError(401, 'Signature verification failed');
    }

    const derivedAddress = xrpl.deriveAddress(publicKey);
    if (derivedAddress !== wallet) {
      throw new HttpError(401, 'Public key does not match wallet address');
    }

    nonceStore.consumeNonce(wallet, nonce);
    req.wallet = wallet;
    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = requireWalletAuth;
