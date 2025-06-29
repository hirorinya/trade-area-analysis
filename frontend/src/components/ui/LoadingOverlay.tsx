import React from 'react';

interface LoadingOverlayProps {
  isLoading: boolean;
  progress?: {
    loaded: number;
    total: number;
    percentage: number;
    fromCache?: boolean;
  };
  position?: 'center' | 'top-right' | 'bottom-right';
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  isLoading, 
  progress, 
  position = 'top-right' 
}) => {
  if (!isLoading) return null;

  const positionStyles = {
    'center': {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    },
    'top-right': {
      top: '20px',
      right: '20px',
    },
    'bottom-right': {
      bottom: '20px',
      right: '20px',
    }
  };

  return (
    <div style={{
      position: 'absolute',
      ...positionStyles[position],
      background: 'rgba(255, 255, 255, 0.95)',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
      zIndex: 1000,
      minWidth: '250px',
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        marginBottom: progress ? '10px' : '0' 
      }}>
        <div style={{
          width: '20px',
          height: '20px',
          border: '3px solid #e5e7eb',
          borderTopColor: '#007bff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginRight: '10px',
        }} />
        <span style={{ fontSize: '14px', fontWeight: 500 }}>
          {progress?.fromCache ? 'Loading from cache...' : 'Loading census data...'}
        </span>
      </div>
      
      {progress && !progress.fromCache && (
        <>
          <div style={{
            width: '100%',
            height: '6px',
            background: '#e5e7eb',
            borderRadius: '3px',
            overflow: 'hidden',
            marginBottom: '8px',
          }}>
            <div style={{
              width: `${progress.percentage}%`,
              height: '100%',
              background: '#007bff',
              borderRadius: '3px',
              transition: 'width 0.3s ease',
            }} />
          </div>
          
          <div style={{ 
            fontSize: '12px', 
            color: '#6b7280',
            textAlign: 'center' 
          }}>
            {progress.loaded.toLocaleString()} / {progress.total.toLocaleString()} records
            ({progress.percentage}%)
          </div>
        </>
      )}
      
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingOverlay;