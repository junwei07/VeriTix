const Event = require('../models/Event');
const asyncHandler = require('../middleware/asyncHandler');
const HttpError = require('../utils/httpError');
const oracleService = require('../services/oracleService');
const refundService = require('../services/refundService');

// Create a new event
const createEvent = asyncHandler(async (req, res) => {
  const {
    eventId,
    eventName,
    organizer,
    venue,
    eventDate,
    oracleAccount,
    oracleDocumentId,
    refundPolicy
  } = req.body;

  if (!eventId || !eventName || !organizer || !eventDate) {
    throw new HttpError(400, 'Missing required fields: eventId, eventName, organizer, eventDate');
  }

  if (!oracleAccount || oracleDocumentId === undefined) {
    throw new HttpError(400, 'Oracle configuration required: oracleAccount, oracleDocumentId');
  }

  const existingEvent = await Event.findOne({ eventId });
  if (existingEvent) {
    throw new HttpError(409, 'Event already exists');
  }

  const event = await Event.create({
    eventId,
    eventName,
    organizer,
    venue,
    eventDate,
    oracleAccount,
    oracleDocumentId,
    refundPolicy: refundPolicy || {}
  });

  res.status(201).json(event);
});

// Get all events
const listEvents = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = status ? { status } : {};

  const events = await Event.find(filter).sort({ eventDate: 1 });
  res.json(events);
});

// Get single event
const getEvent = asyncHandler(async (req, res) => {
  const event = await Event.findOne({ eventId: req.params.eventId });

  if (!event) {
    throw new HttpError(404, 'Event not found');
  }

  res.json(event);
});

// Update event status (admin/organizer)
const updateEventStatus = asyncHandler(async (req, res) => {
  const { status, cancellationReason } = req.body;

  if (!status) {
    throw new HttpError(400, 'Status is required');
  }

  const event = await Event.findOne({ eventId: req.params.eventId });
  if (!event) {
    throw new HttpError(404, 'Event not found');
  }

  const oldStatus = event.status;
  event.status = status;

  if (status === 'cancelled') {
    event.cancelledAt = new Date();
    event.cancellationReason = cancellationReason;
  }

  await event.save();

  // If newly cancelled, create refunds
  if (oldStatus !== 'cancelled' && status === 'cancelled') {
    const refunds = await refundService.createRefundsForCancelledEvent(event.eventId);
    res.json({
      event,
      refundsCreated: refunds.length
    });
  } else {
    res.json(event);
  }
});

// Publish event status to oracle (admin/organizer)
const publishToOracle = asyncHandler(async (req, res) => {
  const { issuerSeed, status } = req.body;

  if (!issuerSeed || !status) {
    throw new HttpError(400, 'issuerSeed and status are required');
  }

  const event = await Event.findOne({ eventId: req.params.eventId });
  if (!event) {
    throw new HttpError(404, 'Event not found');
  }

  const result = await oracleService.publishEventStatus({
    issuerSeed,
    oracleDocumentId: event.oracleDocumentId,
    eventId: event.eventId,
    status,
    provider: event.organizer,
    assetClass: 'EVENT'
  });

  // Update local event status
  event.status = status;
  event.oracleLastUpdateTime = Math.floor(Date.now() / 1000);
  await event.save();

  res.json({
    event,
    txHash: result.txHash
  });
});

// Manually trigger refund check for an event
const triggerRefundCheck = asyncHandler(async (req, res) => {
  const event = await Event.findOne({ eventId: req.params.eventId });
  if (!event) {
    throw new HttpError(404, 'Event not found');
  }

  if (event.status !== 'cancelled') {
    throw new HttpError(400, 'Event is not cancelled');
  }

  const refunds = await refundService.createRefundsForCancelledEvent(event.eventId);

  res.json({
    eventId: event.eventId,
    refundsCreated: refunds.length
  });
});

module.exports = {
  createEvent,
  listEvents,
  getEvent,
  updateEventStatus,
  publishToOracle,
  triggerRefundCheck
};
