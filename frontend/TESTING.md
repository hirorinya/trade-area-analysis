# Testing Documentation

## Overview

This project implements comprehensive testing coverage using Jest and React Testing Library to ensure code quality and prevent regressions during feature development.

## Testing Framework Setup

### Dependencies
- **Jest**: JavaScript testing framework
- **React Testing Library**: React component testing utilities
- **Jest Environment jsdom**: DOM simulation for browser testing
- **ts-jest**: TypeScript support for Jest
- **@testing-library/user-event**: User interaction simulation

### Configuration
- **Jest Config**: `jest.config.js` - Main Jest configuration
- **Setup File**: `src/setupTests.ts` - Global test setup and mocks
- **Mock Files**: `src/__mocks__/` - File and module mocks

## Test Categories

### 1. Unit Tests
**Location**: `src/utils/__tests__/`

Tests core utility functions in isolation:

#### `demandGrid.test.ts`
- ✅ **generateDemandGrid()**: Validates mesh generation within bounds
- ✅ **calculateDemandCapture()**: Tests store capture calculations
- ✅ **calculateStorePerformance()**: Verifies performance metrics
- ✅ **Edge cases**: Empty inputs, boundary conditions

#### `optimizationEngine.test.ts`  
- ✅ **greedyOptimization()**: Tests greedy algorithm implementation
- ✅ **mipStyleOptimization()**: Validates MIP-style optimization
- ✅ **competitiveAnalysis()**: Tests competitive positioning
- ✅ **generateCandidateSites()**: Site generation validation
- ✅ **Constraint validation**: Budget, distance, site count limits

#### `historicalAnalysis.test.js`
- ✅ **analyzeHistoricalPatterns()**: Pattern recognition testing
- ✅ **Performance categorization**: Store classification logic
- ✅ **Feature importance**: Correlation analysis validation
- ✅ **Site recommendations**: Location scoring accuracy
- ✅ **Financial forecasting**: Revenue/profit projections

### 2. Integration Tests
**Location**: `src/components/__tests__/`

Tests React components with realistic interactions:

#### `MapboxMap.test.tsx`
- ✅ **Map initialization**: Mapbox GL setup and configuration
- ✅ **Location markers**: Marker creation and positioning
- ✅ **Demand visualization**: Grid and heatmap rendering
- ✅ **User interactions**: Click handlers, style changes
- ✅ **Error handling**: Token validation, map failures
- ✅ **Performance**: Large datasets, memory cleanup

#### `OptimizationPanel.test.tsx`
- ✅ **Form interactions**: Parameter input validation
- ✅ **Algorithm selection**: Dropdown behavior
- ✅ **Optimization execution**: Result processing
- ✅ **Loading states**: Progress indicators
- ✅ **Error scenarios**: Invalid inputs, API failures
- ✅ **Historical integration**: Data input workflows

#### `HistoricalDataInput.test.tsx`
- ✅ **Form validation**: Required field checking
- ✅ **CSV upload**: File processing and parsing
- ✅ **Data transformation**: Type conversion accuracy
- ✅ **User experience**: Form reset, error messages
- ✅ **Accessibility**: ARIA labels, keyboard navigation

### 3. End-to-End Tests
**Location**: `src/__tests__/UserWorkflows.e2e.test.tsx`

Tests complete user workflows:

#### ✅ **Complete Analysis Workflow**
1. Authentication → Dashboard navigation
2. Natural language query processing
3. Demand grid activation
4. Optimization parameter configuration
5. Algorithm execution and results display

#### ✅ **Historical Data Analysis**
1. Historical algorithm selection
2. Store data input (manual/CSV)
3. Pattern analysis execution
4. Site recommendation generation

#### ✅ **Error Handling Workflows**
- API failure scenarios
- Missing environment variables
- Form validation errors
- Network connectivity issues

#### ✅ **Data Persistence**
- Navigation state maintenance
- Form state preservation
- LocalStorage integration

#### ✅ **Accessibility Testing**
- Keyboard-only navigation
- Screen reader compatibility
- ARIA label validation

## Test Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run specific test file
npm test -- --testPathPatterns=demandGrid.test.ts

# Run tests with verbose output
npm test -- --verbose

# Build with tests (CI/CD)
npm run build-with-tests
```

## Coverage Goals

### Current Coverage Areas
- ✅ **Core Algorithms**: 95%+ coverage of optimization and analysis functions
- ✅ **React Components**: Integration tests for all major components  
- ✅ **User Workflows**: End-to-end testing of critical paths
- ✅ **Error Scenarios**: Comprehensive error handling validation

### Coverage Exclusions
- Third-party library mocks
- Environment configuration files
- Build and deployment scripts
- Type definitions (`.d.ts` files)

## Continuous Integration

### GitHub Actions Workflow
**File**: `.github/workflows/ci.yml`

#### Test Pipeline
1. **Environment Setup**: Node.js 18.x and 20.x matrix
2. **Dependency Installation**: npm ci for consistent installs
3. **Code Quality**: ESLint and TypeScript checks
4. **Test Execution**: Full test suite with coverage
5. **Build Validation**: Production build verification
6. **Coverage Upload**: Codecov integration

#### Deployment Pipeline
- **Trigger**: Push to main branch
- **Requirements**: All tests must pass
- **Target**: Vercel automatic deployment
- **Environment**: Production secrets injection

## Mock Strategy

### Global Mocks
**File**: `src/setupTests.ts`

- **Mapbox GL**: Complete map functionality simulation
- **Supabase**: Authentication and database mocking
- **Environment Variables**: Test-specific configuration
- **LocalStorage**: Browser storage simulation
- **Fetch API**: HTTP request interception

### Component Mocks
- **File uploads**: Simulated CSV processing
- **API responses**: Controlled success/error scenarios
- **Timer functions**: Deterministic timing behavior

## Best Practices

### Test Writing Guidelines
1. **Descriptive Names**: Clear test descriptions explaining behavior
2. **Arrange-Act-Assert**: Structured test organization
3. **Single Responsibility**: One concept per test
4. **Mock Isolation**: Avoid cross-test interference
5. **Edge Case Coverage**: Boundary and error conditions

### Maintenance Practices
1. **Regular Updates**: Keep tests aligned with feature changes
2. **Refactoring**: Update tests when code structure changes
3. **Documentation**: Update this file with new test additions
4. **Performance**: Monitor test execution time and optimize

## Common Issues and Solutions

### Jest Configuration
- **ES Module Issues**: Use `moduleNameMapper` for import resolution
- **TypeScript Errors**: Configure `ts-jest` properly
- **Timeout Issues**: Increase timeout for complex operations

### React Testing Library
- **Async Operations**: Use `waitFor()` for asynchronous updates
- **User Events**: Prefer `userEvent` over `fireEvent`
- **Queries**: Use accessible queries (getByRole, getByLabelText)

### Mapbox Testing
- **Map Initialization**: Mock constructor and methods
- **Event Simulation**: Mock event handlers and callbacks
- **Memory Leaks**: Ensure proper cleanup in tests

## Integration with Development Workflow

### Pre-commit Hooks
Tests run automatically before code commits to prevent regressions.

### Feature Development
1. **TDD Approach**: Write tests before implementing features
2. **Regression Testing**: Ensure existing tests still pass
3. **Coverage Validation**: Maintain or improve coverage metrics

### Code Reviews
- All new features must include appropriate tests
- Test quality reviewed alongside code quality
- Coverage reports included in pull requests

## Future Enhancements

### Planned Improvements
- **Visual Regression Testing**: Screenshot comparison for UI changes
- **Performance Testing**: Load testing for large datasets
- **Browser Testing**: Cross-browser compatibility validation
- **API Testing**: Backend integration test coverage

### Tool Considerations
- **Playwright**: For more robust end-to-end testing
- **Storybook**: Component isolation and visual testing
- **MSW**: More sophisticated API mocking
- **Chromatic**: Visual regression testing service

---

This testing system ensures that every new feature is thoroughly validated and that existing functionality remains stable during development. The comprehensive coverage provides confidence in deployment and helps maintain high code quality standards.