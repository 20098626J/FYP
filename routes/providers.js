const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const { validateLocationSearch, validateNumericFilters } = require('../middleware/validation');


// Search providers by location with filters
router.get('/search', validateLocationSearch, validateNumericFilters, async (req, res) => {
  try {
    const { county, town, technology, minSpeed, maxPrice, sortBy } = req.query;
    
    // Validate required params
    if (!county || !town) {
      return res.status(400).json({ 
        error: 'Missing required parameters: county and town' 
      });
    }
    
    // Build query
    let query = db('providers')
      .select(
        'providers.id as provider_id',
        'providers.name as provider_name',
        'providers.website',
        'providers.logo_url',
        'plans.id as plan_id',
        'plans.plan_name',
        'plans.download_speed',
        'plans.upload_speed',
        'plans.monthly_price',
        'plans.setup_fee',
        'plans.contract_length',
        'plans.price_notes',
        'technologies.name as technology',
        'availability.coverage_quality',
        'availability.coverage_notes'
      )
      .join('plans', 'providers.id', 'plans.provider_id')
      .join('technologies', 'plans.technology_id', 'technologies.id')
      .join('availability', 'plans.id', 'availability.plan_id')
      .join('locations', 'availability.location_id', 'locations.id')
      .where('locations.county', county)
      .where('locations.town', town);
    
    // Apply filters
    if (technology) {
      query = query.where('technologies.name', technology);
    }
    
    if (minSpeed) {
      query = query.where('plans.download_speed', '>=', parseInt(minSpeed));
    }
    
    if (maxPrice) {
      query = query.where('plans.monthly_price', '<=', parseFloat(maxPrice));
    }
    
    // Apply sorting
    switch (sortBy) {
      case 'price_low':
        query = query.orderBy('plans.monthly_price', 'asc');
        break;
      case 'price_high':
        query = query.orderBy('plans.monthly_price', 'desc');
        break;
      case 'speed_high':
        query = query.orderBy('plans.download_speed', 'desc');
        break;
      case 'speed_low':
        query = query.orderBy('plans.download_speed', 'asc');
        break;
      default:
        query = query.orderBy('plans.monthly_price', 'asc');
    }
    
    const results = await query;
    
    res.json({
      location: { county, town },
      filters: { technology, minSpeed, maxPrice, sortBy },
      count: results.length,
      plans: results
    });
    
  } catch (error) {
    console.error('Error searching providers:', error);
    res.status(500).json({ 
      error: 'Failed to search providers',
      details: error.message  // ← Helpful for debugging
    });
  }
});

// Get all providers
router.get('/', async (req, res) => {
  try {
    const providers = await db('providers')
      .select('*')
      .orderBy('name');
    res.json(providers);
  } catch (error) {
    console.error('Error fetching providers:', error);
    res.status(500).json({ error: 'Failed to fetch providers' });
  }
});

// Get single provider by ID (MUST be after /search)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const provider = await db('providers')
      .where({ id })
      .first();
    
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    res.json(provider);
  } catch (error) {
    console.error('Error fetching provider:', error);
    res.status(500).json({ error: 'Failed to fetch provider' });
  }
});

module.exports = router;