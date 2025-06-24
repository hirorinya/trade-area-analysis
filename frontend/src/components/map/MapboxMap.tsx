import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { generateDemandGrid, calculateDemandCapture, calculateStorePerformance } from '../../utils/demandGrid';

// Set your Mapbox access token
const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
if (!mapboxToken || mapboxToken.includes('your_mapbox_token_here')) {
  console.warn('⚠️ Mapbox token not configured. Please set VITE_MAPBOX_TOKEN environment variable.');
  console.warn('📖 See MAPBOX_SETUP.md for detailed setup instructions.');
}
mapboxgl.accessToken = mapboxToken || 'pk.eyJ1IjoidHJhZGUtYXJlYS1hbmFseXNpcyIsImEiOiJjbHpoaGV5M2QwNjZnMmtwNGE3bTNlOGpnIn0.example';

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
  style = 'mapbox://styles/mapbox/streets-v11',
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
  const [mapError, setMapError] = useState<string | null>(null);
  const [visualizationMode, setVisualizationMode] = useState<'grid' | 'heatmap'>('grid');
  const onDemandAnalysisRef = useRef(onDemandAnalysis);

  // Check if Mapbox token is properly configured
  const isTokenConfigured = mapboxToken && !mapboxToken.includes('your_mapbox_token_here') && !mapboxToken.includes('example');

  // Update the ref when the callback changes
  useEffect(() => {
    onDemandAnalysisRef.current = onDemandAnalysis;
  }, [onDemandAnalysis]);

  // Initialize map
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    console.log('Initializing Mapbox map...');
    console.log('Container exists:', !!mapContainer.current);
    console.log('Token configured:', isTokenConfigured);
    console.log('Token length:', mapboxToken?.length || 0);

    // Check if token is configured
    if (!isTokenConfigured) {
      setMapError('Mapbox token not configured. Please set VITE_MAPBOX_TOKEN environment variable.');
      return;
    }

    try {
      // Force clean initialization
      if (mapContainer.current) {
        mapContainer.current.innerHTML = '';
      }
      
      // Add browser compatibility check
      if (!mapboxgl.supported()) {
        setMapError('Your browser does not support Mapbox GL. Please try Chrome, Firefox, Safari, or Edge.');
        return;
      }
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: style,
        center: center,
        zoom: zoom,
        attributionControl: false,
        failIfMajorPerformanceCaveat: false, // Allow map to load even with performance issues
        preserveDrawingBuffer: true, // Help with some Windows rendering issues
        antialias: true // Improve rendering quality
      });

    // Add error handler with better sprite error handling
    map.current.on('error', (e) => {
      console.error('Mapbox error:', e);
      
      // Common Windows Chrome/Edge sprite error - can be safely ignored
      if (e.error?.message?.includes('setSprite') || 
          e.error?.message?.includes('Unimplemented') ||
          e.error?.message?.includes('style diff')) {
        console.log('Ignoring sprite/style error - this is a known issue on Windows browsers and does not affect map functionality');
        return;
      }
      
      // Only show critical errors to user
      if (!e.error?.message?.includes('sprite') && !e.error?.message?.includes('style')) {
        setMapError('Map loading error: ' + (e.error?.message || 'Unknown error'));
      }
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
        console.log('Mapbox map loaded successfully');
        setMapLoaded(true);
        setMapError(null); // Clear any errors if map loads successfully
        
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

          // Add heat-map source for points-based visualization
          map.current!.addSource('demand-heatmap', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: []
            }
          });

          // Add heat-map layer
          map.current!.addLayer({
            id: 'demand-heatmap-layer',
            type: 'heatmap',
            source: 'demand-heatmap',
            maxzoom: 15,
            paint: {
              // Increase weight based on demand property
              'heatmap-weight': [
                'interpolate',
                ['linear'],
                ['get', 'demand'],
                0, 0,
                100, 0.5,
                500, 1
              ],
              // Increase intensity as zoom level increases
              'heatmap-intensity': [
                'interpolate',
                ['linear'],
                ['zoom'],
                8, 1,
                15, 3
              ],
              // Use colors from blue to red for heat visualization
              'heatmap-color': [
                'interpolate',
                ['linear'],
                ['heatmap-density'],
                0, 'rgba(236,255,255,0)',     // Transparent
                0.1, 'rgba(224,255,255,0.6)', // Very light cyan
                0.3, 'rgba(178,223,238,0.8)', // Light blue
                0.5, 'rgba(51,160,255,0.9)',  // Medium blue  
                0.7, 'rgba(255,140,0,0.9)',   // Orange
                0.9, 'rgba(255,69,0,1)',      // Red-orange
                1, 'rgba(139,0,0,1)'          // Dark red
              ],
              // Adjust radius based on zoom level
              'heatmap-radius': [
                'interpolate',
                ['linear'],
                ['zoom'],
                8, 15,
                15, 30
              ],
              // Opacity
              'heatmap-opacity': 0.8
            }
          });

          // Add circle layer for high zoom levels (when heatmap fades out)
          map.current!.addLayer({
            id: 'demand-points',
            type: 'circle',
            source: 'demand-heatmap',
            minzoom: 14,
            paint: {
              'circle-radius': [
                'interpolate',
                ['linear'],
                ['get', 'demand'],
                0, 2,
                100, 8,
                500, 15
              ],
              'circle-color': [
                'interpolate',
                ['linear'],
                ['get', 'demand'],
                0, '#3b82f6',
                100, '#f59e0b', 
                300, '#ef4444',
                500, '#991b1b'
              ],
              'circle-opacity': 0.7,
              'circle-stroke-color': '#ffffff',
              'circle-stroke-width': 1
            }
          });
        }
      });

      // Handle map errors
      map.current.on('error', (e) => {
        console.error('Mapbox error:', e);
        if (e.error?.message?.includes('401')) {
          setMapError('Mapbox token is invalid or expired. Please check your VITE_MAPBOX_TOKEN.');
        } else if (e.error?.message?.includes('403')) {
          setMapError('Mapbox token access denied. Check token permissions and URL restrictions.');
        } else {
          setMapError('Map failed to load. Please check your internet connection and Mapbox token.');
        }
      });

    } catch (error) {
      console.error('Failed to initialize map:', error);
      setMapError('Failed to initialize map. Please check your Mapbox token configuration.');
    }

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

  // Generate and display demand grid with flow lines
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
      
      if (onDemandAnalysisRef.current) {
        onDemandAnalysisRef.current({
          meshes: updatedMeshes,
          storePerformance,
          totalMeshes: updatedMeshes.length,
          totalDemand: updatedMeshes.reduce((sum, mesh) => sum + mesh.demand, 0)
        });
      }
      
      setDemandMeshes(updatedMeshes);
      
      // Generate demand flow lines from meshes to stores
      const flowLines = updatedMeshes
        .filter(mesh => mesh.capturedBy.length > 0 && mesh.demand > 0)
        .flatMap(mesh => 
          mesh.capturedBy.map(storeId => {
            const store = storeLocations.find(s => s.id === storeId);
            if (!store) return null;
            
            const meshCenter = {
              lng: (mesh.bounds.east + mesh.bounds.west) / 2,
              lat: (mesh.bounds.north + mesh.bounds.south) / 2
            };
            
            return {
              type: 'Feature',
              properties: {
                meshId: mesh.id,
                storeId: store.id,
                storeName: store.name,
                demand: mesh.demand,
                captureRatio: mesh.captureRatio,
                flowIntensity: Math.min(mesh.demand / 50, 1) // Normalize for visualization
              },
              geometry: {
                type: 'LineString',
                coordinates: [
                  [meshCenter.lng, meshCenter.lat],
                  [store.longitude, store.latitude]
                ]
              }
            };
          })
        )
        .filter(line => line !== null);
      
      // Add or update demand flow source
      if (!map.current.getSource('demand-flows')) {
        map.current.addSource('demand-flows', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: flowLines
          }
        });
        
        // Add flow lines layer
        map.current.addLayer({
          id: 'demand-flow-lines',
          type: 'line',
          source: 'demand-flows',
          paint: {
            'line-color': [
              'interpolate',
              ['linear'],
              ['get', 'flowIntensity'],
              0, '#93c5fd',      // Light blue for low flow
              0.3, '#3b82f6',    // Medium blue
              0.6, '#1d4ed8',    // Dark blue
              1, '#1e3a8a'       // Very dark blue for high flow
            ],
            'line-width': [
              'interpolate',
              ['linear'],
              ['get', 'flowIntensity'],
              0, 0.5,
              0.3, 1,
              0.6, 1.5,
              1, 2.5
            ],
            'line-opacity': 0.7
          }
        });
        
        // Add animated flow layer for high-intensity flows
        map.current.addLayer({
          id: 'demand-flow-animated',
          type: 'line',
          source: 'demand-flows',
          filter: ['>', ['get', 'flowIntensity'], 0.5],
          paint: {
            'line-color': '#ffffff',
            'line-width': 1,
            'line-opacity': [
              'interpolate',
              ['linear'],
              ['*', ['%', ['+', ['get', 'flowIntensity'], ['*', ['get', 'demand'], 0.01]], 2], 0.5],
              0, 0.3,
              0.5, 0.8,
              1, 0.3
            ]
          }
        });
      } else {
        // Update existing flow source
        const flowSource = map.current.getSource('demand-flows') as mapboxgl.GeoJSONSource;
        flowSource.setData({
          type: 'FeatureCollection',
          features: flowLines
        });
      }
    } else {
      setDemandMeshes(meshes);
      
      // Hide flow lines if no stores
      if (map.current.getLayer('demand-flow-lines')) {
        map.current.setLayoutProperty('demand-flow-lines', 'visibility', 'none');
      }
      if (map.current.getLayer('demand-flow-animated')) {
        map.current.setLayoutProperty('demand-flow-animated', 'visibility', 'none');
      }
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
    
    // Convert meshes to point features for heat-map
    const heatmapPoints = meshes
      .filter(mesh => mesh.demand > 0) // Only include meshes with demand
      .map(mesh => ({
        type: 'Feature',
        properties: {
          demand: mesh.demand,
          population: mesh.population,
          id: mesh.id
        },
        geometry: {
          type: 'Point',
          coordinates: [
            (mesh.bounds.east + mesh.bounds.west) / 2,  // Center longitude
            (mesh.bounds.north + mesh.bounds.south) / 2  // Center latitude
          ]
        }
      }));

    // Update demand grid source
    const source = map.current.getSource('demand-grid') as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features: geoJsonFeatures
      });
      
      // Show grid layers based on visualization mode
      if (visualizationMode === 'grid') {
        map.current.setLayoutProperty('demand-grid-fill', 'visibility', 'visible');
        map.current.setLayoutProperty('demand-grid-stroke', 'visibility', 'visible');
      } else {
        map.current.setLayoutProperty('demand-grid-fill', 'visibility', 'none');
        map.current.setLayoutProperty('demand-grid-stroke', 'visibility', 'none');
      }
    }

    // Update heat-map source
    const heatmapSource = map.current.getSource('demand-heatmap') as mapboxgl.GeoJSONSource;
    if (heatmapSource) {
      heatmapSource.setData({
        type: 'FeatureCollection',
        features: heatmapPoints
      });
      
      // Show heat-map layers based on visualization mode
      if (visualizationMode === 'heatmap') {
        map.current.setLayoutProperty('demand-heatmap-layer', 'visibility', 'visible');
        map.current.setLayoutProperty('demand-points', 'visibility', 'visible');
      } else {
        map.current.setLayoutProperty('demand-heatmap-layer', 'visibility', 'none');
        map.current.setLayoutProperty('demand-points', 'visibility', 'none');
      }
    }
    
    // Show flow lines if stores exist
    if (storeLocations.length > 0) {
      if (map.current.getLayer('demand-flow-lines')) {
        map.current.setLayoutProperty('demand-flow-lines', 'visibility', 'visible');
      }
      if (map.current.getLayer('demand-flow-animated')) {
        map.current.setLayoutProperty('demand-flow-animated', 'visibility', 'visible');
      }
    }
  }, [showDemandGrid, gridBounds, locations, mapLoaded, visualizationMode]);
  
  // Hide demand grid and flow lines when not needed
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    
    if (!showDemandGrid) {
      const fillLayer = map.current.getLayer('demand-grid-fill');
      const strokeLayer = map.current.getLayer('demand-grid-stroke');
      const flowLayer = map.current.getLayer('demand-flow-lines');
      const flowAnimatedLayer = map.current.getLayer('demand-flow-animated');
      const heatmapLayer = map.current.getLayer('demand-heatmap-layer');
      const pointsLayer = map.current.getLayer('demand-points');
      
      if (fillLayer) {
        map.current.setLayoutProperty('demand-grid-fill', 'visibility', 'none');
      }
      if (strokeLayer) {
        map.current.setLayoutProperty('demand-grid-stroke', 'visibility', 'none');
      }
      if (flowLayer) {
        map.current.setLayoutProperty('demand-flow-lines', 'visibility', 'none');
      }
      if (flowAnimatedLayer) {
        map.current.setLayoutProperty('demand-flow-animated', 'visibility', 'none');
      }
      if (heatmapLayer) {
        map.current.setLayoutProperty('demand-heatmap-layer', 'visibility', 'none');
      }
      if (pointsLayer) {
        map.current.setLayoutProperty('demand-points', 'visibility', 'none');
      }
    }
  }, [showDemandGrid, mapLoaded]);

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      {/* Error Message Display */}
      {mapError && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '400px',
          textAlign: 'center',
          zIndex: 1000,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🗺️</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#dc2626', marginBottom: '12px' }}>
            Mapbox Configuration Required
          </div>
          <div style={{ fontSize: '14px', color: '#7f1d1d', marginBottom: '16px', lineHeight: '1.5' }}>
            {mapError}
          </div>
          <div style={{ fontSize: '12px', color: '#991b1b', backgroundColor: '#fee2e2', padding: '8px', borderRadius: '4px' }}>
            <strong>Setup Instructions:</strong><br/>
            1. Get a free token from <a href="https://account.mapbox.com/" target="_blank" style={{ color: '#dc2626' }}>mapbox.com</a><br/>
            2. Add VITE_MAPBOX_TOKEN to environment variables<br/>
            3. See MAPBOX_SETUP.md for detailed steps
          </div>
        </div>
      )}
      
      <div 
        ref={mapContainer} 
        style={{ 
          height: '100%', 
          width: '100%',
          opacity: mapError ? 0.3 : 1,
          filter: mapError ? 'grayscale(100%)' : 'none'
        }}
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
            margin: 0,
            marginBottom: '6px'
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
            Population Analysis
          </label>
          
          {/* Visualization Mode Toggle */}
          {showDemandGrid && (
            <div style={{ display: 'flex', gap: '4px', fontSize: '11px' }}>
              <button
                onClick={() => setVisualizationMode('grid')}
                style={{
                  padding: '4px 8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  backgroundColor: visualizationMode === 'grid' ? '#3b82f6' : '#ffffff',
                  color: visualizationMode === 'grid' ? '#ffffff' : '#374151',
                  cursor: 'pointer',
                  fontSize: '11px'
                }}
              >
                📊 Grid
              </button>
              <button
                onClick={() => setVisualizationMode('heatmap')}
                style={{
                  padding: '4px 8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  backgroundColor: visualizationMode === 'heatmap' ? '#3b82f6' : '#ffffff',
                  color: visualizationMode === 'heatmap' ? '#ffffff' : '#374151',
                  cursor: 'pointer',
                  fontSize: '11px'
                }}
              >
                🔥 Heat Map
              </button>
            </div>
          )}
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