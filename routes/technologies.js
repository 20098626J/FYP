const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// Get all technologies
router.get('/', async (req, res) => {
  try {
    const technologies = await db('technologies')
      .select('*')
      .orderBy('name');
    
    res.json(technologies);
  } catch (error) {
    console.error('Error fetching technologies:', error);
    res.status(500).json({ error: 'Failed to fetch technologies' });
  }
});

// Get single technology by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const technology = await db('technologies')
      .where({ id })
      .first();
    
    if (!technology) {
      return res.status(404).json({ error: 'Technology not found' });
    }
    
    // Get count of plans using this technology
    const planCount = await db('plans')
      .where('technology_id', id)
      .count('* as count')
      .first();
    
    res.json({
      ...technology,
      plan_count: planCount.count
    });
  } catch (error) {
    console.error('Error fetching technology:', error);
    res.status(500).json({ error: 'Failed to fetch technology' });
  }
});

module.exports = router;