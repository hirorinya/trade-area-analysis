import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock Supabase auth
const mockAuth = {
  signInWithPassword: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
  getSession: jest.fn(),
  onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } }))
};

const mockDb = {};

jest.mock('../lib/supabase', () => ({
  auth: mockAuth,
  db: mockDb
}));

// Mock OpenAI API responses
const mockOpenAIResponse = {
  choices: [{
    message: {
      content: 'Based on your query, I recommend using the demand heat-map feature to visualize population density and then running the optimization algorithm to find optimal store locations.'
    }
  }]
};

describe('End-to-End User Workflows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    
    // Mock successful authentication
    mockAuth.getSession.mockResolvedValue({
      data: { session: { user: { id: '123', email: 'test@example.com' } } }
    });
    
    // Mock API responses
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('openai.com')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockOpenAIResponse)
        });
      }
      
      // Default mock response
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });
    });
  });

  const renderApp = () => {
    return render(<App />);
  };

  const authenticateUser = async () => {
    const user = userEvent.setup();
    
    // Simulate logged in state
    localStorage.setItem('currentView', 'dashboard');
    localStorage.setItem('token', 'mock-token');
    
    return user;
  };

  describe('Complete Trade Area Analysis Workflow', () => {
    it('should complete full workflow: login → dashboard → analysis → optimization', async () => {
      const user = await authenticateUser();
      renderApp();
      
      // Step 1: Should start at dashboard (mocked as logged in)
      await waitFor(() => {
        expect(screen.getByText(/trade area analysis tool/i)).toBeInTheDocument();
      });
      
      // Step 2: Navigate to Analysis page
      const analysisButton = screen.getByRole('button', { name: /analysis/i });
      await user.click(analysisButton);
      
      await waitFor(() => {
        expect(screen.getByText(/what do you want to do/i)).toBeInTheDocument();
      });
      
      // Step 3: Use natural language prompt
      const nlInput = screen.getByPlaceholderText(/describe what you want to analyze/i);
      await user.type(nlInput, 'I want to find the best location for a new coffee shop in Tokyo');
      
      const askButton = screen.getByRole('button', { name: /ask claude/i });
      await user.click(askButton);
      
      await waitFor(() => {
        expect(screen.getByText(/based on your query/i)).toBeInTheDocument();
      });
      
      // Step 4: Enable demand grid
      const demandGridToggle = screen.getByLabelText(/population analysis/i);
      await user.click(demandGridToggle);
      
      // Step 5: Open optimization panel
      const optimizationButton = screen.getByRole('button', { name: /optimization/i });
      await user.click(optimizationButton);
      
      await waitFor(() => {
        expect(screen.getByText(/optimization parameters/i)).toBeInTheDocument();
      });
      
      // Step 6: Configure optimization parameters
      const numStoresInput = screen.getByLabelText(/number of stores/i);
      await user.clear(numStoresInput);
      await user.type(numStoresInput, '3');
      
      // Step 7: Run optimization
      const runOptimizationButton = screen.getByRole('button', { name: /run optimization/i });
      await user.click(runOptimizationButton);
      
      await waitFor(() => {
        expect(screen.getByText(/optimization complete/i)).toBeInTheDocument();
      });
    }, 15000);

    it('should handle historical data analysis workflow', async () => {
      const user = await authenticateUser();
      renderApp();
      
      await waitFor(() => {
        expect(screen.getByText(/trade area analysis tool/i)).toBeInTheDocument();
      });
      
      // Navigate to Analysis
      const analysisButton = screen.getByRole('button', { name: /analysis/i });
      await user.click(analysisButton);
      
      // Open optimization panel
      const optimizationButton = screen.getByRole('button', { name: /optimization/i });
      await user.click(optimizationButton);
      
      // Select historical algorithm
      const algorithmSelect = screen.getByRole('combobox', { name: /algorithm/i });
      await user.selectOptions(algorithmSelect, 'historical');
      
      await waitFor(() => {
        expect(screen.getByText(/historical data/i)).toBeInTheDocument();
      });
      
      // Add historical data
      const addDataButton = screen.getByRole('button', { name: /add historical data/i });
      await user.click(addDataButton);
      
      // Fill in store data
      await user.type(screen.getByLabelText(/store name/i), 'Historical Store 1');
      await user.type(screen.getByLabelText(/latitude/i), '35.6762');
      await user.type(screen.getByLabelText(/longitude/i), '139.6503');
      await user.type(screen.getByLabelText(/annual revenue/i), '5000000');
      await user.type(screen.getByLabelText(/annual profit/i), '500000');
      
      const submitDataButton = screen.getByRole('button', { name: /add store data/i });
      await user.click(submitDataButton);
      
      // Run historical analysis
      const runAnalysisButton = screen.getByRole('button', { name: /run optimization/i });
      await user.click(runAnalysisButton);
      
      await waitFor(() => {
        expect(screen.getByText(/pattern analysis/i)).toBeInTheDocument();
        expect(screen.getByText(/site recommendations/i)).toBeInTheDocument();
      });
    }, 10000);
  });

  describe('Error Handling Workflows', () => {
    it('should handle API errors gracefully', async () => {
      const user = await authenticateUser();
      
      // Mock API failure
      (global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'));
      
      renderApp();
      
      await waitFor(() => {
        expect(screen.getByText(/trade area analysis tool/i)).toBeInTheDocument();
      });
      
      const analysisButton = screen.getByRole('button', { name: /analysis/i });
      await user.click(analysisButton);
      
      const nlInput = screen.getByPlaceholderText(/describe what you want to analyze/i);
      await user.type(nlInput, 'Test query');
      
      const askButton = screen.getByRole('button', { name: /ask claude/i });
      await user.click(askButton);
      
      await waitFor(() => {
        expect(screen.getByText(/error.*api/i)).toBeInTheDocument();
      });
    });

    it('should handle missing environment variables', async () => {
      const user = await authenticateUser();
      
      // Mock missing env vars by returning 401
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Unauthorized' })
      });
      
      renderApp();
      
      await waitFor(() => {
        expect(screen.getByText(/trade area analysis tool/i)).toBeInTheDocument();
      });
      
      const analysisButton = screen.getByRole('button', { name: /analysis/i });
      await user.click(analysisButton);
      
      const nlInput = screen.getByPlaceholderText(/describe what you want to analyze/i);
      await user.type(nlInput, 'Test query');
      
      const askButton = screen.getByRole('button', { name: /ask claude/i });
      await user.click(askButton);
      
      await waitFor(() => {
        expect(screen.getByText(/unauthorized/i)).toBeInTheDocument();
      });
    });

    it('should validate form inputs before submission', async () => {
      const user = await authenticateUser();
      renderApp();
      
      await waitFor(() => {
        expect(screen.getByText(/trade area analysis tool/i)).toBeInTheDocument();
      });
      
      const analysisButton = screen.getByRole('button', { name: /analysis/i });
      await user.click(analysisButton);
      
      const optimizationButton = screen.getByRole('button', { name: /optimization/i });
      await user.click(optimizationButton);
      
      // Try to run optimization without demand data
      const runOptimizationButton = screen.getByRole('button', { name: /run optimization/i });
      await user.click(runOptimizationButton);
      
      await waitFor(() => {
        expect(screen.getByText(/no demand data/i)).toBeInTheDocument();
      });
    });
  });

  describe('Data Persistence Workflows', () => {
    it('should persist navigation state across page reloads', async () => {
      const user = await authenticateUser();
      localStorage.setItem('currentView', 'analysis');
      
      renderApp();
      
      // Should restore to analysis view
      await waitFor(() => {
        expect(screen.getByText(/what do you want to do/i)).toBeInTheDocument();
      });
    });

    it('should maintain form state during navigation', async () => {
      const user = await authenticateUser();
      renderApp();
      
      await waitFor(() => {
        expect(screen.getByText(/trade area analysis tool/i)).toBeInTheDocument();
      });
      
      const analysisButton = screen.getByRole('button', { name: /analysis/i });
      await user.click(analysisButton);
      
      // Fill in natural language input
      const nlInput = screen.getByPlaceholderText(/describe what you want to analyze/i);
      await user.type(nlInput, 'Find optimal locations');
      
      // Navigate away and back
      const dashboardButton = screen.getByRole('button', { name: /dashboard/i });
      await user.click(dashboardButton);
      
      await user.click(analysisButton);
      
      // Input should still have the value (if state is maintained)
      const restoredInput = screen.getByPlaceholderText(/describe what you want to analyze/i);
      expect(restoredInput).toHaveValue('Find optimal locations');
    });
  });

  describe('Accessibility Workflows', () => {
    it('should support keyboard-only navigation', async () => {
      const user = await authenticateUser();
      renderApp();
      
      await waitFor(() => {
        expect(screen.getByText(/trade area analysis tool/i)).toBeInTheDocument();
      });
      
      // Tab through main navigation
      await user.tab();
      await user.tab();
      
      // Should be able to navigate to analysis via keyboard
      const analysisButton = screen.getByRole('button', { name: /analysis/i });
      analysisButton.focus();
      await user.keyboard('[Enter]');
      
      await waitFor(() => {
        expect(screen.getByText(/what do you want to do/i)).toBeInTheDocument();
      });
      
      // Continue keyboard navigation within analysis page
      await user.tab();
      const nlInput = screen.getByPlaceholderText(/describe what you want to analyze/i);
      expect(nlInput).toHaveFocus();
    });

    it('should provide proper ARIA labels and descriptions', async () => {
      const user = await authenticateUser();
      renderApp();
      
      await waitFor(() => {
        expect(screen.getByText(/trade area analysis tool/i)).toBeInTheDocument();
      });
      
      const analysisButton = screen.getByRole('button', { name: /analysis/i });
      await user.click(analysisButton);
      
      // Check for proper labeling
      const nlInput = screen.getByPlaceholderText(/describe what you want to analyze/i);
      expect(nlInput).toHaveAccessibleName();
      
      const askButton = screen.getByRole('button', { name: /ask claude/i });
      expect(askButton).toHaveAccessibleName();
    });
  });

  describe('Performance Workflows', () => {
    it('should handle large datasets without crashing', async () => {
      const user = await authenticateUser();
      renderApp();
      
      await waitFor(() => {
        expect(screen.getByText(/trade area analysis tool/i)).toBeInTheDocument();
      });
      
      const analysisButton = screen.getByRole('button', { name: /analysis/i });
      await user.click(analysisButton);
      
      // Enable demand grid with a large area
      const demandGridToggle = screen.getByLabelText(/population analysis/i);
      await user.click(demandGridToggle);
      
      // App should not crash even with large datasets
      await waitFor(() => {
        expect(screen.getByText(/mesh analysis/i)).toBeInTheDocument();
      });
    });

    it('should show loading states during long operations', async () => {
      const user = await authenticateUser();
      
      // Mock slow API response
      (global.fetch as jest.Mock).mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve(mockOpenAIResponse)
          }), 1000)
        )
      );
      
      renderApp();
      
      await waitFor(() => {
        expect(screen.getByText(/trade area analysis tool/i)).toBeInTheDocument();
      });
      
      const analysisButton = screen.getByRole('button', { name: /analysis/i });
      await user.click(analysisButton);
      
      const nlInput = screen.getByPlaceholderText(/describe what you want to analyze/i);
      await user.type(nlInput, 'Test query');
      
      const askButton = screen.getByRole('button', { name: /ask claude/i });
      await user.click(askButton);
      
      // Should show loading state
      expect(screen.getByText(/thinking/i)).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByText(/based on your query/i)).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('Mobile Responsive Workflows', () => {
    it('should adapt layout for mobile devices', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      const user = await authenticateUser();
      renderApp();
      
      await waitFor(() => {
        expect(screen.getByText(/trade area analysis tool/i)).toBeInTheDocument();
      });
      
      // Navigation should still be accessible on mobile
      const analysisButton = screen.getByRole('button', { name: /analysis/i });
      expect(analysisButton).toBeInTheDocument();
      
      await user.click(analysisButton);
      
      await waitFor(() => {
        expect(screen.getByText(/what do you want to do/i)).toBeInTheDocument();
      });
    });
  });
});