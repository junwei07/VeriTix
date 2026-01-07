const xrpl = require('xrpl');

// Convert user-facing XRP into drops and ensure it is a positive amount.
const toDrops = (amountXrp) => {
  if (amountXrp === undefined || amountXrp === null) {
    throw new Error('amountXrp is required');
  }
  const normalized =
    typeof amountXrp === 'string' ? amountXrp.trim() : amountXrp;
  const drops = xrpl.xrpToDrops(normalized);
  if (BigInt(drops) <= 0n) {
    throw new Error('amountXrp must be greater than zero');
  }
  return drops;
};

// Compare drops amounts using BigInt for safe precision.
const compareDrops = (left, right) => {
  const leftValue = BigInt(left);
  const rightValue = BigInt(right);
  if (leftValue === rightValue) {
    return 0;
  }
  return leftValue > rightValue ? 1 : -1;
};

// Enforce a ceiling in drops (throws if left is greater than right).
const ensureLessOrEqualDrops = (left, right, message) => {
  if (compareDrops(left, right) === 1) {
    throw new Error(message);
  }
};

module.exports = {
  compareDrops,
  ensureLessOrEqualDrops,
  toDrops,
};
