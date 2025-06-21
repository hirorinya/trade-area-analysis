import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

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
}

const MapboxMap: React.FC<MapboxMapProps> = ({
  locations = [],
  onLocationSelect,
  onMapClick,
  center = [139.6917, 35.6895], // Tokyo default
  zoom = 10,
  style = 'mapbox://styles/mapbox/streets-v12'
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const markers = useRef<mapboxgl.Marker[]>([]);

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
        poi: '#16a34a'         // Green
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
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#2563eb', marginRight: '8px' }}></div>
          Stores
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#dc2626', marginRight: '8px' }}></div>
          Competitors
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#16a34a', marginRight: '8px' }}></div>
          Points of Interest
        </div>
      </div>
    </div>
  );
};

export default MapboxMap;