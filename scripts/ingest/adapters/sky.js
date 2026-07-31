// Sky Ireland adapter — Tier 4 (curated).
//
// Sky's plans sit behind a JS-only shop flow with no structured data we can
// reliably parse, so this is a hand-maintained source. It implements the same
// fetchPlans() contract as the scraping adapters, and stamps its output with a
// verified date so curated data is honest about its age rather than pretending
// to be live. Update the list and VERIFIED_ON when Sky changes its pricing.

const PROVIDER = 'Sky Ireland';
const TECHNOLOGY = 'Fiber';
const VERIFIED_ON = '2026-07-28';
const SOURCE_URL = 'https://www.sky.com/ie/broadband';

const CURATED = [
  { planName: 'Ultrafast Plus 500Mb', downloadSpeed: 500, uploadSpeed: 50, monthlyPrice: 30.0, contractLength: 12, priceNotes: null },
  { planName: 'Ultrafast Max 1Gb', downloadSpeed: 1000, uploadSpeed: 100, monthlyPrice: 40.0, contractLength: 12, priceNotes: null },
  { planName: 'Gigafast 2Gb', downloadSpeed: 2000, uploadSpeed: 200, monthlyPrice: 50.0, contractLength: 12, priceNotes: 'Requires Sky Gigafast+ Hub' },
  { planName: 'Gigafast 5Gb', downloadSpeed: 5000, uploadSpeed: 500, monthlyPrice: 55.0, contractLength: 12, priceNotes: 'Requires Sky Gigafast+ Hub' },
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
