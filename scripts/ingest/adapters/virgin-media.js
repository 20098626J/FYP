// Virgin Media adapter — Tier 4 (curated).
//
// Virgin's site is a bundle-heavy marketing layout with no structured data and
// no clean speed/price association in the DOM, so it can't be reliably scraped;
// this is hand-maintained. Same fetchPlans() contract as the scraping adapters.
//
// These figures reflect Virgin's real cable products (correctly classified as
// DOCSIS "Cable" with asymmetric upload), superseding the old seed's symmetric
// "Full Fibre" placeholders. Monthly prices are carried from prior curated
// records — the live site resists automated extraction, so re-verify prices by
// hand and bump VERIFIED_ON when Virgin changes its lineup. Higher tiers
// (1Gb/2Gb) are omitted until we have equally accurate Cable figures for them.

const PROVIDER = 'Virgin Media';
const TECHNOLOGY = 'Cable';
const VERIFIED_ON = '2026-07-31';
const SOURCE_URL = 'https://www.virginmedia.ie/broadband/';

const CURATED = [
  { planName: 'Virgin 250', downloadSpeed: 250, uploadSpeed: 25, monthlyPrice: 40.0, contractLength: 18, priceNotes: null },
  { planName: 'Virgin 500', downloadSpeed: 500, uploadSpeed: 50, monthlyPrice: 50.0, contractLength: 18, priceNotes: null },
];

async function fetchPlans() {
  return CURATED.map((p) => ({
    providerName: PROVIDER,
    technologyName: TECHNOLOGY,
    ...p,
    setupFee: 0,
    source: `manual (verified ${VERIFIED_ON})`,
    sourceUrl: SOURCE_URL,
  }));
}

module.exports = { providerName: PROVIDER, tier: 'curated', fetchPlans };
