const Event = require('../models/Event');
const oracleService = require('./oracleService');
const refundService = require('./refundService');

/**
 * Check all active events for status updates from oracles
 * @returns {Promise<object>} Monitoring results summary
 */
async function monitorAllEvents() {
  const activeEvents = await Event.find({
    status: { $in: ['scheduled', 'postponed'] },
    'refundPolicy.enabled': true
  });

  const results = {
    total: activeEvents.length,
    checked: 0,
    cancelled: 0,
    errors: []
  };

  for (const event of activeEvents) {
    try {
      const statusChanged = await checkEventStatus(event);
      results.checked++;

      if (statusChanged && event.status === 'cancelled') {
        results.cancelled++;
      }
    } catch (error) {
      console.error(`Error monitoring event ${event.eventId}:`, error);
      results.errors.push({
        eventId: event.eventId,
        error: error.message
      });
    }
  }

  return results;
}

/**
 * Check a single event's status from oracle
 * @param {object} event - Event document
 * @returns {Promise<boolean>} True if status changed
 */
async function checkEventStatus(event) {
  try {
    const oracleData = await oracleService.getEventStatusFromOracle({
      oracleAccount: event.oracleAccount,
      oracleDocumentId: event.oracleDocumentId
    });

    if (!oracleData) {
      console.warn(`No oracle data found for event ${event.eventId}`);
      event.lastOracleCheck = new Date();
      await event.save();
      return false;
    }

    const previousStatus = event.status;
    const newStatus = oracleData.status;

    event.lastOracleCheck = new Date();
    event.oracleLastUpdateTime = oracleData.lastUpdateTime;

    // Check if status changed
    if (previousStatus !== newStatus) {
      console.log(`Event ${event.eventId} status changed: ${previousStatus} -> ${newStatus}`);

      event.status = newStatus;

      // If event was cancelled, trigger refunds
      if (newStatus === 'cancelled') {
        event.cancelledAt = new Date();
        await event.save();

        // Create refund records for all tickets
        await refundService.createRefundsForCancelledEvent(event.eventId);

        return true;
      }
    }

    await event.save();
    return previousStatus !== newStatus;
  } catch (error) {
    console.error(`Error checking event ${event.eventId}:`, error);
    throw error;
  }
}

module.exports = {
  monitorAllEvents,
  checkEventStatus
};
