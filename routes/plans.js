const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// Get all plans (with optional filters)
router.get('/', async (req, res) => {
  try {
    const { provider, technology, minSpeed, maxPrice } = req.query;
    
    let query = db('plans')
      .select(
        'plans.*',
        'providers.name as provider_name',
        'providers.website as provider_website',
        'technologies.name as technology_name'
      )
      .join('providers', 'plans.provider_id', 'providers.id')
      .join('technologies', 'plans.technology_id', 'technologies.id');
    
    // Apply filters
    if (provider) {
      query = query.where('providers.name', provider);
    }
    
    if (technology) {
      query = query.where('technologies.name', technology);
    }
    
    if (minSpeed) {
      query = query.where('plans.download_speed', '>=', parseInt(minSpeed));
    }
    
    if (maxPrice) {
      query = query.where('plans.monthly_price', '<=', parseFloat(maxPrice));
    }
    
    const plans = await query.orderBy('plans.monthly_price', 'asc');
    
    res.json({
      count: plans.length,
      filters: { provider, technology, minSpeed, maxPrice },
      plans
    });
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

// Get single plan by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const plan = await db('plans')
      .select(
        'plans.*',
        'providers.name as provider_name',
        'providers.website as provider_website',
        'technologies.name as technology_name',
        'technologies.description as technology_description'
      )
      .join('providers', 'plans.provider_id', 'providers.id')
      .join('technologies', 'plans.technology_id', 'technologies.id')
      .where('plans.id', id)
      .first();
    
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    
    //Get availability for this plan
    const availability = await db('availability')
      .select(
        'locations.county',
        'locations.town',
        'availability.coverage_quality',
        'availability.coverage_notes'
      )
      .join('locations', 'availability.location_id', 'locations.id')
      .where('availability.plan_id', id);
    
    res.json({
      ...plan,
      availability
    });
  } catch (error) {
    console.error('Error fetching plan:', error);
    res.status(500).json({ error: 'Failed to fetch plan' });
  }
});

//Get plans by provider ID
router.get('/provider/:providerId', async (req, res) => {
  try {
    const { providerId } = req.params;
    
    const plans = await db('plans')
      .select(
        'plans.*',
        'technologies.name as technology_name'
      )
      .join('technologies', 'plans.technology_id', 'technologies.id')
      .where('plans.provider_id', providerId)
      .orderBy('plans.monthly_price', 'asc');
    
    res.json({
      count: plans.length,
      plans
    });
  } catch (error) {
    console.error('Error fetching provider plans:', error);
    res.status(500).json({ error: 'Failed to fetch provider plans' });
  }
});

module.exports = router;