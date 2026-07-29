const db = require('../db/connection');

// Creates the electoral_divisions table used for area-level coverage lookup.
// Geometry is stored as GeoJSON (jsonb). Because this deployment runs on plain
// Postgres without PostGIS, we pre-compute each polygon's bounding box and index
// those columns, so a point lookup can cheaply shortlist candidate divisions
// before running an exact point-in-polygon test in the API layer.
async function createSchema() {
  console.log('Creating electoral_divisions table...');

  const exists = await db.schema.hasTable('electoral_divisions');
  if (exists) {
    console.log('Table already exists — dropping and recreating.');
    await db.schema.dropTable('electoral_divisions');
  }

  await db.schema.createTable('electoral_divisions', (t) => {
    t.increments('id').primary();
    t.string('ed_id').notNullable();
    t.string('ed_name').notNullable();
    t.string('county');
    t.integer('premises');
    t.float('gigabit_pct');        // FTTP + advanced cable premises passed (%)
    t.float('gigabit_nbi_pct');    // as above, including planned NBI rollout (%)
    t.float('gigabit_active_pct'); // premises actively taking gigabit service (%)
    t.float('bbox_minx').notNullable();
    t.float('bbox_miny').notNullable();
    t.float('bbox_maxx').notNullable();
    t.float('bbox_maxy').notNullable();
    t.jsonb('geometry').notNullable();
  });

  // Composite index on the bbox extents to shortlist candidate divisions by point.
  await db.schema.alterTable('electoral_divisions', (t) => {
    t.index(['bbox_minx', 'bbox_maxx'], 'ed_bbox_x_idx');
    t.index(['bbox_miny', 'bbox_maxy'], 'ed_bbox_y_idx');
    t.index('ed_id', 'ed_id_idx');
  });

  console.log('Done.');
}

createSchema()
  .catch((e) => {
    console.error('Schema creation failed:', e.message);
    process.exitCode = 1;
  })
  .finally(() => db.destroy());
