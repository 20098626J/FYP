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
const recommendRoutes = require('./routes/recommend');

const cron = require('node-cron');
const { runIngestion } = require('./scripts/ingest/run');

// Scheduled auto-ingestion (in-process fallback to the GitHub Actions workflow).
// A single run at a time — overlapping triggers are ignored — so the nightly
// cron and any manual trigger can never write to the database concurrently.
let ingestRunning = false;
async function triggerIngestion(trigger) {
  if (ingestRunning) {
    console.log(`[ingest] ${trigger}: skipped, a run is already in progress`);
    return;
  }
  ingestRunning = true;
  console.log(`[ingest] ${trigger}: starting`);
  try {
    await runIngestion({});
    console.log(`[ingest] ${trigger}: done`);
  } catch (e) {
    console.error(`[ingest] ${trigger}: failed —`, e.message);
  } finally {
    ingestRunning = false;
  }
}


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
app.use('/api/recommend', recommendRoutes);

// Manual ingestion trigger (handy for demos). Disabled unless ADMIN_TOKEN is
// set; callers must send a matching x-admin-token header. Fire-and-forget: it
// starts the run and returns immediately.
app.post('/api/admin/ingest', (req, res) => {
  const token = process.env.ADMIN_TOKEN;
  if (!token || req.get('x-admin-token') !== token) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  triggerIngestion('manual admin trigger');
  res.json({ status: 'ingestion started' });
});

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

// Enable the nightly in-process ingestion by setting ENABLE_SCHEDULED_INGEST=true
// (leave it off in dev/CI). INGEST_CRON overrides the schedule; default 03:00 daily.
if (process.env.ENABLE_SCHEDULED_INGEST === 'true') {
  const schedule = process.env.INGEST_CRON || '0 3 * * *';
  if (cron.validate(schedule)) {
    cron.schedule(schedule, () => triggerIngestion(`cron "${schedule}"`));
    console.log(`Scheduled ingestion enabled: "${schedule}"`);
  } else {
    console.warn(`Invalid INGEST_CRON "${schedule}"; scheduled ingestion not started.`);
  }
}

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
  console.log(`   GET  /api/recommend?use=X&household=Y&county=Z`);


  console.log(`\n Try: http://localhost:${PORT}/api/providers/search?county=Dublin&town=Dublin%20City`);
});