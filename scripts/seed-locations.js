const db = require('../db/connection');

const locations = [
  // Dublin
  { county: 'Dublin', town: 'Dublin City', eircode_prefix: 'D01' },
  { county: 'Dublin', town: 'Dublin 2', eircode_prefix: 'D02' },
  { county: 'Dublin', town: 'Dublin 3', eircode_prefix: 'D03' },
  { county: 'Dublin', town: 'Dublin 4', eircode_prefix: 'D04' },
  { county: 'Dublin', town: 'Dublin 6', eircode_prefix: 'D06' },
  { county: 'Dublin', town: 'Dublin 8', eircode_prefix: 'D08' },
  { county: 'Dublin', town: 'Tallaght', eircode_prefix: 'D24' },
  { county: 'Dublin', town: 'Swords', eircode_prefix: 'K67' },
  { county: 'Dublin', town: 'Blanchardstown', eircode_prefix: 'D15' },
  { county: 'Dublin', town: 'Dún Laoghaire', eircode_prefix: 'A96' },
  
  // Cork
  { county: 'Cork', town: 'Cork City', eircode_prefix: 'T12' },
  { county: 'Cork', town: 'Ballincollig', eircode_prefix: 'P31' },
  { county: 'Cork', town: 'Carrigaline', eircode_prefix: 'P43' },
  { county: 'Cork', town: 'Cobh', eircode_prefix: 'P24' },
  { county: 'Cork', town: 'Mallow', eircode_prefix: 'P51' },
  
  // Galway
  { county: 'Galway', town: 'Galway City', eircode_prefix: 'H91' },
  { county: 'Galway', town: 'Salthill', eircode_prefix: 'H91' },
  { county: 'Galway', town: 'Tuam', eircode_prefix: 'H54' },
  
  // Limerick
  { county: 'Limerick', town: 'Limerick City', eircode_prefix: 'V94' },
  { county: 'Limerick', town: 'Nenagh', eircode_prefix: 'E45' },
  
  // Waterford
  { county: 'Waterford', town: 'Waterford City', eircode_prefix: 'X91' },
  
  // Kilkenny
  { county: 'Kilkenny', town: 'Kilkenny City', eircode_prefix: 'R95' },
  
  // Wexford
  { county: 'Wexford', town: 'Wexford Town', eircode_prefix: 'Y35' },
  
  // Kildare
  { county: 'Kildare', town: 'Naas', eircode_prefix: 'W91' },
  { county: 'Kildare', town: 'Newbridge', eircode_prefix: 'W12' },
  
  // Meath
  { county: 'Meath', town: 'Navan', eircode_prefix: 'C15' },
  { county: 'Meath', town: 'Drogheda', eircode_prefix: 'A92' },
  
  // Wicklow
  { county: 'Wicklow', town: 'Wicklow Town', eircode_prefix: 'A67' },
  { county: 'Wicklow', town: 'Bray', eircode_prefix: 'A98' },
];

async function seedLocations() {
  console.log('🌱 Seeding locations...');
  
  try {
    // Check if already seeded
    const existing = await db('locations').count('* as count');
    
    if (existing[0].count > 0) {
      console.log(' Locations already exist.');
      console.log(`   Found ${existing[0].count} locations`);
      console.log('   Delete existing locations first if you want to re-seed.');
      return;
    }
    
    // Insert locations
    await db('locations').insert(locations);
    
    console.log(`Seeded ${locations.length} locations`);
    
    // Show summary
    const counties = await db('locations')
      .distinct('county')
      .orderBy('county');
    
    console.log(`\nCounties added: ${counties.length}`);
    counties.forEach(c => console.log(`   • ${c.county}`));
    
  } catch (error) {
    console.error('Error seeding locations:', error.message);
    throw error;
  } finally {
    await db.destroy();
  }
}

seedLocations();