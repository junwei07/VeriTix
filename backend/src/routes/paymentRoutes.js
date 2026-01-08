const express = require('express');

const { handleStripeWebhook } = require('../controllers/paymentController');

// Payment webhook routes for primary sale fulfillment.
const router = express.Router();

router.post('/webhook', handleStripeWebhook);

module.exports = router;
