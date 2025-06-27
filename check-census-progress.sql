-- Check Census Data Loading Progress
-- Run this after loading batches to see progress

SELECT 
    COUNT(*) as total_records,
    MIN(population) as min_population,
    MAX(population) as max_population,
    AVG(population)::integer as avg_population,
    COUNT(DISTINCT mesh_level) as mesh_levels
FROM population_mesh;

-- Sample data from different areas
SELECT * FROM population_mesh 
ORDER BY population DESC 
LIMIT 10;

-- Check coverage area
SELECT 
    MIN(center_lat) as south_boundary,
    MAX(center_lat) as north_boundary,
    MIN(center_lng) as west_boundary,
    MAX(center_lng) as east_boundary
FROM population_mesh;
