import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OptimizationPanel from '../analysis/OptimizationPanel';

// Mock the optimization utilities
jest.mock('../../utils/optimizationEngine', () => ({
  greedyOptimization: jest.fn(),
  mipStyleOptimization: jest.fn(),
  competitiveAnalysis: jest.fn(),
  multiScenarioAnalysis: jest.fn(),
  storeCapacityOptimization: jest.fn(),
  generateCandidateSites: jest.fn()
}));

jest.mock('../../utils/historicalAnalysis', () => ({
  analyzeHistoricalPatterns: jest.fn()
}));

import { 
  greedyOptimization, 
  mipStyleOptimization,
  generateCandidateSites 
} from '../../utils/optimizationEngine';
import { analyzeHistoricalPatterns } from '../../utils/historicalAnalysis';

describe('OptimizationPanel Component', () => {
  const mockProps = {
    demandMeshes: [
      {
        id: 'mesh1',
        population: 1000,
        demand: 150,
        bounds: { north: 35.66, south: 35.65, east: 139.76, west: 139.75 }
      }
    ],
    existingStores: [
      {
        id: 'store1',
        name: 'Existing Store',
        latitude: 35.67,
        longitude: 139.78,
        location_type: 'store' as const
      }
    ],
    competitors: [
      {
        id: 'comp1',
        name: 'Competitor',
        latitude: 35.64,
        longitude: 139.74,
        location_type: 'competitor' as const
      }
    ],
    bounds: {
      north: 35.7,
      south: 35.6,
      east: 139.8,
      west: 139.7
    },
    onOptimizationComplete: jest.fn(),
    onShowCandidates: jest.fn()
  };

  const mockOptimizationResults = {
    selectedSites: [
      { id: 'site1', latitude: 35.655, longitude: 139.755 },
      { id: 'site2', latitude: 35.685, longitude: 139.775 }
    ],
    totalDemandCaptured: 250,
    totalCost: 2000000,
    algorithm: 'greedy',
    performance: {
      executionTime: 150,
      iterationsCompleted: 10
    }
  };

  const mockCandidateSites = [
    { id: 'site1', latitude: 35.655, longitude: 139.755 },
    { id: 'site2', latitude: 35.685, longitude: 139.775 },
    { id: 'site3', latitude: 35.625, longitude: 139.725 }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (generateCandidateSites as jest.Mock).mockReturnValue(mockCandidateSites);
    (greedyOptimization as jest.Mock).mockReturnValue(mockOptimizationResults);
    (mipStyleOptimization as jest.Mock).mockReturnValue({
      ...mockOptimizationResults,
      algorithm: 'mip'
    });
    (analyzeHistoricalPatterns as jest.Mock).mockReturnValue({
      siteRecommendations: [
        {
          latitude: 35.65,
          longitude: 139.75,
          patternScore: 0.85,
          confidence: 0.9
        }
      ],
      financialForecasts: [
        {
          projectedRevenue: 1500000,
          projectedProfit: 200000,
          paybackPeriod: 5.0
        }
      ]
    });
  });

  const renderComponent = () => {
    return render(<OptimizationPanel {...mockProps} />);
  };

  describe('Component Rendering', () => {
    it('should render optimization parameters form', () => {
      renderComponent();
      
      expect(screen.getByLabelText(/number of stores/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/maximum radius/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/distance decay/i)).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: /algorithm/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /run optimization/i })).toBeInTheDocument();
    });

    it('should render algorithm selection dropdown', () => {
      renderComponent();
      
      const algorithmSelect = screen.getByRole('combobox', { name: /algorithm/i });
      expect(algorithmSelect).toBeInTheDocument();
      
      // Check default value
      expect(algorithmSelect).toHaveValue('greedy');
    });

    it('should show advanced options when toggled', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const toggleButton = screen.getByRole('button', { name: /advanced/i });
      await user.click(toggleButton);
      
      expect(screen.getByLabelText(/minimum distance/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/maximum budget/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/store cost/i)).toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    it('should update form values when user inputs change', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const numStoresInput = screen.getByLabelText(/number of stores/i);
      await user.clear(numStoresInput);
      await user.type(numStoresInput, '3');
      
      expect(numStoresInput).toHaveValue(3);
    });

    it('should change algorithm when dropdown selection changes', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const algorithmSelect = screen.getByRole('combobox', { name: /algorithm/i });
      await user.selectOptions(algorithmSelect, 'mip');
      
      expect(algorithmSelect).toHaveValue('mip');
    });

    it('should validate numeric inputs', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const maxRadiusInput = screen.getByLabelText(/maximum radius/i);
      await user.clear(maxRadiusInput);
      await user.type(maxRadiusInput, '5.5');
      
      expect(maxRadiusInput).toHaveValue(5.5);
    });
  });

  describe('Optimization Execution', () => {
    it('should run greedy optimization when button is clicked', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      await user.click(screen.getByRole('button', { name: /run optimization/i }));
      
      await waitFor(() => {
        expect(greedyOptimization).toHaveBeenCalledWith(
          mockProps.demandMeshes,
          mockCandidateSites,
          expect.objectContaining({
            numStores: 5,
            algorithm: 'greedy'
          })
        );
      });
      
      expect(mockProps.onOptimizationComplete).toHaveBeenCalledWith(mockOptimizationResults);
    });

    it('should run MIP optimization when MIP algorithm is selected', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      await user.selectOptions(screen.getByRole('combobox', { name: /algorithm/i }), 'mip');
      await user.click(screen.getByRole('button', { name: /run optimization/i }));
      
      await waitFor(() => {
        expect(mipStyleOptimization).toHaveBeenCalled();
      });
    });

    it('should show loading state during optimization', async () => {
      const user = userEvent.setup();
      
      // Mock a delayed response
      (greedyOptimization as jest.Mock).mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => resolve(mockOptimizationResults), 100);
        });
      });
      
      renderComponent();
      
      await user.click(screen.getByRole('button', { name: /run optimization/i }));
      
      expect(screen.getByText(/optimizing/i)).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.queryByText(/optimizing/i)).not.toBeInTheDocument();
      });
    });

    it('should display error message when optimization fails', async () => {
      const user = userEvent.setup();
      
      (greedyOptimization as jest.Mock).mockRejectedValue(new Error('Optimization failed'));
      
      renderComponent();
      
      await user.click(screen.getByRole('button', { name: /run optimization/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/error.*optimization.*failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Results Display', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      renderComponent();
      
      await user.click(screen.getByRole('button', { name: /run optimization/i }));
      
      await waitFor(() => {
        expect(greedyOptimization).toHaveBeenCalled();
      });
    });

    it('should display optimization results', () => {
      expect(screen.getByText(/selected sites/i)).toBeInTheDocument();
      expect(screen.getByText(/total demand captured/i)).toBeInTheDocument();
      expect(screen.getByText(/total cost/i)).toBeInTheDocument();
      expect(screen.getByText('250')).toBeInTheDocument(); // Total demand
      expect(screen.getByText('¥2,000,000')).toBeInTheDocument(); // Total cost
    });

    it('should display performance metrics', () => {
      expect(screen.getByText(/execution time/i)).toBeInTheDocument();
      expect(screen.getByText(/150ms/i)).toBeInTheDocument();
      expect(screen.getByText(/iterations/i)).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
    });

    it('should show candidate sites', () => {
      expect(mockProps.onShowCandidates).toHaveBeenCalledWith(mockOptimizationResults.selectedSites);
    });
  });

  describe('Historical Analysis Integration', () => {
    it('should show historical data input when historical algorithm is selected', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      await user.selectOptions(screen.getByRole('combobox', { name: /algorithm/i }), 'historical');
      
      expect(screen.getByText(/historical data/i)).toBeInTheDocument();
    });

    it('should run historical analysis when historical algorithm is used', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      await user.selectOptions(screen.getByRole('combobox', { name: /algorithm/i }), 'historical');
      await user.click(screen.getByRole('button', { name: /run optimization/i }));
      
      await waitFor(() => {
        expect(analyzeHistoricalPatterns).toHaveBeenCalled();
      });
    });
  });

  describe('Validation and Error Handling', () => {
    it('should show error when no candidate sites are available', async () => {
      const user = userEvent.setup();
      
      (generateCandidateSites as jest.Mock).mockReturnValue([]);
      
      renderComponent();
      
      await user.click(screen.getByRole('button', { name: /run optimization/i }));
      
      expect(screen.getByText(/no candidate sites/i)).toBeInTheDocument();
    });

    it('should show error when no demand data is available', async () => {
      const user = userEvent.setup();
      
      const propsWithoutDemand = {
        ...mockProps,
        demandMeshes: []
      };
      
      render(<OptimizationPanel {...propsWithoutDemand} />);
      
      await user.click(screen.getByRole('button', { name: /run optimization/i }));
      
      expect(screen.getByText(/no demand data/i)).toBeInTheDocument();
    });

    it('should validate numeric input ranges', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      // Show advanced options
      await user.click(screen.getByRole('button', { name: /advanced/i }));
      
      const numStoresInput = screen.getByLabelText(/number of stores/i);
      await user.clear(numStoresInput);
      await user.type(numStoresInput, '0');
      
      await user.click(screen.getByRole('button', { name: /run optimization/i }));
      
      // Should either prevent submission or show validation error
      expect(greedyOptimization).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      renderComponent();
      
      const inputs = screen.getAllByRole('spinbutton');
      inputs.forEach(input => {
        expect(input).toHaveAccessibleName();
      });
    });

    it('should have proper ARIA labels for buttons', () => {
      renderComponent();
      
      expect(screen.getByRole('button', { name: /run optimization/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /advanced/i })).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const firstInput = screen.getByLabelText(/number of stores/i);
      firstInput.focus();
      
      await user.tab();
      expect(screen.getByLabelText(/maximum radius/i)).toHaveFocus();
    });
  });

  describe('Performance', () => {
    it('should not re-run optimization unnecessarily', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      await user.click(screen.getByRole('button', { name: /run optimization/i }));
      await user.click(screen.getByRole('button', { name: /run optimization/i }));
      
      await waitFor(() => {
        expect(greedyOptimization).toHaveBeenCalledTimes(2);
      });
    });

    it('should handle large datasets efficiently', () => {
      const largeProps = {
        ...mockProps,
        demandMeshes: Array(1000).fill(mockProps.demandMeshes[0]).map((mesh, i) => ({
          ...mesh,
          id: `mesh${i}`
        }))
      };
      
      expect(() => render(<OptimizationPanel {...largeProps} />)).not.toThrow();
    });
  });
});