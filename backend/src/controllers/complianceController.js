const xrpl = require('xrpl');

const asyncHandler = require('../middleware/asyncHandler');
const HttpError = require('../utils/httpError');
const User = require('../models/User');
const treasuryService = require('../services/treasuryService');

const DEFAULT_CREDENTIAL_TYPE =
  process.env.VERIFIED_CREDENTIAL_TYPE || 'VerifiedAttendee';
const DEFAULT_CREDENTIAL_TYPE_HEX = process.env.VERIFIED_CREDENTIAL_TYPE_HEX;

const toCredentialTypeHex = (value) => {
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  const isHex = /^[0-9A-Fa-f]+$/.test(trimmed);
  return isHex ? trimmed : xrpl.convertStringToHex(trimmed);
};

// Mark a wallet as verified and optionally issue a credential on-ledger.
const verifyWallet = asyncHandler(async (req, res) => {
  const { wallet, singpassId, issueCredential = true, credentialType } = req.body;
  if (!wallet) {
    throw new HttpError(400, 'wallet is required');
  }
  if (!xrpl.isValidAddress(wallet)) {
    throw new HttpError(400, 'wallet is invalid');
  }

  const credentialTypeHex =
    toCredentialTypeHex(credentialType) ||
    toCredentialTypeHex(DEFAULT_CREDENTIAL_TYPE_HEX) ||
    toCredentialTypeHex(DEFAULT_CREDENTIAL_TYPE);

  let credentialTxHash = null;
  if (issueCredential && credentialTypeHex) {
    const issued = await treasuryService.createCredential({
      subject: wallet,
      credentialTypeHex,
    });
    credentialTxHash = issued.txHash;
  }

  const user = await User.findOneAndUpdate(
    { wallet },
    {
      wallet,
      verificationStatus: 'verified',
      verifiedAt: new Date(),
      singpassId: singpassId || undefined,
      credentialTypeHex,
    },
    { upsert: true, new: true }
  );

  res.json({
    wallet: user.wallet,
    verificationStatus: user.verificationStatus,
    credentialTypeHex,
    credentialTxHash,
  });
});

// Prepare a CredentialAccept transaction for the user to sign.
const prepareCredentialAccept = asyncHandler(async (req, res) => {
  const { wallet } = req.body;
  if (!wallet) {
    throw new HttpError(400, 'wallet is required');
  }

  const user = await User.findOne({ wallet });
  if (!user || !user.credentialTypeHex) {
    throw new HttpError(404, 'No credential issued for this wallet');
  }

  const issuer = treasuryService.getTreasuryWallet().address;
  const tx = await treasuryService.prepareCredentialAccept({
    holder: wallet,
    issuer,
    credentialTypeHex: user.credentialTypeHex,
  });

  res.json({ tx });
});

// Revoke a wallet verification status.
const revokeWallet = asyncHandler(async (req, res) => {
  const { wallet } = req.body;
  if (!wallet) {
    throw new HttpError(400, 'wallet is required');
  }

  const user = await User.findOneAndUpdate(
    { wallet },
    { verificationStatus: 'revoked' },
    { new: true }
  );

  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  res.json({ wallet: user.wallet, verificationStatus: user.verificationStatus });
});

module.exports = {
  prepareCredentialAccept,
  revokeWallet,
  verifyWallet,
};
