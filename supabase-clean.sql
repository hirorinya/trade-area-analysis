CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_user_project_name UNIQUE(user_id, name)
);

CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    coordinates GEOMETRY(POINT, 4326) NOT NULL,
    location_type VARCHAR(50) CHECK (location_type IN ('store', 'competitor', 'poi')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_locations_coordinates ON locations USING GIST (coordinates);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_locations_project_id ON locations(project_id);
CREATE INDEX IF NOT EXISTS idx_locations_type ON locations(location_type);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own projects" ON projects;
DROP POLICY IF EXISTS "Users can manage own locations" ON locations;

CREATE POLICY "Users can manage own projects" ON projects 
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own locations" ON locations 
    FOR ALL USING (
        auth.uid() IN (
            SELECT user_id FROM projects WHERE projects.id = locations.project_id
        )
    );

CREATE OR REPLACE VIEW locations_view AS
SELECT 
    id,
    project_id,
    name,
    address,
    location_type,
    ST_X(coordinates) as longitude,
    ST_Y(coordinates) as latitude,
    coordinates,
    metadata,
    created_at,
    updated_at
FROM locations;

GRANT SELECT ON locations_view TO authenticated;

CREATE OR REPLACE FUNCTION insert_location(
    p_project_id UUID,
    p_name VARCHAR(255),
    p_address TEXT,
    p_latitude DECIMAL,
    p_longitude DECIMAL,
    p_location_type VARCHAR(50),
    p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
    location_id UUID;
BEGIN
    INSERT INTO locations (
        project_id, 
        name, 
        address, 
        coordinates, 
        location_type, 
        metadata
    ) VALUES (
        p_project_id,
        p_name,
        p_address,
        ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326),
        p_location_type,
        p_metadata
    ) RETURNING id INTO location_id;
    
    RETURN location_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_location(
    p_location_id UUID,
    p_name VARCHAR(255) DEFAULT NULL,
    p_address TEXT DEFAULT NULL,
    p_latitude DECIMAL DEFAULT NULL,
    p_longitude DECIMAL DEFAULT NULL,
    p_location_type VARCHAR(50) DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE locations 
    SET 
        name = COALESCE(p_name, name),
        address = COALESCE(p_address, address),
        coordinates = CASE 
            WHEN p_latitude IS NOT NULL AND p_longitude IS NOT NULL 
            THEN ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)
            ELSE coordinates 
        END,
        location_type = COALESCE(p_location_type, location_type),
        metadata = COALESCE(p_metadata, metadata),
        updated_at = NOW()
    WHERE id = p_location_id
    AND project_id IN (
        SELECT id FROM projects WHERE user_id = auth.uid()
    );
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION insert_location TO authenticated;
GRANT EXECUTE ON FUNCTION update_location TO authenticated;