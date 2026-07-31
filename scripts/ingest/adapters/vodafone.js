// Vodafone adapter — Tier 4 (curated).
//
// Vodafone's broadband page is a fully JS-rendered SPA — the initial HTML has
// no plan tiles at all, so it can't be scraped statically; this is
// hand-maintained. Same fetchPlans() contract as the scraping adapters.
//
// This reflects Vodafone's real 5G fixed-wireless home product (correctly
// classified as "5G", contract-free), superseding the old seed's fictional
// "Simply Broadband" fibre entries. Price is carried from prior curated
// records — re-verify by hand and bump VERIFIED_ON when Vodafone changes its
// lineup. Vodafone's fibre plans are omitted until we have accurate figures.

const PROVIDER = 'Vodafone';
const TECHNOLOGY = '5G';
const VERIFIED_ON = '2026-07-31';
const SOURCE_URL = 'https://www.vodafone.ie/broadband';

const CURATED = [
  { planName: '5G Home Broadband', downloadSpeed: 150, uploadSpeed: 30, monthlyPrice: 40.0, contractLength: 0, priceNotes: null },
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
