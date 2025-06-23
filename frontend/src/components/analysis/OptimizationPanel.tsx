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
  generateCandidateSites 
} from '../../utils/optimizationEngine';

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
  algorithm: 'greedy' | 'mip' | 'competitive' | 'multi-scenario';
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

  // Generate candidate sites when bounds change
  useEffect(() => {
    if (bounds && demandMeshes.length > 0) {
      console.log('Generating candidate sites for optimization...');
      const candidates = generateCandidateSites(bounds, 200, existingStores);
      setCandidateSites(candidates);
      console.log(`Generated ${candidates.length} candidate sites`);
    }
  }, [bounds, demandMeshes, existingStores]);

  const showMessage = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
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

    setIsOptimizing(true);
    setMessage('');

    try {
      let optimizationResults;

      switch (params.algorithm) {
        case 'greedy':
          console.log('Running Greedy optimization...');
          optimizationResults = greedyOptimization(
            candidateSites, 
            demandMeshes, 
            params.numStores,
            {
              maxRadius: params.maxRadius,
              distanceDecay: params.distanceDecay,
              minDistance: params.minDistance,
              maxBudget: params.maxBudget,
              storeCost: params.storeCost
            }
          );
          break;

        case 'mip':
          console.log('Running MIP-style optimization...');
          optimizationResults = mipStyleOptimization(
            candidateSites, 
            demandMeshes, 
            params.numStores,
            {
              maxRadius: params.maxRadius,
              distanceDecay: params.distanceDecay,
              minDistance: params.minDistance,
              maxBudget: params.maxBudget,
              storeCost: params.storeCost,
              maxIterations: 50
            }
          );
          break;

        case 'competitive':
          console.log('Running competitive analysis...');
          if (competitors.length === 0) {
            showMessage('No competitors defined for competitive analysis.', 'error');
            setIsOptimizing(false);
            return;
          }
          
          // First get optimal sites using greedy
          const greedyResults = greedyOptimization(candidateSites, demandMeshes, params.numStores, {
            maxRadius: params.maxRadius,
            distanceDecay: params.distanceDecay,
            minDistance: params.minDistance
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
          
          optimizationResults = multiScenarioAnalysis(candidateSites, demandMeshes, scenarios);
          break;

        default:
          throw new Error('Unknown optimization algorithm');
      }

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
    } finally {
      setIsOptimizing(false);
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
                
                <div style={{ textAlign: 'center', padding: theme.spacing[3], backgroundColor: theme.colors.blue[50], borderRadius: theme.borderRadius.lg }}>
                  <div style={{ fontSize: theme.typography.fontSize['2xl'], fontWeight: theme.typography.fontWeight.bold, color: theme.colors.blue[600] }}>
                    {(results.coverage || results.summary?.marketCoverage || 0).toFixed(1)}%
                  </div>
                  <div style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.gray[600] }}>Market Coverage</div>
                </div>

                <div style={{ textAlign: 'center', padding: theme.spacing[3], backgroundColor: theme.colors.purple[50], borderRadius: theme.borderRadius.lg }}>
                  <div style={{ fontSize: theme.typography.fontSize['2xl'], fontWeight: theme.typography.fontWeight.bold, color: theme.colors.purple[600] }}>
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
                <div style={{ padding: theme.spacing[3], backgroundColor: theme.colors.green[50], borderRadius: theme.borderRadius.lg }}>
                  <div style={{ fontSize: theme.typography.fontSize.xl, fontWeight: theme.typography.fontWeight.semibold, color: theme.colors.green[600] }}>
                    New Stores
                  </div>
                  <div>Market Share: {results.newStores.marketShare.toFixed(1)}%</div>
                  <div>Total Demand: {formatNumber(results.newStores.totalDemand)}</div>
                  <div>Avg per Store: {formatNumber(results.newStores.averageDemandPerStore)}</div>
                </div>
                
                <div style={{ padding: theme.spacing[3], backgroundColor: theme.colors.red[50], borderRadius: theme.borderRadius.lg }}>
                  <div style={{ fontSize: theme.typography.fontSize.xl, fontWeight: theme.typography.fontWeight.semibold, color: theme.colors.red[600] }}>
                    Competitors
                  </div>
                  <div>Market Share: {results.competitors.marketShare.toFixed(1)}%</div>
                  <div>Total Demand: {formatNumber(results.competitors.totalDemand)}</div>
                  <div>Avg per Store: {formatNumber(results.competitors.averageDemandPerStore)}</div>
                </div>
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
  );
};

export default OptimizationPanel;