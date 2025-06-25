import React, { useState } from 'react';
import { theme } from '../../styles/theme';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface HistoricalDataInputProps {
  onDataAdded: (storeData: any) => void;
  onCancel: () => void;
}

const HistoricalDataInput: React.FC<HistoricalDataInputProps> = ({ onDataAdded, onCancel }) => {
  const [storeData, setStoreData] = useState({
    name: '',
    latitude: '',
    longitude: '',
    revenue: '',
    profit: '',
    customerCount: '',
    marketShare: '',
    growthRate: '',
    openDate: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!storeData.name || !storeData.latitude || !storeData.longitude) {
      alert('Please fill in store name, latitude, and longitude');
      return;
    }

    // Convert numeric fields
    const processedData = {
      name: storeData.name,
      latitude: parseFloat(storeData.latitude),
      longitude: parseFloat(storeData.longitude),
      revenue: parseFloat(storeData.revenue) || 0,
      profit: parseFloat(storeData.profit) || 0,
      customerCount: parseInt(storeData.customerCount) || 0,
      marketShare: parseFloat(storeData.marketShare) || 0,
      growthRate: parseFloat(storeData.growthRate) || 0,
      openDate: storeData.openDate || new Date().toISOString().split('T')[0],
      dataSource: 'manual'
    };

    onDataAdded(processedData);
    
    // Reset form
    setStoreData({
      name: '',
      latitude: '',
      longitude: '',
      revenue: '',
      profit: '',
      customerCount: '',
      marketShare: '',
      growthRate: '',
      openDate: ''
    });
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const csv = event.target?.result as string;
      const lines = csv.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const stores = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values.length < headers.length) continue;
        
        const store: any = { dataSource: 'csv' };
        headers.forEach((header, index) => {
          const value = values[index]?.trim();
          if (!value) return;
          
          // Map common header variations
          switch (header) {
            case 'name':
            case 'store_name':
            case 'storename':
              store.name = value;
              break;
            case 'lat':
            case 'latitude':
              store.latitude = parseFloat(value);
              break;
            case 'lng':
            case 'lon':
            case 'longitude':
              store.longitude = parseFloat(value);
              break;
            case 'revenue':
            case 'sales':
            case 'annual_revenue':
              store.revenue = parseFloat(value);
              break;
            case 'profit':
            case 'net_profit':
            case 'annual_profit':
              store.profit = parseFloat(value);
              break;
            case 'customers':
            case 'customer_count':
            case 'daily_customers':
              store.customerCount = parseInt(value);
              break;
            case 'market_share':
            case 'marketshare':
              store.marketShare = parseFloat(value);
              break;
            case 'growth':
            case 'growth_rate':
              store.growthRate = parseFloat(value);
              break;
            case 'open_date':
            case 'opening_date':
              store.openDate = value;
              break;
          }
        });
        
        if (store.name && store.latitude && store.longitude) {
          stores.push(store);
        }
      }
      
      // Add all valid stores
      stores.forEach(store => onDataAdded(store));
      alert(`Successfully imported ${stores.length} stores from CSV`);
    };
    
    reader.readAsText(file);
    e.target.value = ''; // Reset file input
  };

  return (
    <div style={{
      backgroundColor: theme.colors.white,
      border: `1px solid ${theme.colors.gray[300]}`,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing[4],
      marginTop: theme.spacing[3]
    }}>
      <h5 style={{
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.semibold,
        marginBottom: theme.spacing[4],
        color: theme.colors.gray[900]
      }}>
        Add Store Performance Data
      </h5>

      {/* CSV Upload Option */}
      <div style={{
        backgroundColor: theme.colors.blue[50],
        border: `1px solid ${theme.colors.blue[200]}`,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing[3],
        marginBottom: theme.spacing[4]
      }}>
        <div style={{ fontSize: theme.typography.fontSize.sm, fontWeight: theme.typography.fontWeight.medium, marginBottom: theme.spacing[2] }}>
          📄 CSV Upload (Recommended)
        </div>
        <p style={{ fontSize: theme.typography.fontSize.xs, color: theme.colors.gray[600], marginBottom: theme.spacing[2] }}>
          Expected columns: name, latitude, longitude, revenue, profit, customer_count, market_share, growth_rate
        </p>
        <input
          type="file"
          accept=".csv"
          onChange={handleCSVUpload}
          style={{
            fontSize: theme.typography.fontSize.sm,
            padding: theme.spacing[2],
            border: `1px solid ${theme.colors.gray[300]}`,
            borderRadius: theme.borderRadius.sm,
            backgroundColor: theme.colors.white
          }}
        />
      </div>

      {/* Manual Input Form */}
      <div style={{
        backgroundColor: theme.colors.gray[50],
        border: `1px solid ${theme.colors.gray[200]}`,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing[3]
      }}>
        <div style={{ fontSize: theme.typography.fontSize.sm, fontWeight: theme.typography.fontWeight.medium, marginBottom: theme.spacing[3] }}>
          ✏️ Manual Entry
        </div>
        
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: theme.spacing[3], marginBottom: theme.spacing[4] }}>
            <Input
              label="Store Name *"
              value={storeData.name}
              onChange={(e) => setStoreData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Shibuya Store"
              required
            />
            
            <Input
              label="Latitude *"
              type="number"
              value={storeData.latitude}
              onChange={(e) => setStoreData(prev => ({ ...prev, latitude: e.target.value }))}
              placeholder="35.6762"
              step="0.000001"
              required
            />
            
            <Input
              label="Longitude *"
              type="number"
              value={storeData.longitude}
              onChange={(e) => setStoreData(prev => ({ ...prev, longitude: e.target.value }))}
              placeholder="139.6503"
              step="0.000001"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: theme.spacing[3], marginBottom: theme.spacing[4] }}>
            <Input
              label="Annual Revenue (¥)"
              type="number"
              value={storeData.revenue}
              onChange={(e) => setStoreData(prev => ({ ...prev, revenue: e.target.value }))}
              placeholder="5000000"
              min="0"
            />
            
            <Input
              label="Annual Profit (¥)"
              type="number"
              value={storeData.profit}
              onChange={(e) => setStoreData(prev => ({ ...prev, profit: e.target.value }))}
              placeholder="500000"
              min="0"
            />
            
            <Input
              label="Daily Customers"
              type="number"
              value={storeData.customerCount}
              onChange={(e) => setStoreData(prev => ({ ...prev, customerCount: e.target.value }))}
              placeholder="200"
              min="0"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: theme.spacing[3], marginBottom: theme.spacing[4] }}>
            <Input
              label="Market Share (0-1)"
              type="number"
              value={storeData.marketShare}
              onChange={(e) => setStoreData(prev => ({ ...prev, marketShare: e.target.value }))}
              placeholder="0.15"
              min="0"
              max="1"
              step="0.01"
            />
            
            <Input
              label="Growth Rate (%)"
              type="number"
              value={storeData.growthRate}
              onChange={(e) => setStoreData(prev => ({ ...prev, growthRate: e.target.value }))}
              placeholder="12"
              step="0.1"
            />
            
            <Input
              label="Opening Date"
              type="date"
              value={storeData.openDate}
              onChange={(e) => setStoreData(prev => ({ ...prev, openDate: e.target.value }))}
            />
          </div>

          <div style={{ display: 'flex', gap: theme.spacing[2], justifyContent: 'flex-end' }}>
            <Button onClick={onCancel} variant="secondary" size="small">
              Cancel
            </Button>
            <Button type="submit" size="small">
              Add Store Data
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HistoricalDataInput;