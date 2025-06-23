import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HistoricalDataInput from '../analysis/HistoricalDataInput';

describe('HistoricalDataInput Component', () => {
  const mockOnDataAdded = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    mockOnDataAdded.mockClear();
    mockOnCancel.mockClear();
  });

  const renderComponent = () => {
    return render(
      <HistoricalDataInput
        onDataAdded={mockOnDataAdded}
        onCancel={mockOnCancel}
      />
    );
  };

  describe('Component Rendering', () => {
    it('should render all form fields', () => {
      renderComponent();
      
      expect(screen.getByLabelText(/store name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/latitude/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/longitude/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/annual revenue/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/annual profit/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/daily customers/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/market share/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/growth rate/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/opening date/i)).toBeInTheDocument();
    });

    it('should render CSV upload section', () => {
      renderComponent();
      
      expect(screen.getByText(/csv upload/i)).toBeInTheDocument();
      expect(screen.getByText(/expected columns/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add store data/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    it('should update form fields when user types', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const nameInput = screen.getByLabelText(/store name/i);
      await user.type(nameInput, 'Test Store');
      
      expect(nameInput).toHaveValue('Test Store');
    });

    it('should handle numeric input fields', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const latInput = screen.getByLabelText(/latitude/i);
      const lngInput = screen.getByLabelText(/longitude/i);
      const revenueInput = screen.getByLabelText(/annual revenue/i);
      
      await user.type(latInput, '35.6762');
      await user.type(lngInput, '139.6503');
      await user.type(revenueInput, '5000000');
      
      expect(latInput).toHaveValue(35.6762);
      expect(lngInput).toHaveValue(139.6503);
      expect(revenueInput).toHaveValue(5000000);
    });

    it('should handle date input', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const dateInput = screen.getByLabelText(/opening date/i);
      await user.type(dateInput, '2023-01-15');
      
      expect(dateInput).toHaveValue('2023-01-15');
    });
  });

  describe('Form Submission', () => {
    it('should call onDataAdded with correct data when form is submitted', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      // Fill required fields
      await user.type(screen.getByLabelText(/store name/i), 'Test Store');
      await user.type(screen.getByLabelText(/latitude/i), '35.6762');
      await user.type(screen.getByLabelText(/longitude/i), '139.6503');
      
      // Fill optional fields
      await user.type(screen.getByLabelText(/annual revenue/i), '5000000');
      await user.type(screen.getByLabelText(/annual profit/i), '500000');
      await user.type(screen.getByLabelText(/daily customers/i), '200');
      await user.type(screen.getByLabelText(/market share/i), '0.15');
      await user.type(screen.getByLabelText(/growth rate/i), '12');
      await user.type(screen.getByLabelText(/opening date/i), '2023-01-15');
      
      await user.click(screen.getByRole('button', { name: /add store data/i }));
      
      expect(mockOnDataAdded).toHaveBeenCalledWith({
        name: 'Test Store',
        latitude: 35.6762,
        longitude: 139.6503,
        revenue: 5000000,
        profit: 500000,
        customerCount: 200,
        marketShare: 0.15,
        growthRate: 12,
        openDate: '2023-01-15',
        dataSource: 'manual'
      });
    });

    it('should show validation error for missing required fields', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      // Mock alert
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
      
      await user.click(screen.getByRole('button', { name: /add store data/i }));
      
      expect(alertSpy).toHaveBeenCalledWith('Please fill in store name, latitude, and longitude');
      expect(mockOnDataAdded).not.toHaveBeenCalled();
      
      alertSpy.mockRestore();
    });

    it('should reset form after successful submission', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const nameInput = screen.getByLabelText(/store name/i);
      const latInput = screen.getByLabelText(/latitude/i);
      const lngInput = screen.getByLabelText(/longitude/i);
      
      await user.type(nameInput, 'Test Store');
      await user.type(latInput, '35.6762');
      await user.type(lngInput, '139.6503');
      
      await user.click(screen.getByRole('button', { name: /add store data/i }));
      
      expect(nameInput).toHaveValue('');
      expect(latInput).toHaveValue(null);
      expect(lngInput).toHaveValue(null);
    });

    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      await user.click(screen.getByRole('button', { name: /cancel/i }));
      
      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('CSV Upload', () => {
    it('should handle CSV file upload', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const csvContent = `name,latitude,longitude,revenue,profit,customer_count,market_share,growth_rate
Store1,35.6762,139.6503,5000000,500000,200,0.15,12
Store2,35.6892,139.6917,4000000,400000,180,0.12,8`;
      
      const file = new File([csvContent], 'stores.csv', { type: 'text/csv' });
      const fileInput = screen.getByRole('button', { name: /choose file/i }) || 
                       screen.getByDisplayValue('') || 
                       document.querySelector('input[type=\"file\"]');
      
      if (fileInput) {
        await user.upload(fileInput, file);
        
        await waitFor(() => {
          expect(mockOnDataAdded).toHaveBeenCalledTimes(2);
        });
        
        expect(mockOnDataAdded).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Store1',
            latitude: 35.6762,
            longitude: 139.6503,
            revenue: 5000000,
            dataSource: 'csv'
          })
        );
      }
    });

    it('should handle malformed CSV gracefully', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const malformedCsv = `name,latitude,longitude
Store1,invalid_lat,invalid_lng
Store2,,`;
      
      const file = new File([malformedCsv], 'malformed.csv', { type: 'text/csv' });
      const fileInput = document.querySelector('input[type=\"file\"]');
      
      if (fileInput) {
        await user.upload(fileInput, file);
        
        // Should not call onDataAdded for invalid entries
        expect(mockOnDataAdded).not.toHaveBeenCalled();
      }
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      renderComponent();
      
      const inputs = screen.getAllByRole('textbox');
      inputs.forEach(input => {
        expect(input).toHaveAccessibleName();
      });
    });

    it('should have proper button roles', () => {
      renderComponent();
      
      expect(screen.getByRole('button', { name: /add store data/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const nameInput = screen.getByLabelText(/store name/i);
      nameInput.focus();
      
      // Tab through form fields
      await user.tab();
      expect(screen.getByLabelText(/latitude/i)).toHaveFocus();
      
      await user.tab();
      expect(screen.getByLabelText(/longitude/i)).toHaveFocus();
    });
  });

  describe('Edge Cases', () => {
    it('should handle default values for optional fields', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      await user.type(screen.getByLabelText(/store name/i), 'Minimal Store');
      await user.type(screen.getByLabelText(/latitude/i), '35.6762');
      await user.type(screen.getByLabelText(/longitude/i), '139.6503');
      
      await user.click(screen.getByRole('button', { name: /add store data/i }));
      
      expect(mockOnDataAdded).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Minimal Store',
          latitude: 35.6762,
          longitude: 139.6503,
          revenue: 0,
          profit: 0,
          customerCount: 0,
          marketShare: 0,
          growthRate: 0,
          dataSource: 'manual'
        })
      );
    });

    it('should handle very large numbers', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      await user.type(screen.getByLabelText(/store name/i), 'Big Store');
      await user.type(screen.getByLabelText(/latitude/i), '35.6762');
      await user.type(screen.getByLabelText(/longitude/i), '139.6503');
      await user.type(screen.getByLabelText(/annual revenue/i), '999999999');
      
      await user.click(screen.getByRole('button', { name: /add store data/i }));
      
      expect(mockOnDataAdded).toHaveBeenCalledWith(
        expect.objectContaining({
          revenue: 999999999
        })
      );
    });
  });
});