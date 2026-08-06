// Fixture-based tests for the Eir adapter. Run with: node --test
//
// These parse the saved eir-page.html (the structured-data snapshot) rather
// than hitting the live site, so they're deterministic and offline. Their job
// is to catch structural drift: if Eir's page stops carrying the schema.org
// offers we rely on, the parse yields nothing and these tests fail here instead
// of the pipeline silently going empty in production.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const eir = require('./eir');
const { partitionValid } = require('../lib/validate');

// Known-good values from the fixture, keyed by the plan name Eir publishes.
const EXPECTED = {
  '500Mb Broadband - 12 Month Contract': { downloadSpeed: 500, monthlyPrice: 34.99, contractLength: 12 },
  '1Gb Broadband - 24 Month Contract': { downloadSpeed: 1000, monthlyPrice: 39.99, contractLength: 24 },
  '5Gb Broadband - 24 Month Contract (Our longest range WiFi)': { downloadSpeed: 5000, monthlyPrice: 49.99, contractLength: 24 },
};

test('fixture parses into the expected set of valid plans', async () => {
  const plans = await eir.fetchPlans({ fixture: true });

  // Drift guard: a broken parse returns nothing, which must fail loudly.
  assert.ok(plans.length > 0, 'expected at least one plan from the fixture');
  assert.equal(plans.length, Object.keys(EXPECTED).length);

  const { accepted, rejected } = partitionValid(plans);
  assert.equal(rejected.length, 0, `unexpected invalid plans: ${JSON.stringify(rejected)}`);
  assert.equal(accepted.length, plans.length);
});

test('each parsed plan matches the known fixture values', async () => {
  const plans = await eir.fetchPlans({ fixture: true });
  for (const plan of plans) {
    const expected = EXPECTED[plan.planName];
    assert.ok(expected, `unexpected plan name "${plan.planName}"`);
    assert.equal(plan.downloadSpeed, expected.downloadSpeed, `speed for ${plan.planName}`);
    assert.equal(plan.monthlyPrice, expected.monthlyPrice, `price for ${plan.planName}`);
    assert.equal(plan.contractLength, expected.contractLength, `contract for ${plan.planName}`);
    assert.equal(plan.providerName, 'Eir');
    assert.equal(plan.source, 'schema.org (ld+json)');
  }
});

test('extractOffers reads Product offers and ignores malformed blocks', () => {
  const html = `
    <html><head>
      <script type="application/ld+json">{ not valid json }</script>
      <script type="application/ld+json">${JSON.stringify({ '@type': 'FAQPage' })}</script>
      <script type="application/ld+json">${JSON.stringify({
        '@type': 'Product',
        offers: [
          { '@type': 'Offer', name: 'Test 1Gb - 24 Month Contract', price: '39.99', url: 'https://eir.ie/x' },
        ],
      })}</script>
    </head><body></body></html>`;
  const offers = eir.extractOffers(html);
  assert.equal(offers.length, 1);
  assert.equal(offers[0].name, 'Test 1Gb - 24 Month Contract');
});

test('offerToPlan derives speed and contract from the name', () => {
  const plan = eir.offerToPlan({
    name: '2Gb Broadband - 18 Month Contract',
    price: '45.00',
    description: 'Setup fee waived. Price increases by €4 each April.',
    url: 'https://eir.ie/shop/broadband',
  });
  assert.equal(plan.downloadSpeed, 2000);
  assert.equal(plan.contractLength, 18);
  assert.equal(plan.monthlyPrice, 45);
  assert.ok(/price increase|setup/i.test(plan.priceNotes || ''), 'notes should summarise the description');
});

test('offerToPlan yields an invalid plan when the name lacks a speed', () => {
  const plan = eir.offerToPlan({ name: 'Mystery Broadband', price: '30.00' });
  assert.equal(plan.downloadSpeed, null);
  const { rejected } = partitionValid([plan]);
  assert.equal(rejected.length, 1, 'a speed-less plan must be rejected by validation');
});
