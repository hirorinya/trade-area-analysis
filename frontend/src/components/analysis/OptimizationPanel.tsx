import React, { useState, useEffect } from 'react';
import { theme } from '../../styles/theme';
import { 
  containerStyle, 
  sectionStyle, 
  formStyle, 
  heading2Style, 
  heading3Style, 
  bodyTextStyle,
  buttonGroupStyle,
  successMessageStyle,
  errorMessageStyle
} from '../../styles/layouts';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { 
  greedyOptimization, 
  mipStyleOptimization, 
  competitiveAnalysis, 
  multiScenarioAnalysis,
  storeCapacityOptimization,
  generateCandidateSites 
} from '../../utils/optimizationEngine';
import { analyzeHistoricalPatterns } from '../../utils/historicalAnalysis';
import HistoricalDataInput from './HistoricalDataInput';

interface OptimizationPanelProps {
  demandMeshes: any[];
  existingStores: any[];
  competitors: any[];
  bounds: { north: number; south: number; east: number; west: number };
  onOptimizationComplete: (results: any) => void;
  onShowCandidates: (candidates: any[]) => void;
}

interface OptimizationParams {
  numStores: number;
  maxRadius: number;
  distanceDecay: number;
  minDistance: number;
  maxBudget: number;
  storeCost: number;
  algorithm: 'greedy' | 'mip' | 'competitive' | 'multi-scenario' | 'capacity' | 'historical';
}

const OptimizationPanel: React.FC<OptimizationPanelProps> = ({
  demandMeshes,
  existingStores,
  competitors,
  bounds,
  onOptimizationComplete,
  onShowCandidates
}) => {
  const [params, setParams] = useState<OptimizationParams>({
    numStores: 5,
    maxRadius: 2.0,
    distanceDecay: 1.5,
    minDistance: 0.5,
    maxBudget: 10000000, // 10M default
    storeCost: 1000000,  // 1M per store
    algorithm: 'greedy'
  });
  
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [candidateSites, setCandidateSites] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [showHistoricalInput, setShowHistoricalInput] = useState(false);
  const [progressMessage, setProgressMessage] = useState('');
  const [estimatedTime, setEstimatedTime] = useState(0);
  
  // Candidate site configuration
  const [candidateConfig, setCandidateConfig] = useState({
    count: 200,
    accuracy: 'medium' as 'low' | 'medium' | 'high'
  });

  // Generate candidate sites when bounds or config changes
  useEffect(() => {
    if (bounds && demandMeshes.length > 0) {
      console.log('Generating candidate sites for optimization...');
      const candidates = generateCandidateSites(
        bounds, 
        candidateConfig.count, 
        existingStores,
        { searchAccuracy: candidateConfig.accuracy }
      );
      setCandidateSites(candidates);
      console.log(`Generated ${candidates.length} candidate sites with ${candidateConfig.accuracy} accuracy`);
    }
  }, [bounds, demandMeshes, existingStores, candidateConfig]);

  const showMessage = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  // Get performance estimates for different algorithms
  const getAlgorithmEstimate = (algorithm: string, candidates: number, meshes: number, stores: number) => {
    const complexity = candidates * meshes * stores;
    switch (algorithm) {
      case 'greedy':
        return Math.max(2, Math.min(15, complexity / 50000)); // 2-15 seconds
      case 'mip':
        return Math.max(5, Math.min(45, complexity / 20000)); // 5-45 seconds
      case 'competitive':
        return Math.max(3, Math.min(30, complexity / 30000)); // 3-30 seconds
      case 'multi-scenario':
        return Math.max(8, Math.min(60, complexity / 15000)); // 8-60 seconds
      case 'capacity':
        return Math.max(1, Math.min(10, complexity / 80000)); // 1-10 seconds
      case 'historical':
        return Math.max(3, Math.min(25, complexity / 40000)); // 3-25 seconds
      default:
        return 10;
    }
  };

  const runOptimization = async () => {
    if (candidateSites.length === 0) {
      showMessage('No candidate sites available. Please ensure the map area is defined.', 'error');
      return;
    }

    if (demandMeshes.length === 0) {
      showMessage('No demand data available. Please enable population grid first.', 'error');
      return;
    }

    // Calculate and show estimated time
    const estimatedSeconds = getAlgorithmEstimate(params.algorithm, candidateSites.length, demandMeshes.length, params.numStores);
    setEstimatedTime(estimatedSeconds);
    setProgressMessage(`Starting ${params.algorithm.toUpperCase()} optimization... (estimated ${Math.round(estimatedSeconds)}s)`);

    setIsOptimizing(true);
    setMessage('');

    try {
      // Add a global timeout to prevent infinite hanging
      const optimizationPromise = (async () => {
        let optimizationResults;

        switch (params.algorithm) {
          case 'greedy':
            setProgressMessage('🔍 Running Greedy optimization... (fast algorithm)');
            console.log('Running Greedy optimization...');
            optimizationResults = await greedyOptimization(
              candidateSites, 
              demandMeshes, 
              params.numStores,
              {
                maxRadius: params.maxRadius,
                distanceDecay: params.distanceDecay,
                minDistance: params.minDistance,
                maxBudget: params.maxBudget,
                storeCost: params.storeCost,
                timeoutMs: 30000
              }
            );
            break;

          case 'mip':
            setProgressMessage('🎯 Running MIP-style optimization... (finding global optimum)');
            console.log('Running MIP-style optimization...');
            optimizationResults = await mipStyleOptimization(
              candidateSites, 
              demandMeshes, 
              params.numStores,
              {
                maxRadius: params.maxRadius,
                distanceDecay: params.distanceDecay,
                minDistance: params.minDistance,
                maxBudget: params.maxBudget,
                storeCost: params.storeCost,
                maxIterations: 50,
                timeoutMs: 60000
              }
            );
            break;

          case 'competitive':
            setProgressMessage('⚔️ Running competitive analysis... (analyzing competitor impact)');
            console.log('Running competitive analysis...');
            if (competitors.length === 0) {
              showMessage('No competitors defined for competitive analysis.', 'error');
              setIsOptimizing(false);
              setProgressMessage('');
              return;
            }
            
            // First get optimal sites using greedy
            const greedyResults = await greedyOptimization(candidateSites, demandMeshes, params.numStores, {
              maxRadius: params.maxRadius,
              distanceDecay: params.distanceDecay,
              minDistance: params.minDistance,
              timeoutMs: 30000
            });
            
            // Then analyze against competition
            optimizationResults = competitiveAnalysis(
              greedyResults.selectedStores,
              competitors,
              demandMeshes,
              {
                maxRadius: params.maxRadius,
                distanceDecay: params.distanceDecay,
                newStoreAttractiveness: 1.0,
                competitorAttractiveness: 0.8
              }
            );
            optimizationResults.baseOptimization = greedyResults;
            break;

          case 'multi-scenario':
            console.log('Running multi-scenario analysis...');
          const scenarios = [
            {
              name: 'Conservative (3 stores)',
              algorithm: 'greedy',
              numStores: Math.max(1, params.numStores - 2),
              constraints: {
                maxRadius: params.maxRadius,
                distanceDecay: params.distanceDecay,
                minDistance: params.minDistance + 0.2
              }
            },
            {
              name: 'Standard (Greedy)',
              algorithm: 'greedy',
              numStores: params.numStores,
              constraints: {
                maxRadius: params.maxRadius,
                distanceDecay: params.distanceDecay,
                minDistance: params.minDistance
              }
            },
            {
              name: 'Optimized (MIP)',
              algorithm: 'mip',
              numStores: params.numStores,
              constraints: {
                maxRadius: params.maxRadius,
                distanceDecay: params.distanceDecay,
                minDistance: params.minDistance
              }
            },
            {
              name: 'Aggressive (More stores)',
              algorithm: 'greedy',
              numStores: params.numStores + 2,
              constraints: {
                maxRadius: params.maxRadius + 0.5,
                distanceDecay: params.distanceDecay,
                minDistance: Math.max(0.2, params.minDistance - 0.1)
              }
            }
          ];
          
          optimizationResults = await multiScenarioAnalysis(candidateSites, demandMeshes, scenarios);
          break;

        case 'capacity':
          console.log('Running store capacity optimization...');
          if (existingStores.length === 0) {
            showMessage('No existing stores found for capacity analysis.', 'error');
            setIsOptimizing(false);
            return;
          }
          
          optimizationResults = storeCapacityOptimization(
            existingStores,
            demandMeshes,
            {
              maxRadius: params.maxRadius,
              distanceDecay: params.distanceDecay,
              peakHourMultiplier: 1.5,
              serviceTimePerCustomer: 3,
              operatingHoursPerDay: 12,
              targetUtilization: 0.8,
              staffingCostPerHour: 25,
              fixedCostPerDay: 500,
              revenuePerCustomer: 15
            }
          );
          break;

        case 'historical':
          console.log('Running historical pattern analysis...');
          if (historicalData.length === 0) {
            showMessage('No historical data provided. Please add store performance data first.', 'error');
            setIsOptimizing(false);
            return;
          }
          
          if (demandMeshes.length === 0) {
            showMessage('No demand data available. Please enable population grid first.', 'error');
            setIsOptimizing(false);
            return;
          }
          
          optimizationResults = analyzeHistoricalPatterns(
            historicalData,
            demandMeshes,
            {
              performanceThreshold: 0.8,
              minSampleSize: 3,
              featureImportanceThreshold: 0.1,
              confidenceLevel: 0.7
            }
          );
          break;

        default:
          throw new Error('Unknown optimization algorithm');
        }

        return optimizationResults;
      })();

      // Set up a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Optimization timeout after 120 seconds. Try reducing the number of stores or mesh size.'));
        }, 120000); // 2 minute global timeout
      });

      // Race between optimization and timeout
      const optimizationResults = await Promise.race([optimizationPromise, timeoutPromise]);

      setResults(optimizationResults);
      onOptimizationComplete(optimizationResults);
      
      // Show candidate sites if available
      if (optimizationResults.selectedStores) {
        onShowCandidates(optimizationResults.selectedStores);
      }

      showMessage(`${params.algorithm.toUpperCase()} optimization completed successfully!`, 'success');
      
    } catch (error) {
      console.error('Optimization failed:', error);
      showMessage(`Optimization failed: ${error.message}`, 'error');
      setProgressMessage('');
    } finally {
      setIsOptimizing(false);
      setProgressMessage('');
      setEstimatedTime(0);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return Math.round(num).toString();
  };

  const formatCurrency = (num: number) => {
    return `¥${formatNumber(num)}`;
  };

  return (
    <>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      <div style={containerStyle}>
      <div style={sectionStyle}>
        <h2 style={heading2Style}>Store Optimization Engine</h2>
        <p style={bodyTextStyle}>
          Advanced algorithms for optimal store placement based on population demand analysis.
        </p>
      </div>

      {message && (
        <div style={messageType === 'success' ? successMessageStyle : errorMessageStyle}>
          {message}
        </div>
      )}

      <div style={formStyle}>
        <h3 style={heading3Style}>Optimization Parameters</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: theme.spacing[4], marginBottom: theme.spacing[4] }}>
          <div>
            <label style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.gray[700], display: 'block', marginBottom: theme.spacing[1] }}>
              Algorithm
            </label>
            <select 
              value={params.algorithm} 
              onChange={(e) => setParams(prev => ({ ...prev, algorithm: e.target.value as any }))}
              style={{
                ...theme.components.input.base,
                width: '100%'
              }}
            >
              <option value="greedy">Greedy (Fast)</option>
              <option value="mip">MIP-Style (Optimal)</option>
              <option value="competitive">Competitive Analysis</option>
              <option value="multi-scenario">Multi-Scenario</option>
              <option value="capacity">Store Capacity Analysis</option>
              <option value="historical">Historical Pattern Analysis</option>
            </select>
          </div>

          <Input
            label="Number of Stores"
            type="number"
            value={params.numStores}
            onChange={(e) => setParams(prev => ({ ...prev, numStores: parseInt(e.target.value) || 1 }))}
            min={1}
            max={20}
          />

          <Input
            label="Max Radius (km)"
            type="number"
            value={params.maxRadius}
            onChange={(e) => setParams(prev => ({ ...prev, maxRadius: parseFloat(e.target.value) || 1 }))}
            min={0.5}
            max={10}
            step={0.1}
          />

          <Input
            label="Min Distance (km)"
            type="number"
            value={params.minDistance}
            onChange={(e) => setParams(prev => ({ ...prev, minDistance: parseFloat(e.target.value) || 0.1 }))}
            min={0.1}
            max={5}
            step={0.1}
          />
        </div>

        {/* Candidate Site Configuration */}
        <div style={{ 
          marginTop: theme.spacing[4], 
          padding: theme.spacing[4], 
          backgroundColor: theme.colors.blue[50], 
          borderRadius: theme.borderRadius.lg,
          border: `1px solid ${theme.colors.blue[200]}`
        }}>
          <h4 style={{ 
            ...heading3Style, 
            color: theme.colors.blue[700], 
            marginBottom: theme.spacing[3] 
          }}>
            Candidate Site Settings
          </h4>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: theme.spacing[4] 
          }}>
            <Input
              label="Number of Candidates"
              type="number"
              value={candidateConfig.count}
              onChange={(e) => setCandidateConfig(prev => ({ 
                ...prev, 
                count: Math.min(Math.max(parseInt(e.target.value) || 50, 50), 1000)
              }))}
              min={50}
              max={1000}
              step={50}
              helper="More candidates = better coverage but slower optimization"
            />

            <div>
              <label style={{
                display: 'block',
                marginBottom: theme.spacing[2],
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                color: theme.colors.gray[700],
                fontFamily: theme.typography.fontFamily.primary
              }}>
                Search Accuracy
              </label>
              <select
                value={candidateConfig.accuracy}
                onChange={(e) => setCandidateConfig(prev => ({ 
                  ...prev, 
                  accuracy: e.target.value as 'low' | 'medium' | 'high'
                }))}
                style={{
                  ...theme.components.input.base,
                  width: '100%'
                }}
              >
                <option value="low">Low (0.5km spacing - Fast)</option>
                <option value="medium">Medium (0.2km spacing - Balanced)</option>
                <option value="high">High (0.1km spacing - Precise)</option>
              </select>
              <div style={{
                fontSize: theme.typography.fontSize.xs,
                color: theme.colors.gray[500],
                marginTop: theme.spacing[1]
              }}>
                Higher accuracy finds better locations but takes longer
              </div>
            </div>
          </div>
          
          <div style={{
            marginTop: theme.spacing[3],
            display: 'flex',
            gap: theme.spacing[2],
            flexWrap: 'wrap'
          }}>
            <Button
              variant="secondary"
              size="small"
              onClick={() => setCandidateConfig({ count: 100, accuracy: 'low' })}
            >
              Fast (100 candidates)
            </Button>
            <Button
              variant="secondary"
              size="small"
              onClick={() => setCandidateConfig({ count: 200, accuracy: 'medium' })}
            >
              Balanced (200 candidates)
            </Button>
            <Button
              variant="secondary"
              size="small"
              onClick={() => setCandidateConfig({ count: 500, accuracy: 'high' })}
            >
              Precise (500 candidates)
            </Button>
          </div>

          <div style={{
            marginTop: theme.spacing[3],
            padding: theme.spacing[3],
            backgroundColor: theme.colors.gray[50],
            borderRadius: theme.borderRadius.md,
            fontSize: theme.typography.fontSize.sm,
            color: theme.colors.gray[600]
          }}>
            <strong>Current Config:</strong> {candidateConfig.count} candidates with {candidateConfig.accuracy} accuracy
            <br />
            <strong>Est. Processing Time:</strong> {getAlgorithmEstimate(params.algorithm, candidateConfig.count, demandMeshes.length, params.numStores)} seconds
          </div>
        </div>

        <div style={buttonGroupStyle}>
          <Button 
            onClick={() => setShowAdvanced(!showAdvanced)}
            variant="secondary"
            size="small"
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
          </Button>
        </div>

        {showAdvanced && (
          <div style={{ 
            marginTop: theme.spacing[4], 
            padding: theme.spacing[4], 
            backgroundColor: theme.colors.gray[50], 
            borderRadius: theme.borderRadius.lg,
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: theme.spacing[4] 
          }}>
            <Input
              label="Distance Decay"
              type="number"
              value={params.distanceDecay}
              onChange={(e) => setParams(prev => ({ ...prev, distanceDecay: parseFloat(e.target.value) || 1 }))}
              min={0.5}
              max={3}
              step={0.1}
            />

            <Input
              label="Max Budget (¥)"
              type="number"
              value={params.maxBudget}
              onChange={(e) => setParams(prev => ({ ...prev, maxBudget: parseInt(e.target.value) || 1000000 }))}
              min={1000000}
              step={1000000}
            />

            <Input
              label="Store Cost (¥)"
              type="number"
              value={params.storeCost}
              onChange={(e) => setParams(prev => ({ ...prev, storeCost: parseInt(e.target.value) || 500000 }))}
              min={100000}
              step={100000}
            />
          </div>
        )}

        {/* Historical Data Input */}
        {params.algorithm === 'historical' && (
          <div style={{ 
            marginTop: theme.spacing[4], 
            padding: theme.spacing[4], 
            backgroundColor: theme.colors.warning[50], 
            borderRadius: theme.borderRadius.lg,
            border: `1px solid ${theme.colors.warning[100]}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing[4] }}>
              <h4 style={{ ...heading3Style, fontSize: theme.typography.fontSize.lg, color: theme.colors.warning[600] }}>
                📊 Historical Store Performance Data
              </h4>
              <Button 
                onClick={() => setShowHistoricalInput(!showHistoricalInput)}
                variant="secondary"
                size="small"
              >
                {showHistoricalInput ? 'Hide Input' : 'Add Data'}
              </Button>
            </div>

            <p style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.gray[600], marginBottom: theme.spacing[3] }}>
              Provide historical performance data for your existing stores to identify winning patterns and generate tailored recommendations.
            </p>

            {historicalData.length > 0 && (
              <div style={{ marginBottom: theme.spacing[4] }}>
                <h5 style={{ fontSize: theme.typography.fontSize.sm, fontWeight: theme.typography.fontWeight.semibold, marginBottom: theme.spacing[2] }}>
                  Current Data: {historicalData.length} stores
                </h5>
                <div style={{ 
                  maxHeight: '150px', 
                  overflowY: 'auto', 
                  backgroundColor: theme.colors.white, 
                  border: `1px solid ${theme.colors.gray[300]}`, 
                  borderRadius: theme.borderRadius.md, 
                  padding: theme.spacing[2] 
                }}>
                  {historicalData.map((store, idx) => (
                    <div key={idx} style={{ 
                      fontSize: theme.typography.fontSize.xs, 
                      padding: theme.spacing[1], 
                      borderBottom: idx < historicalData.length - 1 ? `1px solid ${theme.colors.gray[200]}` : 'none' 
                    }}>
                      <strong>{store.name}</strong> - Revenue: ¥{formatNumber(store.revenue || 0)}, Profit: ¥{formatNumber(store.profit || 0)}
                    </div>
                  ))}
                </div>
                <Button 
                  onClick={() => setHistoricalData([])}
                  variant="secondary"
                  size="small"
                  style={{ marginTop: theme.spacing[2] }}
                >
                  Clear Data
                </Button>
              </div>
            )}

            {showHistoricalInput && (
              <HistoricalDataInput 
                onDataAdded={(newStore) => {
                  setHistoricalData(prev => [...prev, { ...newStore, id: Date.now().toString() }]);
                  setShowHistoricalInput(false);
                }}
                onCancel={() => setShowHistoricalInput(false)}
              />
            )}
          </div>
        )}

        <div style={{ ...buttonGroupStyle, marginTop: theme.spacing[6] }}>
          <Button 
            onClick={runOptimization}
            disabled={isOptimizing || candidateSites.length === 0}
            size="standard"
          >
            {isOptimizing ? 'Optimizing...' : `Run ${params.algorithm.toUpperCase()} Optimization`}
          </Button>
          
          {candidateSites.length > 0 && (
            <Button 
              onClick={() => onShowCandidates(candidateSites)}
              variant="secondary"
              size="standard"
            >
              Show {candidateSites.length} Candidates
            </Button>
          )}
        </div>
        
        {/* Progress Indicator */}
        {(isOptimizing || progressMessage) && (
          <div style={{
            backgroundColor: '#f0f9ff',
            border: '1px solid #0ea5e9',
            borderRadius: '8px',
            padding: '12px 16px',
            marginTop: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            {isOptimizing && (
              <div style={{
                width: '20px',
                height: '20px',
                border: '2px solid #e0e7ff',
                borderTop: '2px solid #3b82f6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
            )}
            <div>
              <div style={{ fontWeight: '500', color: '#1e40af', fontSize: '14px' }}>
                {progressMessage || 'Processing...'}
              </div>
              {estimatedTime > 0 && (
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                  Estimated time: {Math.round(estimatedTime)} seconds • {candidateSites.length} candidates • {demandMeshes.length} population meshes
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {results && (
        <div style={formStyle}>
          <h3 style={heading3Style}>Optimization Results</h3>
          
          {results.algorithm && (
            <div style={{ marginBottom: theme.spacing[4] }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: theme.spacing[4] }}>
                <div style={{ textAlign: 'center', padding: theme.spacing[3], backgroundColor: theme.colors.primary[50], borderRadius: theme.borderRadius.lg }}>
                  <div style={{ fontSize: theme.typography.fontSize['2xl'], fontWeight: theme.typography.fontWeight.bold, color: theme.colors.primary[600] }}>
                    {results.totalStores || results.selectedStores?.length || 0}
                  </div>
                  <div style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.gray[600] }}>Stores Selected</div>
                </div>
                
                <div style={{ textAlign: 'center', padding: theme.spacing[3], backgroundColor: theme.colors.success[50], borderRadius: theme.borderRadius.lg }}>
                  <div style={{ fontSize: theme.typography.fontSize['2xl'], fontWeight: theme.typography.fontWeight.bold, color: theme.colors.success[600] }}>
                    {formatNumber(results.totalDemandCaptured || results.newStores?.totalDemand || 0)}
                  </div>
                  <div style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.gray[600] }}>Demand Captured</div>
                </div>
                
                <div style={{ textAlign: 'center', padding: theme.spacing[3], backgroundColor: theme.colors.primary[50], borderRadius: theme.borderRadius.lg }}>
                  <div style={{ fontSize: theme.typography.fontSize['2xl'], fontWeight: theme.typography.fontWeight.bold, color: theme.colors.primary[600] }}>
                    {(results.coverage || results.summary?.marketCoverage || 0).toFixed(1)}%
                  </div>
                  <div style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.gray[600] }}>Market Coverage</div>
                </div>

                <div style={{ textAlign: 'center', padding: theme.spacing[3], backgroundColor: theme.colors.primary[50], borderRadius: theme.borderRadius.lg }}>
                  <div style={{ fontSize: theme.typography.fontSize['2xl'], fontWeight: theme.typography.fontWeight.bold, color: theme.colors.primary[700] }}>
                    {formatCurrency(results.totalCost || (results.totalStores * params.storeCost) || 0)}
                  </div>
                  <div style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.gray[600] }}>Total Investment</div>
                </div>
              </div>
            </div>
          )}

          {/* Algorithm-specific results */}
          {results.scenarios && (
            <div style={{ marginTop: theme.spacing[4] }}>
              <h4 style={{ ...heading3Style, fontSize: theme.typography.fontSize.lg }}>Scenario Comparison</h4>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: theme.typography.fontSize.sm }}>
                  <thead>
                    <tr style={{ backgroundColor: theme.colors.gray[100] }}>
                      <th style={{ padding: theme.spacing[2], textAlign: 'left', borderBottom: `1px solid ${theme.colors.gray[300]}` }}>Scenario</th>
                      <th style={{ padding: theme.spacing[2], textAlign: 'right', borderBottom: `1px solid ${theme.colors.gray[300]}` }}>Stores</th>
                      <th style={{ padding: theme.spacing[2], textAlign: 'right', borderBottom: `1px solid ${theme.colors.gray[300]}` }}>Demand</th>
                      <th style={{ padding: theme.spacing[2], textAlign: 'right', borderBottom: `1px solid ${theme.colors.gray[300]}` }}>Coverage</th>
                      <th style={{ padding: theme.spacing[2], textAlign: 'right', borderBottom: `1px solid ${theme.colors.gray[300]}` }}>Efficiency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.scenarios.map((scenario: any, idx: number) => (
                      <tr key={idx} style={{ borderBottom: `1px solid ${theme.colors.gray[200]}` }}>
                        <td style={{ padding: theme.spacing[2] }}>{scenario.name}</td>
                        <td style={{ padding: theme.spacing[2], textAlign: 'right' }}>{scenario.results.totalStores}</td>
                        <td style={{ padding: theme.spacing[2], textAlign: 'right' }}>{formatNumber(scenario.results.totalDemandCaptured)}</td>
                        <td style={{ padding: theme.spacing[2], textAlign: 'right' }}>{scenario.results.coverage.toFixed(1)}%</td>
                        <td style={{ padding: theme.spacing[2], textAlign: 'right' }}>{scenario.results.metrics.efficiency.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Competitive analysis results */}
          {results.newStores && results.competitors && (
            <div style={{ marginTop: theme.spacing[4] }}>
              <h4 style={{ ...heading3Style, fontSize: theme.typography.fontSize.lg }}>Competitive Analysis</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: theme.spacing[4] }}>
                <div style={{ padding: theme.spacing[3], backgroundColor: theme.colors.success[50], borderRadius: theme.borderRadius.lg }}>
                  <div style={{ fontSize: theme.typography.fontSize.xl, fontWeight: theme.typography.fontWeight.semibold, color: theme.colors.success[600] }}>
                    New Stores
                  </div>
                  <div>Market Share: {results.newStores.marketShare.toFixed(1)}%</div>
                  <div>Total Demand: {formatNumber(results.newStores.totalDemand)}</div>
                  <div>Avg per Store: {formatNumber(results.newStores.averageDemandPerStore)}</div>
                </div>
                
                <div style={{ padding: theme.spacing[3], backgroundColor: theme.colors.error[50], borderRadius: theme.borderRadius.lg }}>
                  <div style={{ fontSize: theme.typography.fontSize.xl, fontWeight: theme.typography.fontWeight.semibold, color: theme.colors.error[600] }}>
                    Competitors
                  </div>
                  <div>Market Share: {results.competitors.marketShare.toFixed(1)}%</div>
                  <div>Total Demand: {formatNumber(results.competitors.totalDemand)}</div>
                  <div>Avg per Store: {formatNumber(results.competitors.averageDemandPerStore)}</div>
                </div>
              </div>
            </div>
          )}

          {/* Store capacity analysis results */}
          {results.storeAnalysis && (
            <div style={{ marginTop: theme.spacing[4] }}>
              <h4 style={{ ...heading3Style, fontSize: theme.typography.fontSize.lg }}>Store Capacity Analysis</h4>
              
              {/* Network-level metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: theme.spacing[3], marginBottom: theme.spacing[4] }}>
                <div style={{ textAlign: 'center', padding: theme.spacing[3], backgroundColor: theme.colors.primary[50], borderRadius: theme.borderRadius.lg }}>
                  <div style={{ fontSize: theme.typography.fontSize['2xl'], fontWeight: theme.typography.fontWeight.bold, color: theme.colors.primary[600] }}>
                    {results.networkMetrics.averageUtilization}%
                  </div>
                  <div style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.gray[600] }}>Avg Utilization</div>
                </div>
                
                <div style={{ textAlign: 'center', padding: theme.spacing[3], backgroundColor: theme.colors.success[50], borderRadius: theme.borderRadius.lg }}>
                  <div style={{ fontSize: theme.typography.fontSize['2xl'], fontWeight: theme.typography.fontWeight.bold, color: theme.colors.success[600] }}>
                    {formatCurrency(results.networkMetrics.totalProfitImprovement)}
                  </div>
                  <div style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.gray[600] }}>Daily Profit Opportunity</div>
                </div>
                
                <div style={{ textAlign: 'center', padding: theme.spacing[3], backgroundColor: theme.colors.warning[50], borderRadius: theme.borderRadius.lg }}>
                  <div style={{ fontSize: theme.typography.fontSize['2xl'], fontWeight: theme.typography.fontWeight.bold, color: theme.colors.warning[600] }}>
                    {results.networkMetrics.storesOverCapacity}
                  </div>
                  <div style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.gray[600] }}>Over Capacity</div>
                </div>
                
                <div style={{ textAlign: 'center', padding: theme.spacing[3], backgroundColor: theme.colors.gray[100], borderRadius: theme.borderRadius.lg }}>
                  <div style={{ fontSize: theme.typography.fontSize['2xl'], fontWeight: theme.typography.fontWeight.bold, color: theme.colors.gray[600] }}>
                    {results.networkMetrics.storesUnderUtilized}
                  </div>
                  <div style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.gray[600] }}>Under Utilized</div>
                </div>
              </div>
              
              {/* Priority actions */}
              {results.priorityActions.length > 0 && (
                <div style={{ marginBottom: theme.spacing[4] }}>
                  <h5 style={{ ...heading3Style, fontSize: theme.typography.fontSize.base, color: theme.colors.error[600] }}>
                    Priority Actions Required
                  </h5>
                  <div style={{ backgroundColor: theme.colors.error[50], padding: theme.spacing[3], borderRadius: theme.borderRadius.lg, border: `1px solid ${theme.colors.error[100]}` }}>
                    {results.priorityActions.map((store: any, idx: number) => (
                      <div key={idx} style={{ marginBottom: theme.spacing[2] }}>
                        <strong>{store.storeName}</strong> - {store.capacity.current.utilization}% utilization
                        <br />
                        <span style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.gray[600] }}>
                          {store.recommendation}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Store-by-store analysis table */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: theme.typography.fontSize.sm }}>
                  <thead>
                    <tr style={{ backgroundColor: theme.colors.gray[100] }}>
                      <th style={{ padding: theme.spacing[2], textAlign: 'left', borderBottom: `1px solid ${theme.colors.gray[300]}` }}>Store</th>
                      <th style={{ padding: theme.spacing[2], textAlign: 'right', borderBottom: `1px solid ${theme.colors.gray[300]}` }}>Daily Demand</th>
                      <th style={{ padding: theme.spacing[2], textAlign: 'right', borderBottom: `1px solid ${theme.colors.gray[300]}` }}>Utilization</th>
                      <th style={{ padding: theme.spacing[2], textAlign: 'right', borderBottom: `1px solid ${theme.colors.gray[300]}` }}>Revenue</th>
                      <th style={{ padding: theme.spacing[2], textAlign: 'right', borderBottom: `1px solid ${theme.colors.gray[300]}` }}>Profit Improvement</th>
                      <th style={{ padding: theme.spacing[2], textAlign: 'left', borderBottom: `1px solid ${theme.colors.gray[300]}` }}>Recommendation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.storeAnalysis.map((store: any, idx: number) => (
                      <tr key={idx} style={{ borderBottom: `1px solid ${theme.colors.gray[200]}` }}>
                        <td style={{ padding: theme.spacing[2] }}>{store.storeName}</td>
                        <td style={{ padding: theme.spacing[2], textAlign: 'right' }}>{store.demand.daily}</td>
                        <td style={{ 
                          padding: theme.spacing[2], 
                          textAlign: 'right',
                          color: store.capacity.current.utilization > 95 ? theme.colors.error[600] : 
                                 store.capacity.current.utilization < 60 ? theme.colors.warning[600] : 
                                 theme.colors.success[600]
                        }}>
                          {store.capacity.current.utilization}%
                        </td>
                        <td style={{ padding: theme.spacing[2], textAlign: 'right' }}>{formatCurrency(store.financial.revenue)}</td>
                        <td style={{ padding: theme.spacing[2], textAlign: 'right' }}>
                          {store.financial.profitImprovement > 0 ? '+' : ''}{formatCurrency(store.financial.profitImprovement)}
                        </td>
                        <td style={{ 
                          padding: theme.spacing[2],
                          color: store.priority === 'High' ? theme.colors.error[600] : 
                                 store.priority === 'Medium' ? theme.colors.warning[600] : 
                                 theme.colors.success[600]
                        }}>
                          {store.recommendation}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Historical Pattern Analysis Results */}
          {results.siteRecommendations && (
            <div style={{ marginTop: theme.spacing[4] }}>
              <h4 style={{ ...heading3Style, fontSize: theme.typography.fontSize.lg }}>Historical Pattern Analysis</h4>
              
              {/* Pattern Strength Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: theme.spacing[3], marginBottom: theme.spacing[4] }}>
                <div style={{ textAlign: 'center', padding: theme.spacing[3], backgroundColor: theme.colors.primary[50], borderRadius: theme.borderRadius.lg }}>
                  <div style={{ fontSize: theme.typography.fontSize['2xl'], fontWeight: theme.typography.fontWeight.bold, color: theme.colors.primary[700] }}>
                    {results.metadata.totalStoresAnalyzed}
                  </div>
                  <div style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.gray[600] }}>Stores Analyzed</div>
                </div>
                
                <div style={{ textAlign: 'center', padding: theme.spacing[3], backgroundColor: theme.colors.success[50], borderRadius: theme.borderRadius.lg }}>
                  <div style={{ fontSize: theme.typography.fontSize['2xl'], fontWeight: theme.typography.fontWeight.bold, color: theme.colors.success[600] }}>
                    {Math.round(results.metadata.patternStrength * 100)}%
                  </div>
                  <div style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.gray[600] }}>Pattern Strength</div>
                </div>
                
                <div style={{ textAlign: 'center', padding: theme.spacing[3], backgroundColor: theme.colors.primary[50], borderRadius: theme.borderRadius.lg }}>
                  <div style={{ fontSize: theme.typography.fontSize['2xl'], fontWeight: theme.typography.fontWeight.bold, color: theme.colors.primary[600] }}>
                    {results.performanceCategories.highPerformers.length}
                  </div>
                  <div style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.gray[600] }}>High Performers</div>
                </div>
                
                <div style={{ textAlign: 'center', padding: theme.spacing[3], backgroundColor: theme.colors.warning[50], borderRadius: theme.borderRadius.lg }}>
                  <div style={{ fontSize: theme.typography.fontSize['2xl'], fontWeight: theme.typography.fontWeight.bold, color: theme.colors.warning[600] }}>
                    {results.siteRecommendations.length}
                  </div>
                  <div style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.gray[600] }}>Recommended Sites</div>
                </div>
              </div>

              {/* Feature Importance */}
              {results.featureImportance && (
                <div style={{ marginBottom: theme.spacing[4] }}>
                  <h5 style={{ ...heading3Style, fontSize: theme.typography.fontSize.base, marginBottom: theme.spacing[3] }}>
                    🎯 Key Success Factors
                  </h5>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: theme.spacing[2] }}>
                    {Object.entries(results.featureImportance).slice(0, 5).map(([feature, importance]: [string, any], idx) => (
                      <div key={feature} style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: theme.spacing[2],
                        backgroundColor: theme.colors.gray[50],
                        borderRadius: theme.borderRadius.md,
                        fontSize: theme.typography.fontSize.sm
                      }}>
                        <div style={{
                          width: `${importance * 100}%`,
                          height: '4px',
                          backgroundColor: theme.colors.primary[500],
                          borderRadius: '2px',
                          marginRight: theme.spacing[2]
                        }} />
                        <span style={{ fontWeight: theme.typography.fontWeight.medium }}>{feature}</span>
                        <span style={{ marginLeft: 'auto', color: theme.colors.gray[600] }}>
                          {Math.round(importance * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Site Recommendations */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: theme.typography.fontSize.sm }}>
                  <thead>
                    <tr style={{ backgroundColor: theme.colors.gray[100] }}>
                      <th style={{ padding: theme.spacing[2], textAlign: 'left', borderBottom: `1px solid ${theme.colors.gray[300]}` }}>Location</th>
                      <th style={{ padding: theme.spacing[2], textAlign: 'right', borderBottom: `1px solid ${theme.colors.gray[300]}` }}>Pattern Score</th>
                      <th style={{ padding: theme.spacing[2], textAlign: 'right', borderBottom: `1px solid ${theme.colors.gray[300]}` }}>Confidence</th>
                      <th style={{ padding: theme.spacing[2], textAlign: 'right', borderBottom: `1px solid ${theme.colors.gray[300]}` }}>Expected Performance</th>
                      <th style={{ padding: theme.spacing[2], textAlign: 'right', borderBottom: `1px solid ${theme.colors.gray[300]}` }}>Projected Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.siteRecommendations.slice(0, 10).map((site: any, idx: number) => {
                      const forecast = results.financialForecasts?.find((f: any) => 
                        f.siteId === `${site.latitude.toFixed(4)}_${site.longitude.toFixed(4)}`
                      );
                      return (
                        <tr key={idx} style={{ borderBottom: `1px solid ${theme.colors.gray[200]}` }}>
                          <td style={{ padding: theme.spacing[2] }}>
                            {site.latitude.toFixed(4)}, {site.longitude.toFixed(4)}
                          </td>
                          <td style={{ 
                            padding: theme.spacing[2], 
                            textAlign: 'right',
                            color: site.patternScore > 0.8 ? theme.colors.success[600] : 
                                   site.patternScore > 0.6 ? theme.colors.warning[600] : 
                                   theme.colors.error[600]
                          }}>
                            {Math.round(site.patternScore * 100)}%
                          </td>
                          <td style={{ padding: theme.spacing[2], textAlign: 'right' }}>
                            {Math.round(site.confidence * 100)}%
                          </td>
                          <td style={{ padding: theme.spacing[2], textAlign: 'right' }}>
                            {Math.round(site.expectedPerformance * 100)}%
                          </td>
                          <td style={{ padding: theme.spacing[2], textAlign: 'right' }}>
                            {forecast ? formatCurrency(forecast.projectedRevenue) : 'N/A'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Performance metrics */}
          {results.metrics && (
            <div style={{ marginTop: theme.spacing[4] }}>
              <h4 style={{ ...heading3Style, fontSize: theme.typography.fontSize.lg }}>Performance Metrics</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: theme.spacing[3] }}>
                <div>
                  <strong>Avg Demand per Store:</strong> {formatNumber(results.metrics.averageDemandPerStore)}
                </div>
                <div>
                  <strong>Cost per Demand Unit:</strong> {formatCurrency(results.metrics.costPerDemandUnit)}
                </div>
                <div>
                  <strong>ROI Efficiency:</strong> {results.metrics.efficiency.toFixed(1)}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      </div>
    </>
  );
};

export default OptimizationPanel;