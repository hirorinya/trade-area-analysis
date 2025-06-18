# Trade Area Analysis Tool

A comprehensive tool for analyzing market opportunities, understanding customer catchment areas, and making data-driven location decisions.

## Project Structure

```
trade-area-analysis/
├── frontend/          # React TypeScript frontend
├── backend/           # Node.js Express backend
├── database/          # PostgreSQL with PostGIS setup
├── docs/             # Additional documentation
├── docker-compose.yml # Development environment
└── README.md         # This file
```

## Quick Start

1. **Prerequisites**
   - Node.js 18+
   - Docker & Docker Compose
   - PostgreSQL with PostGIS

2. **Development Setup**
   ```bash
   # Clone and setup
   cd trade-area-analysis
   
   # Start development environment
   docker-compose up -d
   
   # Install dependencies
   cd frontend && npm install
   cd ../backend && npm install
   
   # Start development servers
   npm run dev:frontend  # Frontend on port 3000
   npm run dev:backend   # Backend on port 8000
   ```

## Architecture

- **Frontend**: React 18 + TypeScript + Mapbox GL JS
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL 14+ with PostGIS extension
- **Mapping**: Mapbox APIs for mapping and geocoding
- **Demographics**: Census Bureau APIs

## Key Features

- Drive-time and distance-based trade area analysis
- Demographic data integration and visualization
- Competitor mapping and market analysis
- Interactive maps with customizable layers
- Comprehensive reporting and export capabilities

For detailed documentation, see [trade-area-analysis-docs.md](../trade-area-analysis-docs.md)