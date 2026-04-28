const db = require('../db/connection');

async function seedTestPlans() {
  console.log('🌱 Seeding test plans...');
  
  try {
    // Get provider IDs
    const eir = await db('providers').where({ name: 'Eir' }).first();
    const virgin = await db('providers').where({ name: 'Virgin Media' }).first();
    const sky = await db('providers').where({ name: 'Sky Ireland' }).first();
    const vodafone = await db('providers').where({ name: 'Vodafone' }).first();
    
    //get technology IDs
    const fiber = await db('technologies').where({ name: 'Fiber' }).first();
    const cable = await db('technologies').where({ name: 'Cable' }).first();
    const fiveG = await db('technologies').where({ name: '5G' }).first();
    
    const plans = [
      //Eir plans
      {
        provider_id: eir.id,
        technology_id: fiber.id,
        plan_name: 'Fiber 1000',
        download_speed: 1000,
        upload_speed: 100,
        monthly_price: 55.00,
        setup_fee: 0,
        contract_length: 12
      },
      {
        provider_id: eir.id,
        technology_id: fiber.id,
        plan_name: 'Fiber 500',
        download_speed: 500,
        upload_speed: 50,
        monthly_price: 45.00,
        setup_fee: 0,
        contract_length: 12
      },
      
      // Virgin Media plans
      {
        provider_id: virgin.id,
        technology_id: cable.id,
        plan_name: 'Virgin 500',
        download_speed: 500,
        upload_speed: 50,
        monthly_price: 50.00,
        setup_fee: 0,
        contract_length: 18
      },
      {
        provider_id: virgin.id,
        technology_id: cable.id,
        plan_name: 'Virgin 250',
        download_speed: 250,
        upload_speed: 25,
        monthly_price: 40.00,
        setup_fee: 0,
        contract_length: 18
      },
      
      // Sky plans
      {
        provider_id: sky.id,
        technology_id: fiber.id,
        plan_name: 'Sky Superfast',
        download_speed: 500,
        upload_speed: 50,
        monthly_price: 48.00,
        setup_fee: 50,
        contract_length: 12
      },
      
      // Vodafone plans
      {
        provider_id: vodafone.id,
        technology_id: fiveG.id,
        plan_name: '5G Home Broadband',
        download_speed: 150,
        upload_speed: 30,
        monthly_price: 40.00,
        setup_fee: 0,
        contract_length: 0
      },
    ];
    
    // Check if already seeded
    const existing = await db('plans').count('* as count');
    if (existing[0].count > 0) {
      console.log(' Plans already exist. Skipping...');
      return;
    }
    
    // Insert plans
    await db('plans').insert(plans);
    
    console.log(`Seeded ${plans.length} test plans`);
    
    // Show summary
    const plansByProvider = await db('plans')
      .select('providers.name', db.raw('COUNT(*) as count'))
      .join('providers', 'plans.provider_id', 'providers.id')
      .groupBy('providers.name');
    
    console.log('\n📦 Plans by provider:');
    plansByProvider.forEach(p => console.log(`   • ${p.name}: ${p.count} plans`));
    
  } catch (error) {
    console.error('Error seeding plans:', error.message);
    throw error;
  } finally {
    await db.destroy();
  }
}

seedTestPlans();