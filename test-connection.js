const db = require('./db/connection');

async function testConnection() {
  try {
    // Test query
    const result = await db.raw('SELECT NOW() as current_time');
    console.log('Connected to database!');
    console.log('Current time:', result.rows[0].current_time);
    
    // Get providers
    const providers = await db('providers').select('*');
    console.log('\n📡 Providers in database:', providers.length);
    providers.forEach(p => console.log(`  - ${p.name}`));
    
    // Close connection
    await db.destroy();
    console.log('\n✅ Test complete!');
  } catch (error) {
    console.error('Connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();