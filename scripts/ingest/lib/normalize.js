// Shared helpers for turning the varied text a provider source gives us
// (plan names like "1Gb Broadband - 24 Month Contract", price strings, blurbs)
// into the clean, typed fields the plans table expects.

// "500Mb" -> 500, "1Gb"/"1 Gbps" -> 1000, "5Gb" -> 5000. Returns null if no
// speed token is present so validation can reject the plan rather than guess.
function parseSpeedMbps(text) {
  if (!text) return null;
  const m = String(text).match(/(\d+(?:\.\d+)?)\s*(gb|gbps|mb|mbps)/i);
  if (!m) return null;
  const value = parseFloat(m[1]);
  const unit = m[2].toLowerCase();
  const mbps = unit.startsWith('g') ? value * 1000 : value;
  return Math.round(mbps);
}

// "24 Month Contract" -> 24, "No contract" -> 0. Returns null when the text
// says nothing about contract length, letting the caller decide a default.
function parseContractMonths(text) {
  if (!text) return null;
  if (/no\s+contract/i.test(text)) return 0;
  const m = String(text).match(/(\d+)\s*month/i);
  return m ? parseInt(m[1], 10) : null;
}

// "34.99" / "€34.99" / 34.99 -> 34.99 (number), or null if not parseable.
function toPrice(value) {
  if (value === null || value === undefined) return null;
  const n = Number(String(value).replace(/[^\d.]/g, ''));
  return Number.isNaN(n) ? null : Math.round(n * 100) / 100;
}

// Pull the single most useful sentence(s) out of a long marketing description
// so price_notes stays short. Prioritises price-change and setup-fee wording.
function summariseNotes(description) {
  if (!description) return null;
  const sentences = String(description).split(/(?<=\.)\s+/);
  const keep = sentences.filter((s) =>
    /price increase|setup|installation|activation|waived|upfront/i.test(s));
  const note = keep.join(' ').trim();
  return note.length ? note : null;
}

module.exports = { parseSpeedMbps, parseContractMonths, toPrice, summariseNotes };
