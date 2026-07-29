const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const booleanPointInPolygon = require('@turf/boolean-point-in-polygon').default;
const { point } = require('@turf/helpers');

// Coverage lookup by geographic point.
//
// The electoral_divisions table stores each ED boundary as GeoJSON plus a
// pre-computed bounding box (this deployment runs plain Postgres, no PostGIS).
// A lookup therefore runs in two stages:
//   1. Use the indexed bbox columns to shortlist divisions whose box contains
//      the point — a cheap, index-backed filter.
//   2. Run an exact point-in-polygon test against each candidate's geometry to
//      find the division the point actually falls in.
// Shortlisting first means the expensive geometry test runs on a handful of
// candidates rather than all 3,420 divisions.

// Fields returned to clients — the geometry itself is intentionally omitted
// from the response to keep it small.
const ED_FIELDS = [
  'id',
  'ed_id',
  'ed_name',
  'county',
  'premises',
  'gigabit_pct',
  'gigabit_nbi_pct',
  'gigabit_active_pct',
];

function parseCoord(value, min, max) {
  if (value === undefined) return { error: 'missing' };
  const n = Number(value);
  if (Number.isNaN(n)) return { error: 'not a number' };
  if (n < min || n > max) return { error: 'out of range' };
  return { value: n };
}

// GET /api/coverage/counties
// Aggregates gigabit availability up to county level, weighting each electoral
// division by its premises count so the figure reflects "share of premises in
// the county that can get gigabit" rather than a flat average of divisions.
// Used by the plan recommender to factor real local availability into advice.
router.get('/counties', async (req, res) => {
  try {
    const rows = await db('electoral_divisions')
      .whereNotNull('county')
      .whereNotNull('gigabit_pct')
      .whereNotNull('premises')
      .groupBy('county')
      .select(
        'county',
        db.raw('SUM(premises)::int as premises'),
        db.raw('COUNT(*)::int as ed_count'),
        db.raw('SUM(premises * gigabit_pct) / NULLIF(SUM(premises), 0) as gigabit_pct'),
      )
      .orderBy('county');

    const counties = rows.map((r) => ({
      county: r.county,
      premises: r.premises,
      ed_count: r.ed_count,
      // Premises-weighted mean, rounded to one decimal place.
      gigabit_pct: r.gigabit_pct === null ? null : Math.round(Number(r.gigabit_pct) * 10) / 10,
    }));

    res.json({ count: counties.length, counties });
  } catch (error) {
    console.error('Error aggregating county coverage:', error);
    res.status(500).json({ error: 'Failed to aggregate county coverage' });
  }
});

// GET /api/coverage?lat=53.34&lng=-6.26
// Returns the electoral division containing the point and its coverage figures.
router.get('/', async (req, res) => {
  try {
    // Latitude/longitude bounds are widened slightly beyond Ireland's extent
    // so a valid-but-edge coordinate is never rejected outright; points well
    // outside the dataset simply match no division.
    const lat = parseCoord(req.query.lat, -90, 90);
    const lng = parseCoord(req.query.lng, -180, 180);

    if (lat.error || lng.error) {
      return res.status(400).json({
        error:
          'Query params "lat" and "lng" are required and must be valid coordinates.',
      });
    }

    // Stage 1: shortlist by bounding box using the indexed extent columns.
    const candidates = await db('electoral_divisions')
      .select([...ED_FIELDS, 'geometry'])
      .where('bbox_minx', '<=', lng.value)
      .andWhere('bbox_maxx', '>=', lng.value)
      .andWhere('bbox_miny', '<=', lat.value)
      .andWhere('bbox_maxy', '>=', lat.value);

    // Stage 2: exact point-in-polygon test. GeoJSON is [lng, lat] order.
    const pt = point([lng.value, lat.value]);
    const match = candidates.find((row) => {
      const geometry =
        typeof row.geometry === 'string' ? JSON.parse(row.geometry) : row.geometry;
      return booleanPointInPolygon(pt, geometry);
    });

    if (!match) {
      return res.status(404).json({
        error: 'No electoral division found for the given coordinates.',
        lat: lat.value,
        lng: lng.value,
      });
    }

    // Strip geometry from the response payload.
    const { geometry, ...division } = match;
    res.json({
      lat: lat.value,
      lng: lng.value,
      division,
    });
  } catch (error) {
    console.error('Error looking up coverage:', error);
    res.status(500).json({ error: 'Failed to look up coverage' });
  }
});

module.exports = router;
