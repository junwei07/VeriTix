const asyncHandler = require('../middleware/asyncHandler');
const HttpError = require('../utils/httpError');
const Ticket = require('../models/Ticket');
const treasuryService = require('../services/treasuryService');

const MPT_METADATA_VAULT_ENABLED =
  process.env.MPT_METADATA_VAULT_ENABLED === 'true';
const MPT_REQUIRE_AUTH = process.env.MPT_REQUIRE_AUTH !== 'false';

// Force clawback of an MPT ticket and optionally refund the original price.
const clawbackTicket = asyncHandler(async (req, res) => {
  const { ticketId, holderWallet, refund = true } = req.body;
  if (!ticketId) {
    throw new HttpError(400, 'ticketId is required');
  }

  const ticket = await Ticket.findById(ticketId);
  if (!ticket) {
    throw new HttpError(404, 'Ticket not found');
  }
  if (ticket.tokenStandard !== 'mpt') {
    throw new HttpError(400, 'Only MPT tickets support clawback');
  }

  const holder = holderWallet || ticket.currentOwnerWallet;
  if (!holder) {
    throw new HttpError(400, 'holderWallet is required');
  }

  const clawback = await treasuryService.clawbackMpt({
    mptIssuanceId: ticket.mptIssuanceId,
    holder,
    amount: ticket.mptAmount || '1',
  });

  let refundTx = null;
  if (refund) {
    refundTx = await treasuryService.refundXrp({
      destination: holder,
      amountDrops: ticket.originalPriceDrops,
    });
  }

  ticket.status = 'clawed_back';
  await ticket.save();

  res.json({
    clawbackTxHash: clawback.txHash,
    refundTxHash: refundTx ? refundTx.txHash : null,
  });
});

// Authorize or unauthorize a holder for an MPT ticket issuance.
const authorizeTicketHolder = asyncHandler(async (req, res) => {
  const { ticketId, holderWallet, authorize = true } = req.body;
  if (!ticketId || !holderWallet) {
    throw new HttpError(400, 'ticketId and holderWallet are required');
  }

  const ticket = await Ticket.findById(ticketId);
  if (!ticket) {
    throw new HttpError(404, 'Ticket not found');
  }
  if (ticket.tokenStandard !== 'mpt') {
    throw new HttpError(400, 'Only MPT tickets support authorization');
  }
  if (!MPT_REQUIRE_AUTH) {
    throw new HttpError(400, 'MPT authorization is disabled by config');
  }

  const result = await treasuryService.authorizeMptHolder({
    mptIssuanceId: ticket.mptIssuanceId,
    holder: holderWallet,
    authorize,
  });

  res.json({ txHash: result.txHash });
});

// Update on-chain metadata vault (if enabled) and persist the latest metadata.
const updateTicketMetadata = asyncHandler(async (req, res) => {
  const { ticketId, metadata } = req.body;
  if (!ticketId || !metadata) {
    throw new HttpError(400, 'ticketId and metadata are required');
  }

  const ticket = await Ticket.findById(ticketId);
  if (!ticket) {
    throw new HttpError(404, 'Ticket not found');
  }
  if (ticket.tokenStandard !== 'mpt') {
    throw new HttpError(400, 'Only MPT tickets support metadata updates');
  }

  let vaultId = ticket.metadataVaultId;
  if (MPT_METADATA_VAULT_ENABLED && !vaultId) {
    const vault = await treasuryService.createMetadataVault({
      mptIssuanceId: ticket.mptIssuanceId,
      metadata,
    });
    vaultId = vault.vaultId;
    ticket.metadataVaultId = vaultId;
  }

  if (MPT_METADATA_VAULT_ENABLED && vaultId) {
    await treasuryService.updateMetadataVault({
      vaultId,
      metadata,
    });
  }

  ticket.metadata = metadata;
  ticket.metadataVersion = (ticket.metadataVersion || 1) + 1;
  await ticket.save();

  res.json({ metadataVersion: ticket.metadataVersion, vaultId });
});

module.exports = {
  authorizeTicketHolder,
  clawbackTicket,
  updateTicketMetadata,
};
