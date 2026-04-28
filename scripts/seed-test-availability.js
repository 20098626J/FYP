const db = require('../db/connection');

async function seedTestAvailability() {
  console.log('🌱 Seeding test availability data...');
  
  try {
    // Get Dublin locations
    const dublinLocations = await db('locations')
      .where({ county: 'Dublin' })
      .select('id', 'town');
    
    // Get all plans
    const plans = await db('plans').select('id');
    
    const availability = [];
    
    // Make all plans available in Dublin City (full coverage)
    const dublinCity = dublinLocations.find(l => l.town === 'Dublin City');
    if (dublinCity) {
      plans.forEach(plan => {
        availability.push({
          location_id: dublinCity.id,
          plan_id: plan.id,
          coverage_quality: 'Full',
          coverage_notes: 'Available throughout Dublin City'
        });
      });
    }
    
    // Make some plans available in Tallaght (partial coverage)
    const tallaght = dublinLocations.find(l => l.town === 'Tallaght');
    if (tallaght && plans.length >= 3) {
      // First 3 plans available in Tallaght
      for (let i = 0; i < 3; i++) {
        availability.push({
          location_id: tallaght.id,
          plan_id: plans[i].id,
          coverage_quality: 'Partial',
          coverage_notes: 'Available in most areas'
        });
      }
    }
    
    // Check if already seeded
    const existing = await db('availability').count('* as count');
    if (existing[0].count > 0) {
      console.log('⚠️  Availability data already exists. Skipping...');
      return;
    }
    
    // Insert availability
    await db('availability').insert(availability);
    
    console.log(`Seeded ${availability.length} availability records`);
    
  } catch (error) {
    console.error('Error seeding availability:', error.message);
    throw error;
  } finally {
    await db.destroy();
  }
}

seedTestAvailability();