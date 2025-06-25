import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
}

const LeafletMap: React.FC<LeafletMapProps> = ({
  locations,
  onLocationSelect,
  onMapClick
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

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