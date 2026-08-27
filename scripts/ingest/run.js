require('dotenv').config();
const db = require('../../db/connection');
const adapters = require('./adapters');
const { partitionValid } = require('./lib/validate');

// Plan ingestion orchestrator.
//
// For each registered provider adapter it: fetches plans, validates them
// against the shared schema, and (unless dryRun) writes the valid ones to the
// database. Writes are guarded — a provider whose fetch fails or yields no valid
// plans is skipped, leaving its existing rows untouched, so a broken source can
// never wipe good data.
//
// The core is exported as runIngestion() so it can be called in-process (e.g.
// the server's scheduled job) as well as from the command line:
//   node scripts/ingest/run.js               fetch live and write
//   node scripts/ingest/run.js --dry-run     fetch and validate only, no writes
//   node scripts/ingest/run.js --fixture     use saved fixtures where supported
//   node scripts/ingest/run.js --provider=Eir   limit to one provider

function parseArgs(argv) {
  const opts = { dryRun: false, fixture: false, provider: null };
  for (const arg of argv) {
    if (arg === '--dry-run') opts.dryRun = true;
    else if (arg === '--fixture') opts.fixture = true;
    else if (arg.startsWith('--provider=')) opts.provider = arg.split('=')[1];
  }
  return opts;
}

// Resolve provider/technology names to ids, then replace this provider's plans
// with the freshly validated set inside a transaction. Only called when there
// is at least one valid plan, so a bad run never empties the table.
async function writeProvider(providerName, plans) {
  const provider = await db('providers').where({ name: providerName }).first();
  if (!provider) throw new Error(`provider "${providerName}" not in providers table`);

  const rows = [];
  for (const p of plans) {
    const tech = await db('technologies').where({ name: p.technologyName }).first();
    if (!tech) throw new Error(`technology "${p.technologyName}" not in technologies table`);
    rows.push({
      provider_id: provider.id,
      technology_id: tech.id,
      plan_name: p.planName,
      download_speed: p.downloadSpeed,
      upload_speed: p.uploadSpeed,
      monthly_price: p.monthlyPrice,
      setup_fee: p.setupFee ?? 0,
      contract_length: p.contractLength ?? null,
      price_notes: p.priceNotes ?? null,
      // Provenance: where this plan came from and when we fetched it.
      source: p.source ?? null,
      source_url: p.sourceUrl ?? null,
      fetched_at: new Date(),
      updated_at: new Date(),
    });
  }

  await db.transaction(async (trx) => {
    // Replace wholesale so plans withdrawn by the provider don't linger.
    await trx('plans').where({ provider_id: provider.id }).del();
    await trx('plans').insert(rows);
  });

  return rows.length;
}

// Reusable orchestrator. Accepts an options object and returns a summary array.
// Does NOT close the db connection — long-lived callers (the server) keep it
// open; the CLI wrapper below owns teardown.
async function runIngestion(opts = {}) {
  const { dryRun = false, fixture = false, provider = null } = opts;

  const selected = provider
    ? adapters.filter((a) => a.providerName.toLowerCase() === provider.toLowerCase())
    : adapters;

  if (selected.length === 0) {
    throw new Error(`No adapter matches provider "${provider}"`);
  }

  console.log(`Plan ingestion${dryRun ? ' (dry run — no writes)' : ''}`);
  console.log('─'.repeat(60));

  const summary = [];

  for (const adapter of selected) {
    const label = `${adapter.providerName} [${adapter.tier}]`;
    try {
      const fetched = await adapter.fetchPlans({ fixture });
      const { accepted, rejected } = partitionValid(fetched);

      console.log(`\n${label}`);
      console.log(`  fetched ${fetched.length}, valid ${accepted.length}, rejected ${rejected.length}`);
      for (const r of rejected) {
        console.log(`    ✗ "${r.plan.planName || '(no name)'}": ${r.errors.join('; ')}`);
      }
      for (const p of accepted) {
        console.log(`    ✓ ${p.planName} — ${p.downloadSpeed}Mb, €${p.monthlyPrice}, ${p.contractLength ?? '—'}mo  [${p.source}]`);
      }

      if (accepted.length === 0) {
        console.log('  → no valid plans; existing data left untouched');
        summary.push({ label, status: 'skipped (0 valid)', written: 0 });
        continue;
      }

      if (dryRun) {
        summary.push({ label, status: 'validated (dry run)', written: 0 });
      } else {
        const written = await writeProvider(adapter.providerName, accepted);
        console.log(`  → wrote ${written} plans`);
        summary.push({ label, status: 'written', written });
      }
    } catch (err) {
      console.log(`\n${label}`);
      console.log(`  ✗ failed: ${err.message}`);
      console.log('  → existing data left untouched');
      summary.push({ label, status: `failed: ${err.message}`, written: 0 });
    }
  }

  console.log(`\n${'─'.repeat(60)}\nSummary`);
  for (const s of summary) {
    console.log(`  ${s.label.padEnd(28)} ${s.status}`);
  }

  return summary;
}

// CLI entry point — only when run directly, not when imported by the server.
if (require.main === module) {
  runIngestion(parseArgs(process.argv.slice(2)))
    .catch((e) => {
      console.error('Ingestion crashed:', e.message);
      process.exitCode = 1;
    })
    .finally(() => db.destroy());
}

module.exports = { runIngestion };
