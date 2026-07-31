// One schema every adapter's output must satisfy before it can touch the
// database. This is what makes the pipeline trustworthy: a broken scrape
// produces invalid rows that get reported and dropped, never written.

const REQUIRED_STRING = ['providerName', 'technologyName', 'planName'];

// Validate a single normalized plan. Returns { valid, errors: [string] }.
function validatePlan(plan) {
  const errors = [];

  for (const field of REQUIRED_STRING) {
    if (!plan[field] || typeof plan[field] !== 'string' || !plan[field].trim()) {
      errors.push(`${field} is missing or empty`);
    }
  }

  if (!Number.isInteger(plan.downloadSpeed) || plan.downloadSpeed <= 0) {
    errors.push(`downloadSpeed must be a positive integer (got ${plan.downloadSpeed})`);
  }
  if (plan.uploadSpeed != null && (!Number.isInteger(plan.uploadSpeed) || plan.uploadSpeed <= 0)) {
    errors.push(`uploadSpeed must be a positive integer when present (got ${plan.uploadSpeed})`);
  }
  if (typeof plan.monthlyPrice !== 'number' || Number.isNaN(plan.monthlyPrice) || plan.monthlyPrice <= 0) {
    errors.push(`monthlyPrice must be a positive number (got ${plan.monthlyPrice})`);
  }
  if (plan.setupFee != null && (typeof plan.setupFee !== 'number' || plan.setupFee < 0)) {
    errors.push(`setupFee must be zero or positive when present (got ${plan.setupFee})`);
  }
  if (plan.contractLength != null && (!Number.isInteger(plan.contractLength) || plan.contractLength < 0)) {
    errors.push(`contractLength must be a non-negative integer when present (got ${plan.contractLength})`);
  }

  return { valid: errors.length === 0, errors };
}

// Split a batch into accepted / rejected, keeping each rejection's reasons.
function partitionValid(plans) {
  const accepted = [];
  const rejected = [];
  for (const plan of plans) {
    const { valid, errors } = validatePlan(plan);
    if (valid) accepted.push(plan);
    else rejected.push({ plan, errors });
  }
  return { accepted, rejected };
}

module.exports = { validatePlan, partitionValid };
