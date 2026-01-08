const express = require('express');
const {
  listRefunds,
  getRefund,
  retryRefund,
  getWalletRefunds
} = require('../controllers/refundController');

const router = express.Router();

router.get('/', listRefunds);
router.get('/wallet/:wallet', getWalletRefunds);
router.get('/:id', getRefund);
router.post('/:id/retry', retryRefund);

module.exports = router;
