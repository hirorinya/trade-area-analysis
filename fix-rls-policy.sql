-- Fix RLS Policy for Population Data Access
-- Run this in Supabase SQL Editor to allow public access to population_mesh table

-- Enable RLS (if not already enabled)
ALTER TABLE population_mesh ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public reads of population data
-- Population data is public information, so this is safe
CREATE POLICY "Allow public read access to population data" ON population_mesh
    FOR SELECT 
    TO public 
    USING (true);

-- Optional: Allow authenticated users to read/write (for admin functions)
CREATE POLICY "Allow authenticated users full access" ON population_mesh
    FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

-- Verify the policy works
SELECT COUNT(*) as total_population_records FROM population_mesh;

-- Show sample data to confirm
SELECT mesh_code, center_lat, center_lng, population, mesh_level
FROM population_mesh 
WHERE population > 1000
ORDER BY population DESC 
LIMIT 5;