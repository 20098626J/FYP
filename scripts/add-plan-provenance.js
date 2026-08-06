const db = require('../db/connection');

// Adds provenance columns to the plans table so every plan records where its
// data came from and when it was last fetched:
//   source      — how it was obtained, e.g. "schema.org (ld+json)" or
//                 "manual (verified 2026-04-21)"
//   source_url  — the page/endpoint it came from
//   fetched_at  — when the ingestion pipeline last wrote it
// Idempotent: safe to run repeatedly; only missing columns are added.

async function addColumns() {
  console.log('Adding provenance columns to plans...');

  const toAdd = [
    ['source', (t) => t.text('source')],
    ['source_url', (t) => t.text('source_url')],
    ['fetched_at', (t) => t.timestamp('fetched_at')],
  ];

  for (const [name, builder] of toAdd) {
    const exists = await db.schema.hasColumn('plans', name);
    if (exists) {
      console.log(`  ${name}: already present, skipping`);
      continue;
    }
    await db.schema.alterTable('plans', (t) => builder(t));
    console.log(`  ${name}: added`);
  }

  console.log('Done.');
}

addColumns()
  .catch((e) => {
    console.error('Migration failed:', e.message);
    process.exitCode = 1;
  })
  .finally(() => db.destroy());
