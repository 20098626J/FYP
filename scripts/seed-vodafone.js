require('dotenv').config();
const knex = require('knex')({
  client: 'pg',
  connection: process.env.DATABASE_URL
});

async function seedVodafone() {
  try {
    const provider = await knex('providers').where({ name: 'Vodafone' }).first();
    if (!provider) throw new Error('Vodafone not found in providers table.');

    const technology = await knex('technologies').where({ name: 'Fiber' }).first();
    if (!technology) throw new Error('Fiber technology not found.');

    const plans = [
      {
        provider_id: provider.id,
        technology_id: technology.id,
        plan_name: 'Simply Broadband 500Mb',
        download_speed: 500,
        upload_speed: 500,
        monthly_price: 40.00,
        setup_fee: 0.00,
        contract_length: 24,
        price_notes: null
      },
      {
        provider_id: provider.id,
        technology_id: technology.id,
        plan_name: 'Simply Broadband 1Gb',
        download_speed: 1000,
        upload_speed: 1000,
        monthly_price: 50.00,
        setup_fee: 0.00,
        contract_length: 24,
        price_notes: null
      },
      {
        provider_id: provider.id,
        technology_id: technology.id,
        plan_name: 'Simply Broadband 2Gb',
        download_speed: 2000,
        upload_speed: 2000,
        monthly_price: 70.00,
        setup_fee: 0.00,
        contract_length: 24,
        price_notes: null
      }
    ];

    for (const plan of plans) {
      await knex('plans')
        .insert(plan)
        .onConflict(['provider_id', 'plan_name'])
        .merge();
    }

    console.log(`Seeded ${plans.length} Vodafone plans successfully.`);
  } catch (err) {
    console.error('Seeding failed:', err.message);
  } finally {
    await knex.destroy();
  }
}

seedVodafone();