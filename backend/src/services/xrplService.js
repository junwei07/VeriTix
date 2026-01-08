const xrpl = require("xrpl");

// XRPL websocket endpoint (defaults to public testnet).
const XRPL_SERVER =
  process.env.XRPL_SERVER ||
  process.env.XRPL_NETWORK_URL ||
  "wss://s.altnet.rippletest.net:51233";
const XRPL_SUBMIT_ENABLED = process.env.XRPL_SUBMIT_ENABLED === "true";

let _client = null;

async function getClient() {
  if (_client && _client.isConnected()) return _client;
  _client = new xrpl.Client(XRPL_SERVER);
  await _client.connect();
  return _client;
}

async function disconnectClient() {
  if (_client && _client.isConnected()) {
    await _client.disconnect();
  }
  _client = null;
}

function extractNFTokenIDFromMeta(meta) {
  if (!meta || !Array.isArray(meta.AffectedNodes)) return null;

  for (const node of meta.AffectedNodes) {
    const created = node.CreatedNode;
    const modified = node.ModifiedNode;

    // On mint, the NFToken is typically added to an NFTokenPage
    const candidate = created || modified;
    if (!candidate) continue;
    if (candidate.LedgerEntryType !== "NFTokenPage") continue;

    const newFields = candidate.NewFields;
    const finalFields = candidate.FinalFields;
    const tokens =
      (newFields && newFields.NFTokens) ||
      (finalFields && finalFields.NFTokens);
    if (!Array.isArray(tokens) || tokens.length === 0) continue;

    for (const t of tokens) {
      const id = t?.NFToken?.NFTokenID;
      if (id) return id;
    }
  }

  return null;
}

async function prepareTransaction(tx) {
  const client = await getClient();
  return client.autofill(tx);
}

async function prepareSellOffer({ sellerWallet, nftokenId, amountDrops }) {
  const client = await getClient();
  const tx = {
    TransactionType: "NFTokenCreateOffer",
    Account: sellerWallet,
    NFTokenID: nftokenId,
    Amount: amountDrops,
    Flags: xrpl.NFTokenCreateOfferFlags.tfSellNFToken,
  };
  return client.autofill(tx);
}

async function submitSignedTransaction(signedTx) {
  const txHash = xrpl.hashes.hashSignedTx(signedTx);
  if (!XRPL_SUBMIT_ENABLED) {
    return {
      submitted: false,
      txHash,
      offerId: null,
      result: null,
    };
  }
  const client = await getClient();
  const response = await client.submitAndWait(signedTx, { failHard: false });
  const result = response.result || response;
  const meta = result.meta || result.metaData || result.meta_data;
  const offerId = meta && meta.offer_id ? meta.offer_id : null;
  return {
    submitted: true,
    txHash: result.hash || txHash,
    offerId,
    result,
  };
}

/**
 * Connects to XRPL Testnet and funds a new wallet using the Testnet faucet.
 * @returns {Promise<{address: string, seed: string, balance: string}>}
 */
async function createWallet() {
  const client = await getClient();
  const { wallet, balance } = await client.fundWallet();

  return {
    address: wallet.classicAddress,
    seed: wallet.seed,
    balance: String(balance),
  };
}

/**
 * Mints a soulbound (non-transferable) XLS-20 NFT and marks it burnable.
 *
 * Soulbound: do NOT set tfTransferable.
 * Burnable: set tfBurnable.
 *
 * @param {object} params
 * @param {string} params.issuerSeed - Issuer wallet seed (s...).
 * @param {string} params.uri - NFT URI (will be hex-encoded for the tx).
 * @param {number} [params.taxon=0] - NFTokenTaxon value.
 * @returns {Promise<{tokenId: string|null, txHash: string, result: any}>}
 */
async function mintTicketNFT({ issuerSeed, uri, taxon = 0 }) {
  if (!issuerSeed) throw new Error("mintTicketNFT: issuerSeed is required");
  if (!uri) throw new Error("mintTicketNFT: uri is required");

  const client = await getClient();
  const issuerWallet = xrpl.Wallet.fromSeed(issuerSeed);

  const tx = {
    TransactionType: "NFTokenMint",
    Account: issuerWallet.classicAddress,
    URI: xrpl.convertStringToHex(uri),
    NFTokenTaxon: taxon,
    Flags: xrpl.NFTokenMintFlags.tfBurnable, // do NOT include tfTransferable => soulbound
  };

  const submit = await client.submitAndWait(tx, { wallet: issuerWallet });
  const meta = submit?.result?.meta;
  const tokenId = extractNFTokenIDFromMeta(meta);

  return {
    tokenId,
    txHash: submit?.result?.hash,
    result: submit,
  };
}

module.exports = {
  createWallet,
  mintTicketNFT,
  prepareSellOffer,
  prepareTransaction,
  getClient,
  // Optional utility; not required by your prompt but handy for graceful shutdowns/tests.
  disconnectClient,
  submitSignedTransaction,
};
