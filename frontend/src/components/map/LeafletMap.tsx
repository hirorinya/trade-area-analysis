import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { generateDemandGrid, calculateDemandCapture, calculateStorePerformance } from '../../utils/demandGrid';

interface Location {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  location_type: string;
  address?: string;
}

interface LeafletMapProps {
  locations: Location[];
  onLocationSelect?: (location: Location) => void;
  onMapClick?: (coordinates: [number, number]) => void;
  showDemandGrid?: boolean;
  gridBounds?: { north: number; south: number; east: number; west: number } | null;
  onDemandAnalysis?: (analysis: any) => void;
}

const LeafletMap: React.FC<LeafletMapProps> = ({
  locations,
  onLocationSelect,
  onMapClick,
  showDemandGrid = false,
  gridBounds = null,
  onDemandAnalysis
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const gridLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map with Japan GSI tiles
    mapInstanceRef.current = L.map(mapRef.current).setView([35.6895, 139.6917], 10);

    // Add Japan GSI (国土地理院) tile layer
    L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://maps.gsi.go.jp/development/ichiran.html">地理院タイル</a>',
      maxZoom: 18
    }).addTo(mapInstanceRef.current);

    // Handle map clicks
    if (onMapClick) {
      mapInstanceRef.current.on('click', (e: L.LeafletMouseEvent) => {
        onMapClick([e.latlng.lng, e.latlng.lat]);
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [onMapClick]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      mapInstanceRef.current?.removeLayer(marker);
    });
    markersRef.current = [];

    // Create custom icons for different location types
    const storeIcon = L.divIcon({
      className: 'custom-marker',
      html: '<div style="background: #2563eb; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    const competitorIcon = L.divIcon({
      className: 'custom-marker',
      html: '<div style="background: #dc2626; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    const poiIcon = L.divIcon({
      className: 'custom-marker',
      html: '<div style="background: #16a34a; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    // Add markers for locations
    locations.forEach(location => {
      let icon = storeIcon;
      if (location.location_type === 'competitor') icon = competitorIcon;
      if (location.location_type === 'poi') icon = poiIcon;

      const marker = L.marker([location.latitude, location.longitude], { icon })
        .addTo(mapInstanceRef.current!)
        .bindPopup(`
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <strong>${location.name}</strong><br/>
            <span style="color: #666; font-size: 12px;">
              ${location.location_type === 'store' ? '🏪 Store' : 
                location.location_type === 'competitor' ? '🏢 Competitor' : 
                '📍 Point of Interest'}
            </span><br/>
            ${location.address ? `<span style="color: #888; font-size: 11px;">${location.address}</span>` : ''}
          </div>
        `);

      if (onLocationSelect) {
        marker.on('click', () => {
          onLocationSelect(location);
        });
      }

      markersRef.current.push(marker);
    });

    // Fit map to show all markers if there are any
    if (locations.length > 0) {
      const group = new L.FeatureGroup(markersRef.current);
      mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
    }
  }, [locations, onLocationSelect]);

  // Population grid effect
  useEffect(() => {
    if (!mapInstanceRef.current || !showDemandGrid || !gridBounds) {
      // Remove existing grid if conditions not met
      if (gridLayerRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(gridLayerRef.current);
        gridLayerRef.current = null;
      }
      return;
    }

    console.log('Generating demand grid with bounds:', gridBounds);
    
    try {
      // Generate demand meshes
      const meshes = generateDemandGrid(gridBounds, 250); // 250m mesh size
      console.log(`Generated ${meshes.length} demand meshes`);
      
      // Calculate demand capture if we have store locations
      const storeLocations = locations.filter(loc => loc.location_type === 'store');
      let updatedMeshes = meshes;
      
      if (storeLocations.length > 0) {
        updatedMeshes = calculateDemandCapture(meshes, storeLocations, 2.0, 1.5);
        const storePerformance = calculateStorePerformance(updatedMeshes, storeLocations);
        
        console.log('Store performance analysis:', storePerformance);
        
        if (onDemandAnalysis) {
          onDemandAnalysis({
            meshes: updatedMeshes,
            storePerformance,
            totalMeshes: updatedMeshes.length,
            totalDemand: updatedMeshes.reduce((sum, mesh) => sum + mesh.demand, 0)
          });
        }
      }

      // Remove existing grid layer
      if (gridLayerRef.current) {
        mapInstanceRef.current.removeLayer(gridLayerRef.current);
      }

      // Create new grid layer
      gridLayerRef.current = L.layerGroup();

      // Add mesh rectangles to the layer
      updatedMeshes.forEach(mesh => {
        // Create rectangle bounds
        const bounds = L.latLngBounds(
          [mesh.bounds.south, mesh.bounds.west],
          [mesh.bounds.north, mesh.bounds.east]
        );

        // Determine color based on demand
        let color = '#f3f4f6'; // Light gray for no demand
        if (mesh.demand >= 200) color = '#1e3a8a'; // Very dark blue
        else if (mesh.demand >= 100) color = '#1d4ed8'; // Dark blue
        else if (mesh.demand >= 50) color = '#3b82f6'; // Blue
        else if (mesh.demand >= 10) color = '#93c5fd'; // Medium blue
        else if (mesh.demand > 0) color = '#dbeafe'; // Light blue

        // Create rectangle
        const rectangle = L.rectangle(bounds, {
          color: '#6b7280',
          weight: 0.5,
          opacity: 0.3,
          fillColor: color,
          fillOpacity: 0.6
        });

        // Add popup with mesh information
        rectangle.bindPopup(`
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px;">
            <strong>Population Mesh</strong><br/>
            <span style="color: #666;">ID: ${mesh.id}</span><br/>
            <span style="color: #666;">Population: ${mesh.population}</span><br/>
            <span style="color: #666;">Demand: ${mesh.demand}</span><br/>
            ${mesh.capturedBy.length > 0 ? 
              `<span style="color: #16a34a;">Captured by: ${mesh.capturedBy.length} store(s)</span>` : 
              '<span style="color: #dc2626;">Not captured</span>'
            }
          </div>
        `);

        gridLayerRef.current!.addLayer(rectangle);
      });

      // Add grid layer to map
      gridLayerRef.current.addTo(mapInstanceRef.current);

    } catch (error) {
      console.error('Error generating population grid:', error);
    }
  }, [showDemandGrid, gridBounds, locations]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      
      {/* Map Legend */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: '12px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        fontSize: '12px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        zIndex: 1000
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>
          📍 Location Types
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
          <div style={{
            width: '12px', height: '12px', borderRadius: '50%',
            backgroundColor: '#2563eb', marginRight: '8px'
          }}></div>
          <span style={{ color: '#666' }}>Your Stores</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
          <div style={{
            width: '12px', height: '12px', borderRadius: '50%',
            backgroundColor: '#dc2626', marginRight: '8px'
          }}></div>
          <span style={{ color: '#666' }}>Competitors</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{
            width: '12px', height: '12px', borderRadius: '50%',
            backgroundColor: '#16a34a', marginRight: '8px'
          }}></div>
          <span style={{ color: '#666' }}>Points of Interest</span>
        </div>
        
        {/* Population grid legend */}
        {showDemandGrid && (
          <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #eee' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '6px', fontSize: '11px' }}>Population Demand</div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '3px' }}>
              <div style={{ width: '12px', height: '8px', backgroundColor: '#f3f4f6', marginRight: '6px', border: '1px solid #e5e7eb' }}></div>
              <span style={{ fontSize: '10px' }}>0-10</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '3px' }}>
              <div style={{ width: '12px', height: '8px', backgroundColor: '#dbeafe', marginRight: '6px' }}></div>
              <span style={{ fontSize: '10px' }}>10-50</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '3px' }}>
              <div style={{ width: '12px', height: '8px', backgroundColor: '#93c5fd', marginRight: '6px' }}></div>
              <span style={{ fontSize: '10px' }}>50-100</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '3px' }}>
              <div style={{ width: '12px', height: '8px', backgroundColor: '#3b82f6', marginRight: '6px' }}></div>
              <span style={{ fontSize: '10px' }}>100-200</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '12px', height: '8px', backgroundColor: '#1e3a8a', marginRight: '6px' }}></div>
              <span style={{ fontSize: '10px' }}>200+</span>
            </div>
          </div>
        )}
        
        <div style={{ 
          marginTop: '8px', 
          paddingTop: '8px', 
          borderTop: '1px solid #eee',
          fontSize: '11px',
          color: '#888'
        }}>
          🗾 Japan GSI Data
        </div>
      </div>
    </div>
  );
};

export default LeafletMap;