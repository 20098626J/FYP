const axios = require('axios');

async function testEirPage() {
  try {
    console.log('Fetching Eir page...');
    
    const response = await axios.get('https://www.eir.ie/broadband/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const html = response.data;
    
    // Check if plan info is in the HTML
    console.log('\n Checking for plan data in HTML...');
    
    const hasPrice = html.includes('€') && (html.includes('month') || html.includes('per'));
    const hasMbps = html.includes('Mbps') || html.includes('Gb');
    const hasFiber = html.includes('Fiber') || html.includes('Fibre');
    
    console.log(`   Price info found: ${hasPrice ? 'yes' : 'no'}`);
    console.log(`   Speed info found: ${hasMbps ? 'yes' : 'no'}`);
    console.log(`   Fiber mentioned: ${hasFiber ? 'yes' : 'no'}`);
    
    if (hasPrice && hasMbps) {
      console.log('\n Static HTML scraping should work (use Cheerio)');
      console.log('   File to use: scrape-eir.js');
    } else {
      console.log('\n  Content might be JavaScript-rendered (use Puppeteer)');
      console.log('   File to use: scrape-eir-puppeteer.js');
    }
    
    // Save HTML to file for inspection
    const fs = require('fs');
    fs.writeFileSync('eir-page.html', html);
    console.log('\n Saved HTML to eir-page.html for inspection');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testEirPage();