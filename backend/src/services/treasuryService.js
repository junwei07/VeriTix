const xrpl = require('xrpl');

const XRPL_SERVER =
  process.env.XRPL_SERVER || 'wss://s.altnet.rippletest.net:51233';
const TREASURY_SEED = process.env.TREASURY_SEED || '';
const TREASURY_SPONSOR_XRP = process.env.TREASURY_SPONSOR_XRP || '1.25';
const TREASURY_NFT_TAXON = Number(process.env.TREASURY_NFT_TAXON || 0);
const TREASURY_SUBMIT_ENABLED =
  process.env.TREASURY_SUBMIT_ENABLED === 'true';

let client;

const getClient = async () => {
  if (!client) {
    client = new xrpl.Client(XRPL_SERVER);
  }
  if (!client.isConnected()) {
    await client.connect();
  }
  return client;
};

const getTreasuryWallet = () => {
  if (!TREASURY_SEED) {
    throw new Error('TREASURY_SEED is not configured');
  }
  return xrpl.Wallet.fromSeed(TREASURY_SEED);
};

// Send XRP sponsorship from the treasury to a new wallet.
const fundNewUser = async (destination) => {
  const xrplClient = await getClient();
  const treasuryWallet = getTreasuryWallet();

  const tx = {
    TransactionType: 'Payment',
    Account: treasuryWallet.address,
    Destination: destination,
    Amount: xrpl.xrpToDrops(TREASURY_SPONSOR_XRP),
  };

  const prepared = await xrplClient.autofill(tx);
  const signed = treasuryWallet.sign(prepared);

  if (!TREASURY_SUBMIT_ENABLED) {
    return {
      submitted: false,
      txHash: xrpl.hashes.hashSignedTx(signed.tx_blob),
      signedTx: signed.tx_blob,
    };
  }

  const response = await xrplClient.submitAndWait(signed.tx_blob, {
    failHard: false,
  });
  return {
    submitted: true,
    txHash: response.result?.hash || xrpl.hashes.hashSignedTx(signed.tx_blob),
    result: response.result,
  };
};

const toHexUri = (uri) => {
  if (!uri) {
    return undefined;
  }
  const trimmed = uri.trim();
  if (!trimmed) {
    return undefined;
  }
  const isHex = /^[0-9A-Fa-f]+$/.test(trimmed);
  return isHex ? trimmed : xrpl.convertStringToHex(trimmed);
};

// Mint an NFToken directly to the buyer wallet.
const mintNftToUser = async ({ destination, uri, taxon }) => {
  const xrplClient = await getClient();
  const treasuryWallet = getTreasuryWallet();
  const parsedTaxon = Number(taxon);
  const nftTaxon = Number.isFinite(parsedTaxon) ? parsedTaxon : TREASURY_NFT_TAXON;

  const tx = {
    TransactionType: 'NFTokenMint',
    Account: treasuryWallet.address,
    Destination: destination,
    NFTokenTaxon: nftTaxon,
    Flags: xrpl.NFTokenMintFlags.tfTransferable,
  };

  const uriHex = toHexUri(uri);
  if (uriHex) {
    tx.URI = uriHex;
  }

  const prepared = await xrplClient.autofill(tx);
  const signed = treasuryWallet.sign(prepared);

  if (!TREASURY_SUBMIT_ENABLED) {
    return {
      submitted: false,
      txHash: xrpl.hashes.hashSignedTx(signed.tx_blob),
      signedTx: signed.tx_blob,
    };
  }

  const response = await xrplClient.submitAndWait(signed.tx_blob, {
    failHard: false,
  });
  const meta =
    response.result?.meta ||
    response.result?.metaData ||
    response.result?.meta_data;
  return {
    submitted: true,
    txHash: response.result?.hash || xrpl.hashes.hashSignedTx(signed.tx_blob),
    nftokenId: meta && meta.nftoken_id ? meta.nftoken_id : null,
    result: response.result,
  };
};

module.exports = {
  fundNewUser,
  getTreasuryWallet,
  mintNftToUser,
};
