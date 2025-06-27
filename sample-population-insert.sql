-- Sample population data for Tokyo region
-- Run this in your Supabase SQL editor to populate the population_mesh table

-- Temporarily disable RLS for data insertion
ALTER TABLE population_mesh DISABLE ROW LEVEL SECURITY;

-- Insert sample Tokyo population data (first 20 records as example)
INSERT INTO population_mesh (mesh_code, center_lat, center_lng, population, mesh_level) VALUES
('533935001', 35.50312, 139.40312, 1250, 4),
('533935002', 35.50312, 139.40937, 1180, 4),
('533935003', 35.50312, 139.41562, 1320, 4),
('533935004', 35.50312, 139.42187, 1450, 4),
('533935005', 35.50312, 139.42812, 1380, 4),
('533936001', 35.50937, 139.40312, 1520, 4),
('533936002', 35.50937, 139.40937, 1680, 4),
('533936003', 35.50937, 139.41562, 1750, 4),
('533936004', 35.50937, 139.42187, 1820, 4),
('533936005', 35.50937, 139.42812, 1900, 4),
('533945001', 35.56562, 139.40312, 8500, 4),
('533945002', 35.56562, 139.40937, 9200, 4),
('533945003', 35.56562, 139.41562, 8800, 4),
('533945004', 35.56562, 139.42187, 9500, 4),
('533945005', 35.56562, 139.42812, 10200, 4),
('533946001', 35.57187, 139.40312, 12500, 4),
('533946002', 35.57187, 139.40937, 13200, 4),
('533946003', 35.57187, 139.41562, 12800, 4),
('533946004', 35.57187, 139.42187, 13500, 4),
('533946005', 35.57187, 139.42812, 14200, 4);

-- Add more data for central Tokyo (higher density areas)
INSERT INTO population_mesh (mesh_code, center_lat, center_lng, population, mesh_level) VALUES
('533955771', 35.67625, 139.65031, 15800, 4),  -- Shibuya area
('533955772', 35.67625, 139.65656, 16200, 4),
('533955773', 35.67625, 139.66281, 15600, 4),
('533955774', 35.67625, 139.66906, 16800, 4),
('533955775', 35.67625, 139.67531, 17200, 4),
('533956771', 35.68250, 139.65031, 14500, 4),
('533956772', 35.68250, 139.65656, 15000, 4),
('533956773', 35.68250, 139.66281, 14800, 4),
('533956774', 35.68250, 139.66906, 15500, 4),
('533956775', 35.68250, 139.67531, 16000, 4),
('533965771', 35.67625, 139.74531, 18500, 4),  -- Ginza area
('533965772', 35.67625, 139.75156, 19200, 4),
('533965773', 35.67625, 139.75781, 18800, 4),
('533965774', 35.67625, 139.76406, 19500, 4),
('533965775', 35.67625, 139.77031, 20000, 4),
('533966771', 35.68250, 139.74531, 17200, 4),
('533966772', 35.68250, 139.75156, 17800, 4),
('533966773', 35.68250, 139.75781, 17500, 4),
('533966774', 35.68250, 139.76406, 18200, 4),
('533966775', 35.68250, 139.77031, 18800, 4);

-- Add suburban areas (lower density)
INSERT INTO population_mesh (mesh_code, center_lat, center_lng, population, mesh_level) VALUES
('533825001', 35.55000, 139.70000, 4200, 4),   -- South Tokyo
('533825002', 35.55000, 139.70625, 3800, 4),
('533825003', 35.55000, 139.71250, 4100, 4),
('533825004', 35.55000, 139.71875, 3900, 4),
('533825005', 35.55000, 139.72500, 4300, 4),
('534025001', 35.82500, 139.70000, 3500, 4),   -- North Tokyo
('534025002', 35.82500, 139.70625, 3200, 4),
('534025003', 35.82500, 139.71250, 3600, 4),
('534025004', 35.82500, 139.71875, 3400, 4),
('534025005', 35.82500, 139.72500, 3800, 4);

-- Add some water/park areas with minimal population
INSERT INTO population_mesh (mesh_code, center_lat, center_lng, population, mesh_level) VALUES
('533950001', 35.69000, 139.76000, 50, 4),     -- Imperial Palace area
('533950002', 35.69000, 139.76625, 30, 4),
('533950003', 35.69000, 139.77250, 45, 4),
('533940001', 35.68000, 139.69000, 80, 4),     -- Yoyogi Park area
('533940002', 35.68000, 139.69625, 60, 4),
('533940003', 35.68000, 139.70250, 75, 4);

-- Re-enable RLS
ALTER TABLE population_mesh ENABLE ROW LEVEL SECURITY;

-- Verify the data was inserted
SELECT 
    COUNT(*) as total_records,
    MIN(population) as min_population,
    MAX(population) as max_population,
    AVG(population)::integer as avg_population,
    mesh_level
FROM population_mesh 
GROUP BY mesh_level
ORDER BY mesh_level;

-- Sample query to test geographic bounds
SELECT mesh_code, center_lat, center_lng, population
FROM population_mesh
WHERE center_lat BETWEEN 35.65 AND 35.70
  AND center_lng BETWEEN 139.65 AND 139.70
ORDER BY population DESC
LIMIT 10;