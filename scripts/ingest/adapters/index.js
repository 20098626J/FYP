// Adapter registry. The orchestrator iterates this list, so adding a provider
// is just writing an adapter that exports { providerName, tier, fetchPlans }
// and dropping it in here — no orchestrator changes needed.
//
// Tiers, most robust to least: structured (JSON/ld+json) > embedded > rendered
// (Puppeteer) > curated (hand-maintained). Eir is the structured reference;
// Sky is the curated reference. Virgin Media and Vodafone can be ported from
// their existing seed scripts as further curated adapters.

module.exports = [
  require('./eir'),
  require('./sky'),
  require('./virgin-media'),
  require('./vodafone'),
];
