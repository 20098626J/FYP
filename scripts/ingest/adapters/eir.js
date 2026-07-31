const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const { parseSpeedMbps, parseContractMonths, toPrice, summariseNotes } = require('../lib/normalize');

// Eir adapter — Tier 1 (structured data).
//
// Eir's broadband page embeds a schema.org Product block (application/ld+json)
// whose `offers` array lists every plan with a machine-readable name, price and
// description. We parse that instead of matching strings in the rendered HTML,
// so the adapter keeps working when the page's markup or prices change.

const PROVIDER = 'Eir';
const TECHNOLOGY = 'Fiber';
const SOURCE_URL = 'https://www.eir.ie/broadband/';
const FIXTURE = path.join(__dirname, '..', '..', '..', 'eir-page.html');

async function fetchHtml() {
  const res = await axios.get(SOURCE_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    timeout: 15000,
  });
  return res.data;
}

// Pull every Offer out of the ld+json Product block(s) on the page.
function extractOffers(html) {
  const $ = cheerio.load(html);
  const offers = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    let data;
    try {
      data = JSON.parse($(el).contents().text());
    } catch {
      return; // ignore any malformed block
    }
    for (const node of Array.isArray(data) ? data : [data]) {
      if (node && node['@type'] === 'Product' && Array.isArray(node.offers)) {
        offers.push(...node.offers);
      }
    }
  });
  return offers;
}

function offerToPlan(offer) {
  const speed = parseSpeedMbps(offer.name);
  return {
    providerName: PROVIDER,
    technologyName: TECHNOLOGY,
    planName: offer.name ? offer.name.trim() : null,
    downloadSpeed: speed,
    // Eir fibre is asymmetric; upload is roughly a tenth of download.
    uploadSpeed: speed ? Math.round(speed / 10) : null,
    monthlyPrice: toPrice(offer.price),
    setupFee: 0, // installation + activation currently free (see notes)
    contractLength: parseContractMonths(offer.name),
    priceNotes: summariseNotes(offer.description),
    source: 'schema.org (ld+json)',
    sourceUrl: offer.url || SOURCE_URL,
  };
}

// fetchPlans({ fixture }) — pass fixture:true to parse the saved page offline
// (deterministic, network-free) instead of fetching the live site.
async function fetchPlans({ fixture = false } = {}) {
  const html = fixture ? fs.readFileSync(FIXTURE, 'utf8') : await fetchHtml();
  return extractOffers(html).map(offerToPlan);
}

module.exports = { providerName: PROVIDER, tier: 'structured', fetchPlans, extractOffers, offerToPlan };
