// Unit tests for the recommendation model. Run with: node --test
// No database and no dependencies — the model is pure, so we pass a fixed set
// of fake plans and assert properties rather than exact catalog output.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  computeNeed, rankPlans, recommend, concurrentUsers, BASE_OVERHEAD, HEADROOM,
} = require('./recommendation');

const PLANS = [
  { id: 1, plan_name: 'Sky 500', download_speed: 500, monthly_price: 30, technology_name: 'Fiber' },
  { id: 2, plan_name: 'Virgin 250', download_speed: 250, monthly_price: 40, technology_name: 'Cable' },
  { id: 3, plan_name: 'Vodafone 5G', download_speed: 150, monthly_price: 40, technology_name: '5G' },
  { id: 4, plan_name: 'Eir 1Gb', download_speed: 1000, monthly_price: 39.99, technology_name: 'Fiber' },
  { id: 5, plan_name: 'Eir 5Gb', download_speed: 5000, monthly_price: 49.99, technology_name: 'Fiber' },
];

test('recommended speed is monotonic in load', () => {
  const light = computeNeed({ use: 'browsing', household: '1' }).recommendedMbps;
  const mid = computeNeed({ use: 'streaming', household: '2-3' }).recommendedMbps;
  const heavy = computeNeed({ use: 'all', household: '4+' }).recommendedMbps;
  assert.ok(light <= mid, `browsing/1 (${light}) should be <= streaming/2-3 (${mid})`);
  assert.ok(mid <= heavy, `streaming/2-3 (${mid}) should be <= all/4+ (${heavy})`);
});

test('need matches the documented sum for a known input', () => {
  // streaming (FCC 4K = 25) × 1 active user + 10 baseline, then ×1.2 headroom.
  const expected = Math.round((BASE_OVERHEAD + 1 * 25) * HEADROOM); // (10+25)*1.2 = 42
  const need = computeNeed({ use: 'streaming', household: '1' });
  assert.equal(need.recommendedMbps, expected);
  assert.equal(need.recommendedMbps, 42);
  // breakdown parts sum to the headroomed total.
  const summed = need.breakdown.reduce((s, b) => s + b.mbps, 0);
  assert.equal(summed, need.recommendedMbps);
});

test('concurrency stays below headcount', () => {
  assert.equal(concurrentUsers('1'), 1);
  assert.equal(concurrentUsers('2-3'), 2);
  assert.equal(concurrentUsers('4+'), 3);
});

test('latency-sensitive uses prefer fibre', () => {
  assert.equal(computeNeed({ use: 'gaming', household: '1' }).preferFttp, true);
  assert.equal(computeNeed({ use: 'wfh', household: '1' }).preferFttp, true);
  assert.equal(computeNeed({ use: 'streaming', household: '1' }).preferFttp, false);
});

test('gaming surfaces a fibre plan first', () => {
  const need = computeNeed({ use: 'gaming', household: '2-3' });
  const { picks } = rankPlans(need, PLANS);
  assert.equal(picks[0].technology_name, 'Fiber');
});

test('budget is respected when a plan fits it', () => {
  const need = computeNeed({ use: 'streaming', household: '1' });
  const { picks } = rankPlans(need, PLANS, { budget: 35 });
  assert.ok(picks.length > 0);
  for (const p of picks) assert.ok(Number(p.monthly_price) <= 35, `${p.plan_name} over budget`);
});

test('over-budget request flags a note instead of hiding everything', () => {
  const need = computeNeed({ use: 'streaming', household: '1' });
  const { picks, budgetNote } = rankPlans(need, PLANS, { budget: 10 });
  assert.ok(picks.length > 0, 'still returns closest options');
  assert.ok(budgetNote, 'explains that nothing was within budget');
});

test('FCC household-guide cross-check is attached and mapped correctly', () => {
  const need = computeNeed({ use: 'streaming', household: '2-3' });
  assert.equal(need.fcc.usageLevel, 'moderate');
  assert.equal(need.fcc.devices, 3);
  assert.equal(need.fcc.band, 'Medium');
  assert.equal(need.fcc.rangeMin, 12);
  assert.equal(need.fcc.rangeMax, 25);
});

test('FCC cross-check flags the agreement direction', () => {
  // browsing/1 ≈ 13 Mbps sits above the FCC Basic band (3–8).
  const light = computeNeed({ use: 'browsing', household: '1' });
  assert.equal(light.fcc.band, 'Basic');
  assert.equal(light.fcc.agreement, 'above');
  // all/4+ is well inside the open-ended Advanced band (25+).
  const heavy = computeNeed({ use: 'all', household: '4+' });
  assert.equal(heavy.fcc.band, 'Advanced');
  assert.equal(heavy.fcc.agreement, 'within');
});

test('recommend() returns need, plans and sources together', () => {
  const out = recommend({ use: 'all', household: '4+' }, PLANS);
  assert.ok(out.need.recommendedMbps > 0);
  assert.ok(Array.isArray(out.plans) && out.plans.length > 0);
  assert.ok(Array.isArray(out.sources) && out.sources.length > 0);
});
