const crypto = require('crypto');
const xrpl = require('xrpl');

const asyncHandler = require('../middleware/asyncHandler');
const HttpError = require('../utils/httpError');
const Payment = require('../models/Payment');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const treasuryService = require('../services/treasuryService');
const { toDrops } = require('../utils/xrp');

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
const STRIPE_WEBHOOK_TOLERANCE_SEC = Number(
  process.env.STRIPE_WEBHOOK_TOLERANCE_SEC || 300
);
const STRIPE_CURRENCY = (process.env.STRIPE_CURRENCY || 'sgd').toLowerCase();
const TICKET_TOKEN_STANDARD = (process.env.TICKET_TOKEN_STANDARD || 'mpt').toLowerCase();
const MPT_REQUIRE_VERIFIED = process.env.MPT_REQUIRE_VERIFIED !== 'false';
const MPT_REQUIRE_AUTH = process.env.MPT_REQUIRE_AUTH !== 'false';
const MPT_METADATA_VAULT_ENABLED =
  process.env.MPT_METADATA_VAULT_ENABLED === 'true';
const MPT_DEFAULT_AMOUNT = process.env.MPT_DEFAULT_AMOUNT || '1';

const parseStripeSignature = (header) => {
  const parts = header.split(',').map((part) => part.split('='));
  const timestamp = parts.find(([key]) => key === 't')?.[1];
  const signatures = parts
    .filter(([key]) => key === 'v1')
    .map(([, value]) => value);
  return { timestamp, signatures };
};

const verifyStripeSignature = (payload, header) => {
  if (!header) {
    throw new HttpError(401, 'Missing Stripe signature header');
  }
  const { timestamp, signatures } = parseStripeSignature(header);
  if (!timestamp || signatures.length === 0) {
    throw new HttpError(401, 'Invalid Stripe signature header');
  }
  const now = Math.floor(Date.now() / 1000);
  const age = Math.abs(now - Number(timestamp));
  if (Number.isNaN(age) || age > STRIPE_WEBHOOK_TOLERANCE_SEC) {
    throw new HttpError(401, 'Stripe signature timestamp out of tolerance');
  }

  const signedPayload = `${timestamp}.${payload}`;
  const expected = crypto
    .createHmac('sha256', STRIPE_WEBHOOK_SECRET)
    .update(signedPayload, 'utf8')
    .digest('hex');

  const expectedBuf = Buffer.from(expected, 'utf8');
  const valid = signatures.some((sig) => {
    const sigBuf = Buffer.from(sig, 'utf8');
    if (sigBuf.length !== expectedBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(sigBuf, expectedBuf);
  });

  if (!valid) {
    throw new HttpError(401, 'Stripe signature verification failed');
  }
};

const getStripeEvent = (req) => {
  if (!STRIPE_WEBHOOK_SECRET) {
    return req.body;
  }
  if (!req.rawBody) {
    throw new HttpError(400, 'Raw body is required for Stripe verification');
  }
  verifyStripeSignature(req.rawBody, req.header('stripe-signature'));
  try {
    return JSON.parse(req.rawBody);
  } catch (error) {
    throw new HttpError(400, 'Invalid Stripe payload');
  }
};

const extractMetadata = (payload) => ({
  wallet: payload.metadata?.wallet || payload.client_reference_id,
  eventId: payload.metadata?.eventId,
  eventName: payload.metadata?.eventName,
  seat: payload.metadata?.seat,
  originalPriceDrops: payload.metadata?.originalPriceDrops,
  originalPriceXrp: payload.metadata?.originalPriceXrp,
  nftUri: payload.metadata?.nftUri,
  nftTaxon: payload.metadata?.nftTaxon,
  mptMetadata: payload.metadata?.mptMetadata,
  mptIssuanceId: payload.metadata?.mptIssuanceId,
});

const buildNftTokenId = ({ mintedId, fallback }) => {
  if (mintedId) {
    return mintedId;
  }
  if (fallback) {
    return fallback;
  }
  return `pending:${Date.now()}`;
};

const buildMptIssuanceId = ({ issuedId, fallback, txHash }) => {
  if (issuedId) {
    return issuedId;
  }
  if (fallback) {
    return fallback;
  }
  if (txHash) {
    return `pending:${txHash}`;
  }
  return `pending:${Date.now()}`;
};

const buildTicketMetadata = ({ eventId, eventName, seat, priceDrops }) => ({
  eventId,
  eventName,
  seat,
  originalPriceDrops: priceDrops,
});

// Stripe webhook for primary sales and onboarding sponsorship.
const handleStripeWebhook = asyncHandler(async (req, res) => {
  const event = getStripeEvent(req);
  const type = event?.type || '';

  if (
    type !== 'checkout.session.completed' &&
    type !== 'payment_intent.succeeded'
  ) {
    return res.json({ received: true });
  }

  const payload = event.data?.object || {};
  if (type === 'checkout.session.completed' && payload.payment_status !== 'paid') {
    return res.json({ received: true, status: 'ignored' });
  }
  const currency = (payload.currency || '').toLowerCase();
  if (currency && currency !== STRIPE_CURRENCY) {
    throw new HttpError(400, `Unsupported currency: ${currency}`);
  }

  const {
    wallet,
    eventId,
    eventName,
    seat,
    originalPriceDrops,
    originalPriceXrp,
    nftUri,
    nftTaxon,
    mptMetadata,
    mptIssuanceId: metadataIssuanceId,
  } = extractMetadata(payload);

  if (!wallet) {
    throw new HttpError(400, 'wallet metadata is required');
  }
  if (!xrpl.isValidAddress(wallet)) {
    throw new HttpError(400, 'wallet metadata is invalid');
  }
  if (!eventId || !eventName) {
    throw new HttpError(400, 'eventId and eventName metadata are required');
  }

  const priceDrops =
    originalPriceDrops || (originalPriceXrp ? toDrops(originalPriceXrp) : null);
  if (!priceDrops) {
    throw new HttpError(400, 'originalPriceXrp or originalPriceDrops is required');
  }

  const stripeSessionId = payload.id;
  const stripePaymentIntentId = payload.payment_intent || payload.id;
  const amount =
    payload.amount_total ?? payload.amount_received ?? payload.amount;

  let payment = await Payment.findOne({
    $or: [{ stripeSessionId }, { stripePaymentIntentId }],
  });

  if (payment?.status === 'processed') {
    return res.json({ received: true, status: 'duplicate' });
  }

  if (!payment) {
    payment = await Payment.create({
      stripeSessionId,
      stripePaymentIntentId,
      wallet,
      amount,
      currency,
    });
  }

  let sponsorshipTxHash;
  let mintTxHash;
  let nftokenId;
  let mptIssuanceId;
  let mptAuthorizeTxHash;
  let mptTransferTxHash;
  let metadataVaultId;

  try {
    let user = await User.findOne({ wallet });
    if (!user) {
      const sponsorship = await treasuryService.fundNewUser(wallet);
      sponsorshipTxHash = sponsorship.txHash;
      user = await User.create({
        wallet,
        sponsoredAt: new Date(),
        sponsorshipTxHash,
      });
    }

    const treasuryWallet = treasuryService.getTreasuryWallet();
    const ticketMetadata =
      typeof mptMetadata === 'string'
        ? (() => {
            try {
              return JSON.parse(mptMetadata);
            } catch (_error) {
              return buildTicketMetadata({
                eventId,
                eventName,
                seat,
                priceDrops,
              });
            }
          })()
        : mptMetadata ||
          buildTicketMetadata({
            eventId,
            eventName,
            seat,
            priceDrops,
          });

    if (TICKET_TOKEN_STANDARD === 'mpt') {
      if (MPT_REQUIRE_VERIFIED && user.verificationStatus !== 'verified') {
        throw new HttpError(403, 'Wallet is not verified for MPT tickets');
      }

      const issuanceFlags = {
        tfMPTCanClawback: true,
        tfMPTCanTransfer: true,
        tfMPTCanEscrow: true,
        tfMPTRequireAuth: MPT_REQUIRE_AUTH,
      };

      const issuance = await treasuryService.createMptIssuance({
        metadata: ticketMetadata,
        maximumAmount: MPT_DEFAULT_AMOUNT,
        assetScale: 0,
        flags: issuanceFlags,
      });

      mptIssuanceId = buildMptIssuanceId({
        issuedId: issuance.mptIssuanceId,
        fallback: metadataIssuanceId,
        txHash: issuance.txHash,
      });

      if (MPT_REQUIRE_AUTH) {
        const authorizeResult = await treasuryService.authorizeMptHolder({
          mptIssuanceId,
          holder: wallet,
          authorize: true,
        });
        mptAuthorizeTxHash = authorizeResult.txHash;
      }

      const transferResult = await treasuryService.sendMptToUser({
        mptIssuanceId,
        destination: wallet,
        amount: MPT_DEFAULT_AMOUNT,
        credentialIds: user.credentialId ? [user.credentialId] : undefined,
      });
      mptTransferTxHash = transferResult.txHash;

      if (MPT_METADATA_VAULT_ENABLED) {
        const vault = await treasuryService.createMetadataVault({
          mptIssuanceId,
          metadata: ticketMetadata,
        });
        metadataVaultId = vault.vaultId;
      }

      const ticket = await Ticket.create({
        eventId,
        eventName,
        seat,
        originalPriceDrops: priceDrops,
        currentOwnerWallet: wallet,
        issuerWallet: treasuryWallet.address,
        tokenStandard: 'mpt',
        mptIssuanceId,
        mptAmount: MPT_DEFAULT_AMOUNT,
        metadata: ticketMetadata,
        metadataVaultId,
      });

      payment.status = 'processed';
      payment.sponsorshipTxHash = sponsorshipTxHash;
      payment.mptIssuanceId = mptIssuanceId;
      payment.mptAuthorizeTxHash = mptAuthorizeTxHash;
      payment.mptTransferTxHash = mptTransferTxHash;
      payment.metadataVaultId = metadataVaultId;
      payment.ticketId = ticket._id;
      await payment.save();
      return res.json({ received: true });
    }

    const mintResult = await treasuryService.mintNftToUser({
      destination: wallet,
      uri: nftUri,
      taxon: nftTaxon,
    });

    mintTxHash = mintResult.txHash;
    nftokenId = buildNftTokenId({
      mintedId: mintResult.nftokenId,
      fallback: payload.metadata?.nftokenId,
    });

    const ticket = await Ticket.create({
      eventId,
      eventName,
      seat,
      originalPriceDrops: priceDrops,
      currentOwnerWallet: wallet,
      issuerWallet: treasuryWallet.address,
      tokenStandard: 'nft',
      nftokenId,
      metadata: ticketMetadata,
    });

    payment.status = 'processed';
    payment.sponsorshipTxHash = sponsorshipTxHash;
    payment.mintTxHash = mintTxHash;
    payment.nftokenId = nftokenId;
    payment.ticketId = ticket._id;
    await payment.save();
  } catch (error) {
    payment.status = 'failed';
    payment.error = error.message;
    await payment.save();
    throw error;
  }

  return res.json({ received: true });
});

module.exports = {
  handleStripeWebhook,
};
