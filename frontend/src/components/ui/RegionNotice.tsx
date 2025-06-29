import React from 'react';

interface RegionNoticeProps {
  region: string;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  onLoadData?: () => void;
}

const RegionNotice: React.FC<RegionNoticeProps> = ({ region, bounds, onLoadData }) => {
  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      background: 'rgba(255, 255, 255, 0.95)',
      padding: '30px',
      borderRadius: '12px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
      zIndex: 1000,
      maxWidth: '400px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>🗾</div>
      
      <h3 style={{ 
        margin: '0 0 12px 0', 
        fontSize: '18px',
        color: '#1f2937' 
      }}>
        {region} Region
      </h3>
      
      <p style={{ 
        margin: '0 0 16px 0', 
        fontSize: '14px',
        color: '#6b7280',
        lineHeight: '1.5'
      }}>
        Census data not loaded for this region yet.
        <br />
        Currently showing: Tokyo area only
      </p>
      
      <div style={{
        background: '#f3f4f6',
        padding: '12px',
        borderRadius: '6px',
        fontSize: '12px',
        color: '#4b5563',
        marginBottom: '16px'
      }}>
        <strong>Viewing:</strong> Lat {bounds.south.toFixed(1)}°-{bounds.north.toFixed(1)}°, 
        Lng {bounds.west.toFixed(1)}°-{bounds.east.toFixed(1)}°
      </div>
      
      {onLoadData && (
        <button 
          onClick={onLoadData}
          style={{
            background: '#007bff',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: 'pointer',
            marginRight: '8px'
          }}
        >
          Load {region} Data
        </button>
      )}
      
      <button 
        onClick={() => window.location.reload()}
        style={{
          background: '#6b7280',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '6px',
          fontSize: '14px',
          cursor: 'pointer'
        }}
      >
        Return to Tokyo
      </button>
      
      <div style={{
        marginTop: '16px',
        fontSize: '11px',
        color: '#9ca3af'
      }}>
        💡 Run the census loading script to add more regions
      </div>
    </div>
  );
};

export default RegionNotice;