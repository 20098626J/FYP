const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// Get overall statistics
router.get('/', async (req, res) => {
  try {
    const stats = {
      providers: await db('providers').count('* as count').first(),
      plans: await db('plans').count('* as count').first(),
      locations: await db('locations').count('* as count').first(),
      // Count counties from the coverage dataset (all 26), not the sparse
      // locations sample, so the headline reflects real coverage breadth.
      counties: await db('electoral_divisions')
        .whereNotNull('county')
        .distinct('county')
        .then(r => r.length),
      
      avgPrice: await db('plans').avg('monthly_price as avg').first(),
      minPrice: await db('plans').min('monthly_price as min').first(),
      maxPrice: await db('plans').max('monthly_price as max').first(),
      
      avgSpeed: await db('plans').avg('download_speed as avg').first(),
      maxSpeed: await db('plans').max('download_speed as max').first(),
      
      plansByTechnology: await db('plans')
        .select('technologies.name', db.raw('COUNT(*) as count'))
        .join('technologies', 'plans.technology_id', 'technologies.id')
        .groupBy('technologies.name')
        .orderBy('count', 'desc'),
      
      plansByProvider: await db('plans')
        .select('providers.name', db.raw('COUNT(*) as count'))
        .join('providers', 'plans.provider_id', 'providers.id')
        .groupBy('providers.name')
        .orderBy('count', 'desc')
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;