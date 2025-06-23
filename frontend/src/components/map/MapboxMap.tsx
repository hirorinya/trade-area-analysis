import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { generateDemandGrid, calculateDemandCapture, calculateStorePerformance } from '../../utils/demandGrid';

// Set your Mapbox access token
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoidHJhZGUtYXJlYS1hbmFseXNpcyIsImEiOiJjbHpoaGV5M2QwNjZnMmtwNGE3bTNlOGpnIn0.example';

interface Location {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  location_type: 'store' | 'competitor' | 'poi';
  address?: string;
}

interface MapboxMapProps {
  locations: Location[];
  onLocationSelect?: (location: Location) => void;
  onMapClick?: (coordinates: [number, number]) => void;
  center?: [number, number];
  zoom?: number;
  style?: string;
  showDemandGrid?: boolean;
  gridBounds?: { north: number; south: number; east: number; west: number };
  onDemandAnalysis?: (analysis: any) => void;
}

const MapboxMap: React.FC<MapboxMapProps> = ({
  locations = [],
  onLocationSelect,
  onMapClick,
  center = [139.6917, 35.6895], // Tokyo default
  zoom = 10,
  style = 'mapbox://styles/mapbox/streets-v12',
  showDemandGrid = false,
  gridBounds,
  onDemandAnalysis
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [demandMeshes, setDemandMeshes] = useState<any[]>([]);
  const [showAnalysis, setShowAnalysis] = useState(false);

  // Initialize map
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: style,
      center: center,
      zoom: zoom,
      attributionControl: false
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add scale control
    map.current.addControl(new mapboxgl.ScaleControl({
      maxWidth: 80,
      unit: 'metric'
    }));

    // Handle map click
    if (onMapClick) {
      map.current.on('click', (e) => {
        onMapClick([e.lngLat.lng, e.lngLat.lat]);
      });
    }

    map.current.on('load', () => {
      setMapLoaded(true);
      
      // Add demand grid source and layer
      if (!map.current!.getSource('demand-grid')) {
        map.current!.addSource('demand-grid', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: []
          }
        });
        
        // Add fill layer for demand visualization
        map.current!.addLayer({
          id: 'demand-grid-fill',
          type: 'fill',
          source: 'demand-grid',
          paint: {
            'fill-color': [
              'interpolate',
              ['linear'],
              ['get', 'demand'],
              0, '#f3f4f6',  // Light gray for no demand
              10, '#dbeafe', // Light blue
              50, '#93c5fd', // Medium blue  
              100, '#3b82f6', // Blue
              200, '#1d4ed8', // Dark blue
              500, '#1e3a8a'  // Very dark blue
            ],
            'fill-opacity': 0.6
          }
        });
        
        // Add stroke layer for mesh boundaries
        map.current!.addLayer({
          id: 'demand-grid-stroke',
          type: 'line',
          source: 'demand-grid',
          paint: {
            'line-color': '#6b7280',
            'line-width': 0.5,
            'line-opacity': 0.3
          }
        });
      }
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update markers when locations change
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add new markers
    locations.forEach(location => {
      const el = document.createElement('div');
      el.className = 'mapbox-marker';
      
      // Style based on location type
      const colors = {
        store: '#2563eb',      // Blue
        competitor: '#dc2626', // Red
        poi: '#16a34a',        // Green
        candidate: '#f59e0b'   // Orange for optimized/candidate locations
      };
      
      el.style.cssText = `
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background-color: ${colors[location.location_type]};
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        cursor: pointer;
      `;

      const marker = new mapboxgl.Marker(el)
        .setLngLat([location.longitude, location.latitude])
        .addTo(map.current!);

      // Add popup
      const popup = new mapboxgl.Popup({ offset: 15 })
        .setHTML(`
          <div style="padding: 8px;">
            <h4 style="margin: 0 0 4px 0; font-size: 14px;">${location.name}</h4>
            <p style="margin: 0; font-size: 12px; color: #666;">
              ${location.location_type.charAt(0).toUpperCase() + location.location_type.slice(1)}
            </p>
            ${location.address ? `<p style="margin: 4px 0 0 0; font-size: 11px; color: #888;">${location.address}</p>` : ''}
          </div>
        `);

      marker.setPopup(popup);

      // Handle marker click
      if (onLocationSelect) {
        el.addEventListener('click', () => {
          onLocationSelect(location);
        });
      }

      markers.current.push(marker);
    });

    // Fit map to show all markers if there are locations
    if (locations.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      locations.forEach(location => {
        bounds.extend([location.longitude, location.latitude]);
      });
      
      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 15
      });
    }
  }, [locations, mapLoaded, onLocationSelect]);

  // Generate and display demand grid
  useEffect(() => {
    if (!map.current || !mapLoaded || !showDemandGrid || !gridBounds) return;
    
    console.log('Generating demand grid with bounds:', gridBounds);
    
    // Generate demand meshes
    const meshes = generateDemandGrid(gridBounds, 250); // 250m mesh size
    console.log(`Generated ${meshes.length} demand meshes`);
    
    // Calculate demand capture if we have store locations
    const storeLocations = locations.filter(loc => loc.location_type === 'store');
    if (storeLocations.length > 0) {
      const updatedMeshes = calculateDemandCapture(meshes, storeLocations, 2.0, 1.5);
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
      
      setDemandMeshes(updatedMeshes);
    } else {
      setDemandMeshes(meshes);
    }
    
    // Convert meshes to GeoJSON
    const geoJsonFeatures = meshes.map(mesh => ({
      type: 'Feature',
      properties: {
        id: mesh.id,
        population: mesh.population,
        demand: mesh.demand,
        capturedBy: mesh.capturedBy,
        captureRatio: mesh.captureRatio
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [mesh.bounds.west, mesh.bounds.north],
          [mesh.bounds.east, mesh.bounds.north],
          [mesh.bounds.east, mesh.bounds.south],
          [mesh.bounds.west, mesh.bounds.south],
          [mesh.bounds.west, mesh.bounds.north]
        ]]
      }
    }));
    
    // Update map source
    const source = map.current.getSource('demand-grid') as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features: geoJsonFeatures
      });
      
      // Show the layers
      map.current.setLayoutProperty('demand-grid-fill', 'visibility', 'visible');
      map.current.setLayoutProperty('demand-grid-stroke', 'visibility', 'visible');
    }
  }, [showDemandGrid, gridBounds, locations, mapLoaded, onDemandAnalysis]);
  
  // Hide demand grid when not needed
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    
    if (!showDemandGrid) {
      const fillLayer = map.current.getLayer('demand-grid-fill');
      const strokeLayer = map.current.getLayer('demand-grid-stroke');
      
      if (fillLayer) {
        map.current.setLayoutProperty('demand-grid-fill', 'visibility', 'none');
      }
      if (strokeLayer) {
        map.current.setLayoutProperty('demand-grid-stroke', 'visibility', 'none');
      }
    }
  }, [showDemandGrid, mapLoaded]);

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      <div 
        ref={mapContainer} 
        style={{ height: '100%', width: '100%' }}
      />
      
      {/* Map style selector */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        backgroundColor: 'white',
        borderRadius: '4px',
        padding: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        zIndex: 1000
      }}>
        <select 
          value={style}
          onChange={(e) => {
            if (map.current) {
              map.current.setStyle(e.target.value);
            }
          }}
          style={{
            border: 'none',
            background: 'none',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          <option value="mapbox://styles/mapbox/streets-v12">Streets</option>
          <option value="mapbox://styles/mapbox/satellite-v9">Satellite</option>
          <option value="mapbox://styles/mapbox/satellite-streets-v12">Satellite Streets</option>
          <option value="mapbox://styles/mapbox/light-v11">Light</option>
          <option value="mapbox://styles/mapbox/dark-v11">Dark</option>
        </select>
      </div>

      {/* Legend */}
      <div style={{
        position: 'absolute',
        bottom: '10px',
        left: '10px',
        backgroundColor: 'white',
        borderRadius: '4px',
        padding: '12px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        fontSize: '12px',
        zIndex: 1000
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Legend</div>
        
        {/* Location markers */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#2563eb', marginRight: '8px' }}></div>
          Stores
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#dc2626', marginRight: '8px' }}></div>
          Competitors
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#16a34a', marginRight: '8px' }}></div>
          Points of Interest
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: showDemandGrid ? '8px' : '0px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#f59e0b', marginRight: '8px' }}></div>
          Optimized Sites
        </div>
        
        {/* Demand grid legend */}
        {showDemandGrid && (
          <div>
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
      </div>
      
      {/* Demand Analysis Toggle */}
      {gridBounds && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '60px',
          backgroundColor: 'white',
          borderRadius: '4px',
          padding: '8px 12px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          zIndex: 1000
        }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: '12px',
            cursor: 'pointer',
            margin: 0
          }}>
            <input
              type="checkbox"
              checked={showDemandGrid}
              onChange={(e) => {
                // Note: This would need to be passed as a prop function
                // For now, just showing the UI structure
                console.log('Toggle demand grid:', e.target.checked);
              }}
              style={{ marginRight: '6px' }}
            />
            Population Grid
          </label>
        </div>
      )}
      
      {/* Analysis Results Panel */}
      {showDemandGrid && demandMeshes.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '60px',
          right: '10px',
          backgroundColor: 'white',
          borderRadius: '4px',
          padding: '12px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          fontSize: '11px',
          zIndex: 1000,
          maxWidth: '200px'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Mesh Analysis</div>
          <div>Total Meshes: {demandMeshes.length.toLocaleString()}</div>
          <div>Total Demand: {demandMeshes.reduce((sum, mesh) => sum + mesh.demand, 0).toLocaleString()}</div>
          <div>Avg Population: {Math.round(demandMeshes.reduce((sum, mesh) => sum + mesh.population, 0) / demandMeshes.length)}</div>
          {locations.filter(loc => loc.location_type === 'store').length > 0 && (
            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e5e7eb' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Store Coverage</div>
              <div>Captured Meshes: {demandMeshes.filter(mesh => mesh.capturedBy.length > 0).length}</div>
              <div>Coverage: {Math.round((demandMeshes.filter(mesh => mesh.capturedBy.length > 0).length / demandMeshes.length) * 100)}%</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MapboxMap;