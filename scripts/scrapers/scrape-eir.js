const axios = require('axios');
const cheerio = require('cheerio');
const db = require('../../db/connection');

async function scrapeEirPlans() {
  console.log('Scraping Eir broadband plans...');
  
  try {
    const url = 'https://www.eir.ie/broadband/';
    console.log('Fetching:', url);
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });
    
    const html = response.data;
    console.log('Page loaded successfully');
    
    const plans = [];
    
    // Check for each plan individually with more flexible matching
    
    // 500Mb plan - check variations
    if (html.includes('500Mb') || html.includes('500MB')) {
      if (html.includes('34.99') || html.includes('€34.99')) {
        plans.push({
          name: 'Eir Fiber 500',
          speed: 500,
          price: 34.99,
          contractLength: 12
        });
        console.log('Found: 500Mb plan');
      }
    }
    
    // 1Gb plan
    if (html.includes('1Gb') || html.includes('1GB')) {
      if (html.includes('39.99') || html.includes('€39.99')) {
        plans.push({
          name: 'Eir Fiber 1000',
          speed: 1000,
          price: 39.99,
          contractLength: 24
        });
        console.log('Found: 1Gb plan');
      }
    }
    
    // 5Gb plan
    if (html.includes('5Gb') || html.includes('5GB')) {
      if (html.includes('49.99') || html.includes('€49.99')) {
        plans.push({
          name: 'Eir Fiber 5000',
          speed: 5000,
          price: 49.99,
          contractLength: 24
        });
        console.log('Found: 5Gb plan');
      }
    }
    
    if (plans.length === 0) {
      console.log('No plans found. Website structure may have changed.');
      return;
    }
    
    console.log('\nFound', plans.length, 'plans:');
    plans.forEach(plan => {
      console.log('  -', plan.name);
      console.log('    Speed:', plan.speed, 'Mbps');
      console.log('    Price:', plan.price, 'per month');
      console.log('    Contract:', plan.contractLength, 'months');
    });
    
    await savePlansToDatabase(plans);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function savePlansToDatabase(plans) {
  console.log('\nSaving to database...');
  
  try {
    const eir = await db('providers').where({ name: 'Eir' }).first();
    if (!eir) {
      console.error('Eir provider not found in database');
      return;
    }
    
    const fiber = await db('technologies').where({ name: 'Fiber' }).first();
    
    // Delete old Eir plans
    await db('plans').where({ provider_id: eir.id }).delete();
    
    // Insert new plans
    for (const plan of plans) {
      await db('plans').insert({
        provider_id: eir.id,
        technology_id: fiber.id,
        plan_name: plan.name,
        download_speed: plan.speed,
        upload_speed: Math.round(plan.speed / 10),
        monthly_price: plan.price,
        setup_fee: 149.98,
        contract_length: plan.contractLength,
        price_notes: 'Setup fee currently waived. Price increases by €4 each April from 2027.'
      });
      console.log('  Added:', plan.name, '-', plan.price, 'per month');
    }
    
    console.log('\nSaved', plans.length, 'plans to database');
    
  } catch (error) {
    console.error('Database error:', error.message);
  } finally {
    await db.destroy();
  }
}

scrapeEirPlans()
  .then(() => {
    console.log('\nScraping complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });