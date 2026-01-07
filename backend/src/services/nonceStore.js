const crypto = require('crypto');

const NONCE_TTL_MS = Number(process.env.AUTH_NONCE_TTL_MS || 5 * 60 * 1000);
const nonces = new Map();

const cleanup = () => {
  const now = Date.now();
  for (const [nonce, record] of nonces.entries()) {
    if (record.expiresAt <= now) {
      nonces.delete(nonce);
    }
  }
};

// Issue short-lived nonces for wallet signature challenges.
const issueNonce = (wallet) => {
  cleanup();
  const nonce = crypto.randomBytes(16).toString('hex');
  const expiresAt = Date.now() + NONCE_TTL_MS;
  nonces.set(nonce, { wallet, expiresAt });
  return { nonce, expiresAt };
};

const isNonceValid = (wallet, nonce) => {
  cleanup();
  const record = nonces.get(nonce);
  if (!record) {
    return false;
  }
  return record.wallet === wallet && record.expiresAt > Date.now();
};

const consumeNonce = (wallet, nonce) => {
  if (!isNonceValid(wallet, nonce)) {
    return false;
  }
  nonces.delete(nonce);
  return true;
};

module.exports = {
  consumeNonce,
  isNonceValid,
  issueNonce,
};
