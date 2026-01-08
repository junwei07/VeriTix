const express = require('express');

const requireAdminKey = require('../middleware/requireAdminKey');
const {
  authorizeTicketHolder,
  clawbackTicket,
  updateTicketMetadata,
} = require('../controllers/treasuryController');

// Organizer-only treasury actions for MPT compliance.
const router = express.Router();

router.post('/clawback', requireAdminKey, clawbackTicket);
router.post('/authorize', requireAdminKey, authorizeTicketHolder);
router.patch('/metadata', requireAdminKey, updateTicketMetadata);

module.exports = router;
