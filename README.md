# Broadband Ireland

A web application for comparing broadband plans from major Irish providers, exploring
FTTP coverage across Ireland, and learning about broadband technology in plain English.

---

## Features

- **Plan Comparison** — Browse and filter broadband plans from Eir, Virgin Media, Sky
  Ireland and Vodafone by speed, price and contract length
- **Coverage Map** — Interactive Mapbox choropleth map showing FTTP broadband coverage
  by county, sourced from ComReg Q4 2025 quarterly data
- **Plan Recommender** — Two-step questionnaire that recommends a plan based on usage
  type and household size, with direct link to pre-filtered comparison results
- **Learn Section** — Plain English explainers covering broadband basics, connection
  types (FTTP, FTTC, Cable, 5G), and Irish infrastructure (SIRO, NBI, OpenEir)
- **REST API** — 14+ endpoints for providers, plans, locations, technologies and stats

---

## Tech Stack

### Frontend
- React 18 (Vite)
- React Router DOM
- Mapbox GL JS
- Axios

### Backend
- Node.js
- Express.js
- Knex.js (query builder)
- PostgreSQL

### Infrastructure
- AWS EC2 (backend)
- AWS RDS (database)
- AWS S3 + CloudFront (frontend)

---

## Project Structure
broadband-ireland/
├── frontend/                          # React frontend (Vite)
│   ├── public/
│   │   └── ireland-counties.geojson   # County boundary data for map
│   ├── src/
│   │   ├── components/
│   │   │   └── Navbar.jsx
│   │   ├── pages/
│   │   │   ├── HomePage.jsx
│   │   │   ├── ComparePage.jsx
│   │   │   ├── CoveragePage.jsx
│   │   │   ├── LearnPage.jsx
│   │   │   ├── RecommendPage.jsx
│   │   │   └── NotFoundPage.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env
│   └── package.json
├── db/
│   └── connection.js                  # Knex database connection
├── middleware/
│   └── validation.js                  # Request validation middleware
├── routes/
│   ├── locations.js
│   ├── plans.js
│   ├── providers.js
│   ├── stats.js
│   └── technologies.js
├── scripts/
│   ├── scrapers/
│   │   └── scrape-eir.js              # Eir plan scraper
│   ├── seed-locations.js
│   ├── seed-virgin-media.js
│   ├── seed-sky.js
│   ├── seed-vodafone.js
│   └── seed-availability.js
├── .env
├── server.js
└── package.json

---

## Prerequisites

- Node.js v18+
- PostgreSQL 14+
- A Mapbox account and public token
- pgAdmin 4 (recommended for database management)

---

## Local Development Setup

### 1. Clone the repository

```bash
git clone https://github.com/20098626J/Broadband-Info-Ireland.git
cd broadband-ireland
```

### 2. Install backend dependencies

```bash
npm install
```

### 3. Install frontend dependencies

```bash
cd frontend
npm install
cd ..
```

### 4. Set up the database

Create a PostgreSQL database called `broadband_db` using pgAdmin or the command line:

```sql
CREATE DATABASE broadband_db;
```

### 5. Configure environment variables

Create a `.env` file in the project root:
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/broadband_db
PORT=3001

Create a `.env` file inside the `frontend` folder:
VITE_API_URL=http://localhost:3001
VITE_MAPBOX_TOKEN=your_mapbox_public_token_here

### 6. Run the database schema

Open pgAdmin, connect to `broadband_db` and run the schema SQL file to create all tables.

### 7. Seed the database

Run the seed scripts in this order:

```bash
node scripts/seed-locations.js
node scripts/seed-virgin-media.js
node scripts/seed-sky.js
node scripts/seed-vodafone.js
```

For Eir plans, run the scraper:

```bash
node scripts/scrapers/scrape-eir.js
```

### 8. Start the backend

```bash
node server.js
```

The API will be available at `http://localhost:3001`.

### 9. Start the frontend

```bash
cd frontend
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## API Endpoints

### Providers

GET /api/providers                          All providers
GET /api/providers/:id                      Single provider
GET /api/providers/search?county=X&town=Y  Search with filters

### Plans

GET /api/plans                              All plans (supports ?minSpeed, ?maxPrice, ?sortBy)
GET /api/plans/:id                          Single plan
GET /api/plans/provider/:providerId         Plans by provider

### Locations

GET /api/locations                          All locations
GET /api/locations/counties                 List of counties
GET /api/locations/counties/:county/towns   Towns in a county
GET /api/locations/eircode/:prefix          Lookup by Eircode prefix

### Technologies

GET /api/technologies                       All technologies
GET /api/technologies/:id                   Single technology

### Stats

GET /api/stats                              Database statistics

---

## Data Sources

- **Plan pricing data** — Manually compiled from provider websites (Eir, Virgin Media,
  Sky Ireland, Vodafone) as of Q1 2026. Eir plans scraped programmatically.
- **Coverage map data** — ComReg Q4 2025 Quarterly Broadband Report. Reused under
  PSI Regulations 2015. © ComReg.
- **County boundary GeoJSON** — © OpenStreetMap contributors via click_that_hood.

---

## Known Limitations

- Most plan pricing data is manually seeded and may become outdated as providers change
  their offerings
- Coverage data is county-level only and does not reflect per-address availability
- No real-time availability checking — the app does not query provider APIs
- Plans are national only (no per-location data available)

---

## Deployment

The application is deployed on AWS:

- **Frontend** — S3 + CloudFront
- **Backend** — EC2 (Node.js + PM2)
- **Database** — RDS PostgreSQL

See deployment notes in the project report for full infrastructure details.

---

## Acknowledgements

- [ComReg](https://www.comreg.ie) for quarterly broadband coverage data
- [Mapbox](https://www.mapbox.com) for mapping infrastructure
- [SIRO](https://www.siro.ie) and [NBI](https://nbi.ie) for infrastructure information