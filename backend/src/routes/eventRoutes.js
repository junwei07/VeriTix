const express = require('express');
const {
  createEvent,
  listEvents,
  getEvent,
  updateEventStatus,
  publishToOracle,
  triggerRefundCheck
} = require('../controllers/eventController');

const router = express.Router();

router.post('/', createEvent);
router.get('/', listEvents);
router.get('/:eventId', getEvent);
router.patch('/:eventId/status', updateEventStatus);
router.post('/:eventId/publish-oracle', publishToOracle);
router.post('/:eventId/trigger-refund', triggerRefundCheck);

module.exports = router;
