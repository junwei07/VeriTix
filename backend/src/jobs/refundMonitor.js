const cron = require('node-cron');
const oracleMonitorService = require('../services/oracleMonitorService');
const refundService = require('../services/refundService');

let isRunning = false;

/**
 * Main cron job: Check oracles and process refunds
 * Runs every 5 minutes
 */
const refundMonitorJob = cron.schedule('*/5 * * * *', async () => {
  if (isRunning) {
    console.log('Refund monitor already running, skipping...');
    return;
  }

  isRunning = true;
  const startTime = Date.now();

  try {
    console.log('=== Starting Refund Monitor ===');

    // Step 1: Check all event oracles for status updates
    console.log('Checking event oracles...');
    const monitorResults = await oracleMonitorService.monitorAllEvents();
    console.log('Oracle monitor results:', monitorResults);

    // Step 2: Process all pending refunds
    console.log('Processing pending refunds...');
    const refundResults = await refundService.processAllPendingRefunds();
    console.log('Refund processing results:', refundResults);

    const duration = Date.now() - startTime;
    console.log(`=== Refund Monitor Complete (${duration}ms) ===`);
  } catch (error) {
    console.error('Error in refund monitor:', error);
  } finally {
    isRunning = false;
  }
}, {
  scheduled: false // Don't start automatically
});

function startRefundMonitor() {
  console.log('Starting refund monitor cron job...');
  refundMonitorJob.start();
}

function stopRefundMonitor() {
  console.log('Stopping refund monitor cron job...');
  refundMonitorJob.stop();
}

module.exports = {
  startRefundMonitor,
  stopRefundMonitor
};
