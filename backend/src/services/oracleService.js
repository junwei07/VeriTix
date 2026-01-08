const xrpl = require('xrpl');

// Import getClient from xrplService
let getClient;
try {
  const xrplService = require('./xrplService');
  getClient = xrplService.getClient;
} catch (error) {
  // Fallback: create our own client if needed
  const XRPL_SERVER = process.env.XRPL_SERVER || 'wss://s.altnet.rippletest.net:51233';
  let client;
  getClient = async () => {
    if (!client) {
      client = new xrpl.Client(XRPL_SERVER);
    }
    if (!client.isConnected()) {
      await client.connect();
    }
    return client;
  };
}

/**
 * Read oracle data for an event from XRPL
 * @param {object} params
 * @param {string} params.oracleAccount - XRPL account publishing oracle data
 * @param {number} params.oracleDocumentId - Oracle document ID
 * @returns {Promise<{status: string, eventId: string, lastUpdateTime: number, provider: string}|null>}
 */
async function getEventStatusFromOracle({ oracleAccount, oracleDocumentId }) {
  const client = await getClient();

  try {
    const request = {
      command: 'ledger_entry',
      oracle: {
        account: oracleAccount,
        oracle_document_id: oracleDocumentId
      }
    };

    const response = await client.request(request);
    const oracle = response.result.node;

    if (!oracle) {
      return null;
    }

    // Parse price data series to extract event status
    // Format: BaseAsset = 'EVENT_STATUS', QuoteAsset = eventId, AssetPrice = status code
    const statusData = oracle.PriceDataSeries?.find(
      data => data.PriceData?.BaseAsset === 'EVENT_STATUS'
    );

    if (!statusData) {
      return null;
    }

    return {
      status: parseEventStatus(statusData.PriceData.AssetPrice),
      eventId: statusData.PriceData.QuoteAsset,
      lastUpdateTime: oracle.LastUpdateTime,
      provider: oracle.Provider
    };
  } catch (error) {
    console.error('Error reading oracle:', error);
    throw error;
  }
}

/**
 * Convert numeric status code to string
 * @param {number|string} statusCode
 * @returns {string}
 */
function parseEventStatus(statusCode) {
  const statusMap = {
    0: 'scheduled',
    1: 'cancelled',
    2: 'completed',
    3: 'postponed'
  };

  return statusMap[Number(statusCode)] || 'scheduled';
}

/**
 * Publish event status to oracle (for event organizers/admin)
 * @param {object} params
 * @param {string} params.issuerSeed - Oracle issuer wallet seed
 * @param {number} params.oracleDocumentId - Oracle document ID
 * @param {string} params.eventId - Event ID to publish status for
 * @param {string} params.status - Event status: 'scheduled' | 'cancelled' | 'completed' | 'postponed'
 * @param {string} [params.provider] - Oracle provider name
 * @param {string} [params.assetClass='EVENT'] - Asset class for the oracle
 * @returns {Promise<{txHash: string, result: any}>}
 */
async function publishEventStatus({
  issuerSeed,
  oracleDocumentId,
  eventId,
  status,
  provider,
  assetClass = 'EVENT'
}) {
  const client = await getClient();
  const wallet = xrpl.Wallet.fromSeed(issuerSeed);

  const statusCode = {
    'scheduled': 0,
    'cancelled': 1,
    'completed': 2,
    'postponed': 3
  }[status] || 0;

  const tx = {
    TransactionType: 'OracleSet',
    Account: wallet.address,
    OracleDocumentID: oracleDocumentId,
    LastUpdateTime: Math.floor(Date.now() / 1000),
    PriceDataSeries: [
      {
        PriceData: {
          BaseAsset: 'EVENT_STATUS',
          QuoteAsset: eventId,
          AssetPrice: statusCode,
          Scale: 0
        }
      }
    ]
  };

  // Include Provider and AssetClass if creating new oracle
  if (provider) {
    tx.Provider = provider;
  }
  if (assetClass) {
    tx.AssetClass = assetClass;
  }

  const prepared = await client.autofill(tx);
  const signed = wallet.sign(prepared);
  const response = await client.submitAndWait(signed.tx_blob);

  return {
    txHash: response.result.hash,
    result: response.result
  };
}

module.exports = {
  getEventStatusFromOracle,
  publishEventStatus,
  parseEventStatus
};
