const express = require('express');

const requireAdminKey = require('../middleware/requireAdminKey');
const {
  prepareCredentialAccept,
  revokeWallet,
  verifyWallet,
} = require('../controllers/complianceController');

// Compliance endpoints for verification and credential flows.
const router = express.Router();

router.post('/verify', requireAdminKey, verifyWallet);
router.post('/revoke', requireAdminKey, revokeWallet);
router.post('/credential/accept/prepare', prepareCredentialAccept);

module.exports = router;
