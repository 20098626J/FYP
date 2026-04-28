const knex = require('knex')({
  client: 'pg',
  connection: process.env.DATABASE_URL
});

async function seedVirginMedia() {
  try {
    // Get Virgin Media provider ID
    const provider = await knex('providers')
      .where({ name: 'Virgin Media' })
      .first();

    if (!provider) {
      throw new Error('Virgin Media not found in providers table. Run seed-providers.js first.');
    }

    // Get Fiber technology ID
    const technology = await knex('technologies')
      .where({ name: 'Fiber' })
      .first();

    if (!technology) {
      throw new Error('Fiber technology not found. Run seed-providers.js first.');
    }

    const providerId = provider.id;
    const technologyId = technology.id;

    const plans = [
      // 500Mb plans
      {
        provider_id: providerId,
        technology_id: technologyId,
        plan_name: 'Full Fibre 500Mb - 12 Month',
        download_speed: 500,
        upload_speed: 500,
        monthly_price: 35.00,
        setup_fee: 0.00,
        contract_length: 12,
        price_notes: null
      },
      {
        provider_id: providerId,
        technology_id: technologyId,
        plan_name: 'Full Fibre 500Mb - 24 Month',
        download_speed: 500,
        upload_speed: 500,
        monthly_price: 40.00,
        setup_fee: 0.00,
        contract_length: 24,
        price_notes: null
      },
      // 1Gb plans
      {
        provider_id: providerId,
        technology_id: technologyId,
        plan_name: 'Full Fibre 1Gb - 12 Month',
        download_speed: 1000,
        upload_speed: 1000,
        monthly_price: 45.00,
        setup_fee: 0.00,
        contract_length: 12,
        price_notes: null
      },
      {
        provider_id: providerId,
        technology_id: technologyId,
        plan_name: 'Full Fibre 1Gb - 24 Month',
        download_speed: 1000,
        upload_speed: 1000,
        monthly_price: 50.00,
        setup_fee: 0.00,
        contract_length: 24,
        price_notes: null
      },
      // 2Gb plans
      {
        provider_id: providerId,
        technology_id: technologyId,
        plan_name: 'Full Fibre 2Gb - 12 Month',
        download_speed: 2000,
        upload_speed: 2000,
        monthly_price: 55.00,
        setup_fee: 0.00,
        contract_length: 12,
        price_notes: null
      },
      {
        provider_id: providerId,
        technology_id: technologyId,
        plan_name: 'Full Fibre 2Gb - 24 Month',
        download_speed: 2000,
        upload_speed: 2000,
        monthly_price: 60.00,
        setup_fee: 0.00,
        contract_length: 24,
        price_notes: null
      },
      // 5Gb plan
      {
        provider_id: providerId,
        technology_id: technologyId,
        plan_name: 'Full Fibre 5Gb - 12 Month',
        download_speed: 5000,
        upload_speed: 5000,
        monthly_price: 60.00,
        setup_fee: 0.00,
        contract_length: 12,
        price_notes: 'New product - 12 month contract only'
      }
    ];

    // Insert with upsert to avoid duplicates on re-run
    for (const plan of plans) {
      await knex('plans')
        .insert(plan)
        .onConflict(['provider_id', 'plan_name'])
        .merge();
    }

    console.log(`Seeded ${plans.length} Virgin Media plans successfully.`);
  } catch (err) {
    console.error('Seeding failed:', err.message);
  } finally {
    await knex.destroy();
  }
}

seedVirginMedia();