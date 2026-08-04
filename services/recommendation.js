// Data-backed broadband recommendation model.
//
// The old recommender hardcoded numbers ("gaming = 500 Mbps") with no
// derivation. This replaces that with a transparent bandwidth model: a
// recommended speed is *computed* from published per-activity figures and a
// household concurrency assumption, and every number is returned in a visible
// breakdown so the advice can be justified.
//
// The functions here are pure (plans are passed in, not queried) so the logic
// can be unit-tested without a database — see recommendation.test.js.

// Sustained bandwidth per activity, in Mbps, from the providers' own guidance.
// These are the citable figures; SOURCES lists where each comes from.
const RATES = {
  stream4k: 15,     // Netflix UHD
  streamHd: 5,      // Netflix HD
  videoCall: 4,     // Zoom / Teams 1080p group call
  cloudGaming: 45,  // NVIDIA GeForce NOW 4K / Xbox Cloud Gaming, top tier
  onlineGaming: 5,  // console/PC multiplayer session — latency-bound, low bandwidth
  browsing: 3,      // web, social, email
};

const SOURCES = [
  { claim: '4K / UHD video stream ≈ 15 Mbps', source: 'Netflix Help Centre — Internet speed recommendations' },
  { claim: 'HD (1080p) video stream ≈ 5 Mbps', source: 'Netflix Help Centre' },
  { claim: 'HD video call ≈ 3–4 Mbps', source: 'Zoom & Microsoft Teams bandwidth guides' },
  { claim: 'Cloud gaming (4K) ≈ 45 Mbps', source: 'NVIDIA GeForce NOW / Xbox Cloud Gaming requirements' },
  { claim: 'Online multiplayer ≈ 1–5 Mbps (latency matters, not speed)', source: 'Console maker network guides' },
];

// Whole-home overhead: OS/app updates, smart-home devices, backups.
const BASE_OVERHEAD = 10;
// Safety margin so a line isn't sized to its exact theoretical peak.
const HEADROOM = 1.2;
// Speed thresholds we round a recommendation up to (Mbps).
const TIERS = [50, 100, 250, 500, 1000];

// What a single "active" user is assumed to be doing under each usage profile.
const USE_BASKETS = {
  gaming: [['Online gaming', RATES.onlineGaming]],
  streaming: [['4K stream', RATES.stream4k]],
  wfh: [['Video call', RATES.videoCall], ['HD stream / 2nd device', RATES.streamHd]],
  browsing: [['Browsing & social', RATES.browsing]],
  all: [['4K stream', RATES.stream4k], ['Video call', RATES.videoCall], ['Online gaming', RATES.onlineGaming]],
};

// Usage types where connection quality (latency) matters as much as raw speed,
// so we steer these toward FTTP (fibre).
const LATENCY_SENSITIVE = new Set(['gaming', 'wfh', 'all']);

// Peak simultaneous users — deliberately below headcount, since a household
// rarely has everyone streaming at the same moment.
function concurrentUsers(household) {
  if (household === '2-3') return 2;
  if (household === '4+') return 3;
  const n = parseInt(household, 10);
  if (Number.isFinite(n) && n > 0) return Math.max(1, Math.ceil(n * 0.6));
  return 1; // '1' / 'just me' / unknown
}

function smallestTierAtLeast(mbps) {
  for (const t of TIERS) if (t >= mbps) return t;
  return TIERS[TIERS.length - 1];
}

// Extra, non-required guidance per usage type (kept out of the hard number).
function usageNotes(use) {
  const notes = [];
  if (use === 'gaming' || use === 'all') {
    notes.push('Online gaming uses little bandwidth — a low-latency fibre (FTTP) line matters more than a big headline speed.');
    notes.push('Higher speeds mainly cut download times: a 100 GB game takes ~2 hours at 100 Mbps but ~30 minutes at 500 Mbps.');
  }
  if (use === 'wfh' || use === 'all') {
    notes.push('For video calls, upload speed matters too — fibre offers far better upload than most cable or DSL lines.');
  }
  return notes;
}

// Compute the recommended speed and the breakdown behind it.
function computeNeed(input) {
  const use = USE_BASKETS[input.use] ? input.use : 'browsing';
  const concurrent = concurrentUsers(input.household);
  const basket = USE_BASKETS[use];
  const perUser = basket.reduce((sum, [, mbps]) => sum + mbps, 0);

  const activityTotal = concurrent * perUser;
  const rawTotal = BASE_OVERHEAD + activityTotal;
  const withHeadroom = Math.round(rawTotal * HEADROOM);
  const tier = smallestTierAtLeast(withHeadroom);

  const activityLabel = basket.map(([label, mbps]) => `${label} ${mbps}`).join(' + ');
  const breakdown = [
    { label: 'Whole-home baseline (updates, smart devices)', mbps: BASE_OVERHEAD },
    { label: `${concurrent} active ${concurrent === 1 ? 'user' : 'users'} × (${activityLabel})`, mbps: activityTotal },
    { label: '20% headroom', mbps: withHeadroom - rawTotal },
  ];

  return {
    recommendedMbps: withHeadroom,
    tier,
    preferFttp: LATENCY_SENSITIVE.has(use),
    concurrent,
    breakdown,
    notes: usageNotes(use),
  };
}

// Rank real catalog plans against a computed need. Pure: `plans` is the array
// the caller fetched. Returns up to `limit` picks, each tagged with why.
function rankPlans(need, plans, options = {}) {
  const { budget = null, limit = 3 } = options;

  let candidates = plans.filter((p) => Number(p.download_speed) >= need.recommendedMbps);
  let budgetNote = null;
  if (candidates.length === 0) {
    // Need exceeds everything on offer — fall back to the fastest plans.
    candidates = [...plans].sort((a, b) => b.download_speed - a.download_speed);
  }
  if (budget != null) {
    const within = candidates.filter((p) => Number(p.monthly_price) <= budget);
    if (within.length > 0) {
      candidates = within;
    } else {
      budgetNote = `No plan meeting your needs is under €${budget}; showing the closest options.`;
    }
  }

  // Primary ordering: fibre first when latency-sensitive, then cheapest.
  const sorted = [...candidates].sort((a, b) => {
    if (need.preferFttp) {
      const af = a.technology_name === 'Fiber' ? 0 : 1;
      const bf = b.technology_name === 'Fiber' ? 0 : 1;
      if (af !== bf) return af - bf;
    }
    return Number(a.monthly_price) - Number(b.monthly_price);
  });

  const cheapest = [...candidates].sort((a, b) => Number(a.monthly_price) - Number(b.monthly_price))[0];
  const fastest = [...candidates].sort((a, b) => b.download_speed - a.download_speed)[0];

  const picks = [];
  const take = (plan, tag, rationale) => {
    if (plan && !picks.find((p) => p.id === plan.id)) {
      picks.push({ ...plan, tag, rationale });
    }
  };

  const ratio = (p) => Math.round((p.download_speed / need.recommendedMbps) * 10) / 10;

  take(sorted[0], 'best-match',
    need.preferFttp && sorted[0]?.technology_name === 'Fiber'
      ? `Fibre (FTTP) for low latency, and ${ratio(sorted[0])}× your estimated ${need.recommendedMbps} Mbps need.`
      : `Best fit: covers your estimated ${need.recommendedMbps} Mbps need at the lowest price.`);
  take(cheapest, 'best-value', `Cheapest plan that still covers your needs (€${cheapest?.monthly_price}/mo).`);
  take(fastest, 'most-headroom', `Most future-proof: ${fastest?.download_speed} Mbps (${ratio(fastest)}× your need).`);

  return { picks: picks.slice(0, limit), budgetNote };
}

// Convenience: full recommendation from inputs + fetched plans (+ coverage).
function recommend(input, plans, coverage = null) {
  const need = computeNeed(input);
  const { picks, budgetNote } = rankPlans(need, plans, { budget: input.budget ?? null });
  return { need, plans: picks, budgetNote, coverage, sources: SOURCES };
}

module.exports = {
  RATES, SOURCES, TIERS, BASE_OVERHEAD, HEADROOM,
  concurrentUsers, computeNeed, rankPlans, recommend,
};
