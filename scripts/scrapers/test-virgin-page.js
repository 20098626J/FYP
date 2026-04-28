const axios = require('axios');
const fs = require('fs');

async function testVirginPage() {
  try {
    console.log('Fetching Virgin Media page...');
    
    const response = await axios.get('https://www.virginmedia.ie/broadband/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const html = response.data;
    
    console.log('Checking for broadband plan data...');
    
    const hasPrice = html.includes('€') && (html.includes('month') || html.includes('/mo'));
    const hasMbps = html.includes('Mbps') || html.includes('Mb');
    const hasBroadband = html.includes('broadband') || html.includes('Broadband');
    
    console.log('Price info found:', hasPrice);
    console.log('Speed info found:', hasMbps);
    console.log('Broadband mentioned:', hasBroadband);
    
    if (hasPrice && hasMbps) {
      console.log('\nStatic HTML scraping should work');
    } else {
      console.log('\nContent might be JavaScript-rendered');
    }
    
    fs.writeFileSync('virgin-page.html', html);
    console.log('\nSaved HTML to virgin-page.html for inspection');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testVirginPage();