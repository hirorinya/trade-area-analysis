-- Supabase table schema for population mesh data
-- Run this in your Supabase SQL editor to create the table

-- Create population_mesh table
CREATE TABLE IF NOT EXISTS population_mesh (
    id BIGSERIAL PRIMARY KEY,
    mesh_code VARCHAR(20) UNIQUE NOT NULL,
    center_lat DOUBLE PRECISION NOT NULL,
    center_lng DOUBLE PRECISION NOT NULL,
    population INTEGER NOT NULL DEFAULT 0,
    mesh_level INTEGER NOT NULL DEFAULT 5,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient spatial queries
CREATE INDEX IF NOT EXISTS idx_population_mesh_spatial 
ON population_mesh (center_lat, center_lng);

CREATE INDEX IF NOT EXISTS idx_population_mesh_level 
ON population_mesh (mesh_level);

CREATE INDEX IF NOT EXISTS idx_population_mesh_population 
ON population_mesh (population);

CREATE INDEX IF NOT EXISTS idx_population_mesh_code 
ON population_mesh (mesh_code);

-- Create a composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_population_mesh_level_spatial 
ON population_mesh (mesh_level, center_lat, center_lng);

-- Add comments for documentation
COMMENT ON TABLE population_mesh IS 'Japanese population mesh data from e-Stat census';
COMMENT ON COLUMN population_mesh.mesh_code IS 'Japanese standard mesh code (3rd-5th level)';
COMMENT ON COLUMN population_mesh.center_lat IS 'Latitude of mesh center point';
COMMENT ON COLUMN population_mesh.center_lng IS 'Longitude of mesh center point';
COMMENT ON COLUMN population_mesh.population IS 'Population count for this mesh';
COMMENT ON COLUMN population_mesh.mesh_level IS 'Mesh level: 3=1km, 4=500m, 5=250m';

-- Enable Row Level Security (RLS)
ALTER TABLE population_mesh ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read access for authenticated users
CREATE POLICY "Allow read access for authenticated users" ON population_mesh
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create policy to allow insert/update for service role (batch process)
CREATE POLICY "Allow full access for service role" ON population_mesh
    FOR ALL USING (auth.role() = 'service_role');

-- Optional: Create a function to get population data within bounds
CREATE OR REPLACE FUNCTION get_population_within_bounds(
    south_lat DOUBLE PRECISION,
    north_lat DOUBLE PRECISION,
    west_lng DOUBLE PRECISION,
    east_lng DOUBLE PRECISION,
    mesh_level_filter INTEGER DEFAULT 5
)
RETURNS TABLE (
    mesh_code VARCHAR(20),
    center_lat DOUBLE PRECISION,
    center_lng DOUBLE PRECISION,
    population INTEGER
)
LANGUAGE SQL
STABLE
AS $$
    SELECT 
        p.mesh_code,
        p.center_lat,
        p.center_lng,
        p.population
    FROM population_mesh p
    WHERE p.mesh_level = mesh_level_filter
      AND p.center_lat >= south_lat
      AND p.center_lat <= north_lat
      AND p.center_lng >= west_lng
      AND p.center_lng <= east_lng
      AND p.population > 0
    ORDER BY p.population DESC;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_population_within_bounds TO authenticated;

-- Create a view for easy querying
CREATE OR REPLACE VIEW population_mesh_summary AS
SELECT 
    mesh_level,
    COUNT(*) as mesh_count,
    SUM(population) as total_population,
    AVG(population) as avg_population,
    MIN(population) as min_population,
    MAX(population) as max_population,
    MIN(updated_at) as oldest_update,
    MAX(updated_at) as newest_update
FROM population_mesh
WHERE population > 0
GROUP BY mesh_level
ORDER BY mesh_level;

-- Grant access to the view
GRANT SELECT ON population_mesh_summary TO authenticated;

-- Show table info
\d population_mesh