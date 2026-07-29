const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: '*'
}));
app.use(express.json());

// Logging middleware (development)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Import routes
const providersRoutes = require('./routes/providers');
const locationsRoutes = require('./routes/locations');
const plansRoutes = require('./routes/plans');
const technologiesRoutes = require('./routes/technologies');
const statsRoutes = require('./routes/stats');
const coverageRoutes = require('./routes/coverage');


//Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Broadband Ireland API',
    version: '1.0',
    endpoints: {
      providers: '/api/providers',
      locations: '/api/locations',
      plans: '/api/plans',
      technologies: '/api/technologies',
      coverage: '/api/coverage?lat=..&lng=..'
    }
  });
});

// Use routes
app.use('/api/providers', providersRoutes);
app.use('/api/locations', locationsRoutes);
app.use('/api/plans', plansRoutes);
app.use('/api/technologies', technologiesRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/coverage', coverageRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(` Server running on http://localhost:${PORT}`);
  console.log(`\n API Endpoints:`);
  console.log(`   GET  /api/providers`);
  console.log(`   GET  /api/providers/:id`);
  console.log(`   GET  /api/providers/search?county=X&town=Y`);
  console.log(`   GET  /api/locations`);
  console.log(`   GET  /api/locations/counties`);
  console.log(`   GET  /api/locations/counties/:county/towns`);
  console.log(`   GET  /api/locations/eircode/:prefix`);
  console.log(`   GET  /api/plans`);
  console.log(`   GET  /api/plans/:id`);
  console.log(`   GET  /api/plans/provider/:providerId`);
  console.log(`   GET  /api/technologies`);
  console.log(`   GET  /api/technologies/:id`);
  console.log(`   GET  /api/stats`);
  console.log(`   GET  /api/stats/:id`);
  console.log(`   GET  /api/coverage?lat=X&lng=Y`);


  console.log(`\n Try: http://localhost:${PORT}/api/providers/search?county=Dublin&town=Dublin%20City`);
});