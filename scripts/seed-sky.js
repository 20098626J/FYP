require('dotenv').config();
const knex = require('knex')({
  client: 'pg',
  connection: process.env.DATABASE_URL
});

async function seedSky() {
  try {
    const provider = await knex('providers').where({ name: 'Sky Ireland' }).first();
    if (!provider) throw new Error('Sky Ireland not found in providers table.');

    const technology = await knex('technologies').where({ name: 'Fiber' }).first();
    if (!technology) throw new Error('Fiber technology not found.');

    const plans = [
      {
        provider_id: provider.id,
        technology_id: technology.id,
        plan_name: 'Ultrafast Plus 500Mb',
        download_speed: 500,
        upload_speed: 50,
        monthly_price: 30.00,
        setup_fee: 0.00,
        contract_length: 12,
        price_notes: null
      },
      {
        provider_id: provider.id,
        technology_id: technology.id,
        plan_name: 'Ultrafast Max 1Gb',
        download_speed: 1000,
        upload_speed: 100,
        monthly_price: 40.00,
        setup_fee: 0.00,
        contract_length: 12,
        price_notes: null
      },
      {
        provider_id: provider.id,
        technology_id: technology.id,
        plan_name: 'Gigafast 2Gb',
        download_speed: 2000,
        upload_speed: 200,
        monthly_price: 50.00,
        setup_fee: 0.00,
        contract_length: 12,
        price_notes: 'Requires Sky Gigafast+ Hub'
      },
      {
        provider_id: provider.id,
        technology_id: technology.id,
        plan_name: 'Gigafast 5Gb',
        download_speed: 5000,
        upload_speed: 500,
        monthly_price: 55.00,
        setup_fee: 0.00,
        contract_length: 12,
        price_notes: 'Requires Sky Gigafast+ Hub'
      }
    ];

    for (const plan of plans) {
      await knex('plans')
        .insert(plan)
        .onConflict(['provider_id', 'plan_name'])
        .merge();
    }

    console.log(`Seeded ${plans.length} Sky Ireland plans successfully.`);
  } catch (err) {
    console.error('Seeding failed:', err.message);
  } finally {
    await knex.destroy();
  }
}

seedSky();