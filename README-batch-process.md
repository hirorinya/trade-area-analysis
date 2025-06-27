# e-Stat Population Data Batch Process

This directory contains tools to fetch real Japanese population data from e-Stat API and store it in Supabase for use in the Trade Area Analysis application.

## Overview

The batch process solves CORS restrictions by running server-side and pre-loading population data into the database. The frontend then queries this cached data instead of making real-time API calls.

## Files

- `batch-population-data.js` - Main batch processing script
- `supabase-population-schema.sql` - Database schema for population data
- `README-batch-process.md` - This documentation

## Setup

### 1. Set Environment Variables

Create a `.env` file or set these variables:

```bash
# e-Stat API key (already set in frontend/.env)
VITE_ESTAT_API_KEY=51deb74ec10b1ac3af28d8cda3e88fdcce2d1c95

# Supabase credentials (same as frontend)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 2. Create Database Table

1. Go to your Supabase dashboard
2. Open the SQL editor
3. Run the contents of `supabase-population-schema.sql`

This creates:
- `population_mesh` table with spatial indexes
- Row Level Security policies
- Helper functions for querying
- Summary view for statistics

### 3. Install Dependencies

```bash
# No additional dependencies needed - uses Node.js built-ins
node --version  # Ensure Node.js is installed
```

## Usage

### Test Run (Tokyo Region)

```bash
# Run the batch process for Tokyo area (testing)
node batch-population-data.js
```

This will:
1. Generate mesh codes for Tokyo region (35.5-36.0°N, 139.4-140.2°E)
2. Fetch population data from e-Stat API in batches
3. Upload results to your Supabase `population_mesh` table

### Full Japan Run

To process all of Japan, edit the script and use:

```javascript
// In batch-population-data.js, replace the tokyoBounds with:
const japanBounds = {
  north: 45.6,    // Hokkaido
  south: 24.0,    // Okinawa  
  east: 146.0,    // Easternmost islands
  west: 123.0     // Westernmost islands
};

await processor.run(japanBounds, 4); // Use level 4 for 500m meshes
```

⚠️ **Warning**: Full Japan processing can take several hours and generate millions of records.

## Configuration

Key settings in `batch-population-data.js`:

```javascript
const CONFIG = {
  BATCH_SIZE: 50,           // Mesh codes per API request
  REQUEST_DELAY: 1000,      // Delay between requests (ms)
  MAX_RETRIES: 3,           // Retry failed requests
  // ...
};
```

## Mesh Levels

- **Level 3**: ~1km grids (fastest, less detailed)
- **Level 4**: ~500m grids (balanced, recommended)
- **Level 5**: ~250m grids (slowest, most detailed)

## Output

The script creates records in this format:

```sql
INSERT INTO population_mesh (
  mesh_code,        -- e.g., '533945771'
  center_lat,       -- e.g., 35.6762
  center_lng,       -- e.g., 139.6503
  population,       -- e.g., 1250
  mesh_level,       -- e.g., 4
  updated_at        -- timestamp
);
```

## Monitoring

### Check Progress

```javascript
// The script outputs:
// ✅ Batch 1: Got 45 population records
// ✅ Batch 2: Got 38 population records
// ❌ Batch 3 failed: API error message
```

### Verify Data

Query your Supabase table:

```sql
-- Check summary
SELECT * FROM population_mesh_summary;

-- Count records by level
SELECT mesh_level, COUNT(*) FROM population_mesh GROUP BY mesh_level;

-- Sample data
SELECT * FROM population_mesh LIMIT 10;
```

## Frontend Integration

Once data is loaded, the frontend automatically uses it:

1. `fetchRealPopulationData()` queries the `population_mesh` table
2. Results are cached in memory for 30 minutes
3. Falls back to simulation if no data found

## Troubleshooting

### Common Issues

1. **CORS errors**: Only run this script server-side, not in browser
2. **API rate limits**: Increase `REQUEST_DELAY` if getting 429 errors
3. **Large response errors**: Reduce `BATCH_SIZE` if getting 414 errors
4. **Supabase errors**: Check your URL and API key are correct

### Error Messages

- `Missing required environment variables` - Set your .env variables
- `e-Stat API error: [message]` - Check your e-Stat API key
- `HTTP 401` - Supabase credentials are wrong
- `HTTP 429` - API rate limit, increase delays

## Scheduling

For production, run this monthly to match e-Stat's update cycle:

```bash
# Add to crontab for monthly run on 15th at 2 AM
0 2 15 * * /usr/bin/node /path/to/batch-population-data.js
```

## Performance

- **Tokyo region (level 4)**: ~5 minutes, ~1,000 records
- **Full Japan (level 4)**: ~2-4 hours, ~500,000 records  
- **Full Japan (level 5)**: ~8-12 hours, ~2,000,000 records

## Support

If you encounter issues:

1. Check the console output for specific error messages
2. Verify your API keys and Supabase credentials
3. Test with a smaller geographic area first
4. Check e-Stat API status: https://www.e-stat.go.jp/