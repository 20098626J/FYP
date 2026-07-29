const db = require('../db/connection');
const turfBbox = require('@turf/bbox').default;

// ETL: pull gigabit broadband coverage per Electoral Division from ComReg's
// public ArcGIS Feature Service and load it into the electoral_divisions table.
// Each record carries both the coverage statistics and the ED boundary polygon,
// so a single paginated download gives us everything the area lookup needs.
//
// Source: ComReg Open Data Map Hub — "[QKDR] Ireland Gigabit Statistics Public
// Data View", Electoral_Divisions layer (id 3). Reused under PSI Regulations.

const SERVICE_URL =
  'https://services-eu1.arcgis.com/pvZmdFc5up2jdiPm/arcgis/rest/services/' +
  'Ireland_Gigabit_Statistics_Public_View/FeatureServer/3/query';

const OUT_FIELDS = [
  'ED_ENGLISH',
  'ED_ID_STR',
  'COUNTY_ENGLISH',
  'Premise_Count_Public_View',
  'Gigabit_Passed_PCT_Public_View',
  'Gigabit_NBI_Passed_PCT_Public_View',
  'Gigabit_Active_PCT_Public_View',
].join(',');

const PAGE_SIZE = 500;

function buildUrl(offset) {
  const params = new URLSearchParams({
    where: '1=1',
    outFields: OUT_FIELDS,
    outSR: '4326',
    resultOffset: String(offset),
    resultRecordCount: String(PAGE_SIZE),
    f: 'geojson',
  });
  return `${SERVICE_URL}?${params.toString()}`;
}

function toInt(v) {
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? null : n;
}

function toFloat(v) {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

async function fetchPage(offset) {
  const res = await fetch(buildUrl(offset));
  if (!res.ok) {
    throw new Error(`ComReg request failed: HTTP ${res.status}`);
  }
  const json = await res.json();
  if (json.error) {
    throw new Error(`ComReg API error: ${JSON.stringify(json.error)}`);
  }
  return json;
}

function rowFromFeature(feature) {
  const p = feature.properties || {};
  const [minx, miny, maxx, maxy] = turfBbox(feature);
  return {
    ed_id: p.ED_ID_STR || '',
    ed_name: p.ED_ENGLISH || 'Unknown',
    county: p.COUNTY_ENGLISH || null,
    premises: toInt(p.Premise_Count_Public_View),
    gigabit_pct: toFloat(p.Gigabit_Passed_PCT_Public_View),
    gigabit_nbi_pct: toFloat(p.Gigabit_NBI_Passed_PCT_Public_View),
    gigabit_active_pct: toFloat(p.Gigabit_Active_PCT_Public_View),
    bbox_minx: minx,
    bbox_miny: miny,
    bbox_maxx: maxx,
    bbox_maxy: maxy,
    geometry: JSON.stringify(feature.geometry),
  };
}

async function seed() {
  console.log('Seeding electoral divisions from ComReg...');

  const hasTable = await db.schema.hasTable('electoral_divisions');
  if (!hasTable) {
    throw new Error('Table missing. Run scripts/create-ed-schema.js first.');
  }

  await db('electoral_divisions').del();

  let offset = 0;
  let total = 0;

  while (true) {
    const page = await fetchPage(offset);
    const features = page.features || [];
    if (features.length === 0) break;

    const rows = features
      .filter((f) => f.geometry) // skip any records missing a boundary
      .map(rowFromFeature);

    // Chunked insert keeps us under Postgres' parameter limit given the
    // large jsonb geometry payloads.
    await db.batchInsert('electoral_divisions', rows, 100);

    total += rows.length;
    offset += features.length;
    console.log(`  loaded ${total} divisions...`);

    if (!page.properties || page.properties.exceededTransferLimit !== true) {
      // Last page returned fewer than the transfer limit.
      if (features.length < PAGE_SIZE) break;
    }
  }

  console.log(`\nDone. Loaded ${total} electoral divisions.`);

  const withCoverage = await db('electoral_divisions')
    .whereNotNull('gigabit_pct')
    .count('* as c')
    .first();
  const counties = await db('electoral_divisions')
    .distinct('county')
    .then((r) => r.length);
  console.log(`  ${withCoverage.c} have a coverage figure`);
  console.log(`  spanning ${counties} counties`);
}

seed()
  .catch((e) => {
    console.error('Seed failed:', e.message);
    process.exitCode = 1;
  })
  .finally(() => db.destroy());
