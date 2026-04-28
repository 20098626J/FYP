const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// Get all counties
router.get('/counties', async (req, res) => {
  try {
    const counties = await db('locations')
      .distinct('county')
      .orderBy('county');
    
    res.json(counties.map(c => c.county));
  } catch (error) {
    console.error('Error fetching counties:', error);
    res.status(500).json({ error: 'Failed to fetch counties' });
  }
});

// Get towns for a specific county
router.get('/counties/:county/towns', async (req, res) => {
  try {
    const { county } = req.params;
    
    const towns = await db('locations')
      .select('town', 'eircode_prefix')
      .where('county', county)
      .orderBy('town');
    
    if (towns.length === 0) {
      return res.status(404).json({ 
        error: `No towns found for county: ${county}` 
      });
    }
    
    res.json(towns);
  } catch (error) {
    console.error('Error fetching towns:', error);
    res.status(500).json({ error: 'Failed to fetch towns' });
  }
});

// Get location by Eircode prefix
router.get('/eircode/:prefix', async (req, res) => {
  try {
    const { prefix } = req.params;
    
    const location = await db('locations')
      .where('eircode_prefix', prefix.toUpperCase())
      .first();
    
    if (!location) {
      return res.status(404).json({ 
        error: `No location found for Eircode prefix: ${prefix}` 
      });
    }
    
    res.json(location);
  } catch (error) {
    console.error('Error fetching location:', error);
    res.status(500).json({ error: 'Failed to fetch location' });
  }
});

// Get all locations
router.get('/', async (req, res) => {
  try {
    const { county } = req.query;
    
    let query = db('locations').select('*').orderBy('county').orderBy('town');
    
    if (county) {
      query = query.where('county', county);
    }
    
    const locations = await query;
    
    res.json({
      count: locations.length,
      locations
    });
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
});

module.exports = router;