const xrpl = require('xrpl');

const XRPL_SERVER =
  process.env.XRPL_SERVER || 'wss://s.altnet.rippletest.net:51233';
const TREASURY_SEED = process.env.TREASURY_SEED || '';
const TREASURY_SPONSOR_XRP = process.env.TREASURY_SPONSOR_XRP || '1.25';
const TREASURY_NFT_TAXON = Number(process.env.TREASURY_NFT_TAXON || 0);
const TREASURY_MPT_DEFAULT_AMOUNT = process.env.MPT_DEFAULT_AMOUNT || '1';
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

const toHexMetadata = (metadata) => {
  if (!metadata) {
    return undefined;
  }
  if (typeof metadata === 'string') {
    const trimmed = metadata.trim();
    if (!trimmed) {
      return undefined;
    }
    const isHex = /^[0-9A-Fa-f]+$/.test(trimmed);
    return isHex ? trimmed : xrpl.convertStringToHex(trimmed);
  }
  return xrpl.convertStringToHex(JSON.stringify(metadata));
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
    Flags: xrpl.NFTokenMintFlags.tfTransferable | xrpl.NFTokenMintFlags.tfBurnable,
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

// Burn an NFToken (for refunds after event cancellation).
const burnNft = async ({ nftokenId, owner }) => {
  const xrplClient = await getClient();
  const treasuryWallet = getTreasuryWallet();

  const tx = {
    TransactionType: 'NFTokenBurn',
    Account: treasuryWallet.address,
    NFTokenID: nftokenId,
  };

  // If owner is different from issuer, specify the owner
  if (owner && owner !== treasuryWallet.address) {
    tx.Owner = owner;
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

  return {
    submitted: true,
    txHash: response.result?.hash || xrpl.hashes.hashSignedTx(signed.tx_blob),
    result: response.result,
  };
};

const createMptIssuance = async ({
  metadata,
  maximumAmount = TREASURY_MPT_DEFAULT_AMOUNT,
  assetScale = 0,
  transferFee,
  flags = {},
}) => {
  const xrplClient = await getClient();
  const treasuryWallet = getTreasuryWallet();

  const tx = {
    TransactionType: 'MPTokenIssuanceCreate',
    Account: treasuryWallet.address,
    MaximumAmount: String(maximumAmount),
    AssetScale: Number(assetScale),
    Flags: flags,
  };

  if (transferFee !== undefined && transferFee !== null) {
    tx.TransferFee = Number(transferFee);
  }

  const metadataHex = toHexMetadata(metadata);
  if (metadataHex) {
    tx.MPTokenMetadata = metadataHex;
  }

  const prepared = await xrplClient.autofill(tx);
  const signed = treasuryWallet.sign(prepared);

  if (!TREASURY_SUBMIT_ENABLED) {
    return {
      submitted: false,
      txHash: xrpl.hashes.hashSignedTx(signed.tx_blob),
      signedTx: signed.tx_blob,
      mptIssuanceId: null,
      sequence: prepared.Sequence,
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
    mptIssuanceId: meta && meta.mpt_issuance_id ? meta.mpt_issuance_id : null,
    result: response.result,
    sequence: prepared.Sequence,
  };
};

const authorizeMptHolder = async ({ mptIssuanceId, holder, authorize = true }) => {
  const xrplClient = await getClient();
  const treasuryWallet = getTreasuryWallet();

  const tx = {
    TransactionType: 'MPTokenAuthorize',
    Account: treasuryWallet.address,
    MPTokenIssuanceID: mptIssuanceId,
    Holder: holder,
  };

  if (!authorize) {
    tx.Flags = xrpl.MPTokenAuthorizeFlags.tfMPTUnauthorize;
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
  return {
    submitted: true,
    txHash: response.result?.hash || xrpl.hashes.hashSignedTx(signed.tx_blob),
    result: response.result,
  };
};

const sendMptToUser = async ({
  mptIssuanceId,
  destination,
  amount = TREASURY_MPT_DEFAULT_AMOUNT,
  credentialIds,
  domainId,
}) => {
  const xrplClient = await getClient();
  const treasuryWallet = getTreasuryWallet();

  const tx = {
    TransactionType: 'Payment',
    Account: treasuryWallet.address,
    Destination: destination,
    Amount: {
      mpt_issuance_id: mptIssuanceId,
      value: String(amount),
    },
  };

  if (Array.isArray(credentialIds) && credentialIds.length > 0) {
    tx.CredentialIDs = credentialIds;
  }
  if (domainId) {
    tx.DomainID = domainId;
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
  return {
    submitted: true,
    txHash: response.result?.hash || xrpl.hashes.hashSignedTx(signed.tx_blob),
    result: response.result,
  };
};

const clawbackMpt = async ({
  mptIssuanceId,
  holder,
  amount = TREASURY_MPT_DEFAULT_AMOUNT,
}) => {
  const xrplClient = await getClient();
  const treasuryWallet = getTreasuryWallet();

  const tx = {
    TransactionType: 'Clawback',
    Account: treasuryWallet.address,
    Holder: holder,
    Amount: {
      mpt_issuance_id: mptIssuanceId,
      value: String(amount),
    },
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

const refundXrp = async ({ destination, amountDrops }) => {
  const xrplClient = await getClient();
  const treasuryWallet = getTreasuryWallet();

  const tx = {
    TransactionType: 'Payment',
    Account: treasuryWallet.address,
    Destination: destination,
    Amount: String(amountDrops),
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

const createCredential = async ({
  subject,
  credentialTypeHex,
  expiration,
  uri,
}) => {
  const xrplClient = await getClient();
  const treasuryWallet = getTreasuryWallet();

  const tx = {
    TransactionType: 'CredentialCreate',
    Account: treasuryWallet.address,
    Subject: subject,
    CredentialType: credentialTypeHex,
  };

  if (expiration) {
    tx.Expiration = Number(expiration);
  }

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
  return {
    submitted: true,
    txHash: response.result?.hash || xrpl.hashes.hashSignedTx(signed.tx_blob),
    result: response.result,
  };
};

const prepareCredentialAccept = async ({ holder, issuer, credentialTypeHex }) => {
  const xrplClient = await getClient();

  const tx = {
    TransactionType: 'CredentialAccept',
    Account: holder,
    Issuer: issuer,
    CredentialType: credentialTypeHex,
  };

  return xrplClient.autofill(tx);
};

const createMetadataVault = async ({
  mptIssuanceId,
  metadata,
}) => {
  const xrplClient = await getClient();
  const treasuryWallet = getTreasuryWallet();

  const tx = {
    TransactionType: 'VaultCreate',
    Account: treasuryWallet.address,
    Asset: {
      mpt_issuance_id: mptIssuanceId,
    },
  };

  const metadataHex = toHexMetadata(metadata);
  if (metadataHex) {
    tx.Data = metadataHex;
  }

  const prepared = await xrplClient.autofill(tx);
  const vaultId = xrpl.hashes.hashVault(
    treasuryWallet.address,
    prepared.Sequence
  );
  const signed = treasuryWallet.sign(prepared);

  if (!TREASURY_SUBMIT_ENABLED) {
    return {
      submitted: false,
      txHash: xrpl.hashes.hashSignedTx(signed.tx_blob),
      signedTx: signed.tx_blob,
      vaultId,
    };
  }

  const response = await xrplClient.submitAndWait(signed.tx_blob, {
    failHard: false,
  });
  return {
    submitted: true,
    txHash: response.result?.hash || xrpl.hashes.hashSignedTx(signed.tx_blob),
    vaultId,
    result: response.result,
  };
};

const updateMetadataVault = async ({ vaultId, metadata }) => {
  const xrplClient = await getClient();
  const treasuryWallet = getTreasuryWallet();

  const tx = {
    TransactionType: 'VaultSet',
    Account: treasuryWallet.address,
    VaultID: vaultId,
  };

  const metadataHex = toHexMetadata(metadata);
  if (metadataHex) {
    tx.Data = metadataHex;
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
  return {
    submitted: true,
    txHash: response.result?.hash || xrpl.hashes.hashSignedTx(signed.tx_blob),
    result: response.result,
  };
};

module.exports = {
  fundNewUser,
  getTreasuryWallet,
  mintNftToUser,
  burnNft,
  authorizeMptHolder,
  clawbackMpt,
  createCredential,
  createMetadataVault,
  createMptIssuance,
  prepareCredentialAccept,
  refundXrp,
  refundXrpToBuyer: refundXrp, // Alias for clarity in refund context
  sendMptToUser,
  updateMetadataVault,
};
