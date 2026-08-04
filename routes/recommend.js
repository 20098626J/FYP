const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const { recommend } = require('../services/recommendation');

// GET /api/recommend?use=gaming&household=2-3&county=DUBLIN&budget=50
//
// Returns a data-backed recommendation: the computed speed need (with its
// breakdown and sources), the top real catalog plans that meet it, and — if a
// county is given — that county's gigabit availability. The bandwidth model
// lives in services/recommendation.js; this route just supplies the real data
// (plans + coverage) it ranks against.

const VALID_USES = ['gaming', 'streaming', 'wfh', 'browsing', 'all'];

async function countyCoverage(county) {
  if (!county) return null;
  const row = await db('electoral_divisions')
    .where('county', county.toUpperCase())
    .whereNotNull('gigabit_pct')
    .whereNotNull('premises')
    .select(
      db.raw('SUM(premises * gigabit_pct) / NULLIF(SUM(premises), 0) as gigabit_pct'),
      db.raw('SUM(premises)::int as premises'),
    )
    .first();
  if (!row || row.gigabit_pct == null) return null;
  return {
    county: county.toUpperCase(),
    gigabit_pct: Math.round(Number(row.gigabit_pct) * 10) / 10,
    premises: row.premises,
  };
}

router.get('/', async (req, res) => {
  try {
    const use = VALID_USES.includes(req.query.use) ? req.query.use : 'browsing';
    const household = req.query.household || '1';
    const county = req.query.county || null;

    let budget = null;
    if (req.query.budget != null && req.query.budget !== '') {
      const b = Number(req.query.budget);
      if (Number.isFinite(b) && b > 0) budget = b;
    }

    const plans = await db('plans')
      .select(
        'plans.*',
        'providers.name as provider_name',
        'providers.website as provider_website',
        'technologies.name as technology_name',
      )
      .join('providers', 'plans.provider_id', 'providers.id')
      .join('technologies', 'plans.technology_id', 'technologies.id');

    const coverage = await countyCoverage(county);

    const result = recommend({ use, household, county, budget }, plans, coverage);
    res.json({ input: { use, household, county, budget }, ...result });
  } catch (error) {
    console.error('Error building recommendation:', error);
    res.status(500).json({ error: 'Failed to build recommendation' });
  }
});

module.exports = router;
