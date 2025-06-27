import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import L from 'leaflet';
import * as turf from '@turf/turf';
import 'leaflet/dist/leaflet.css';
import { auth, db } from './lib/supabase';
import MapboxMap from './components/map/MapboxMap';
import LeafletMap from './components/map/LeafletMap';
import AIAnalysisChat from './components/ai/AIAnalysisChat';
import OptimizationPanel from './components/analysis/OptimizationPanel';
import ModernLoginForm from './components/auth/ModernLoginForm';
import Button from './components/ui/Button';
import Input from './components/ui/Input';

// Hero Icons imports
import {
  MapPinIcon,
  ChartBarIcon,
  BuildingStorefrontIcon,
  BuildingOfficeIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  RocketLaunchIcon,
  LightBulbIcon,
  CpuChipIcon,
  BoltIcon,
  BanknotesIcon,
  BeakerIcon,
  GlobeAltIcon,
  UsersIcon,
  ScaleIcon,
  TrophyIcon,
  TrendingUpIcon,
  TrashIcon,
  ClipboardDocumentListIcon,
  EnvelopeIcon,
  RulerIcon,
  EyeIcon,
  StarIcon,
  CursorArrowRaysIcon,
  PresentationChartLineIcon,
  CircleStackIcon
} from '@heroicons/react/24/outline';
import { theme } from './styles/theme';

// Icon utility component
const Icon = ({ icon: IconComponent, size = 16, className = "" }) => (
  <IconComponent className={`inline-block ${className}`} style={{ width: size, height: size }} />
);
import { 
  containerStyle, 
  headerStyle, 
  titleStyle, 
  subtitleStyle,
  sectionStyle,
  formStyle,
  compactFormStyle,
  formHeaderStyle,
  buttonGroupStyle,
  buttonContainerStyle,
  projectCardStyle,
  successMessageStyle,
  errorMessageStyle,
  heading2Style,
  heading3Style,
  bodyTextStyle,
  captionTextStyle,
  flexBetweenStyle,
  mapContainerStyle,
  responsiveFlexStyle,
  preventOverflowStyle
} from './styles/layouts';

function App() {
  // Environment check and browser compatibility
  useEffect(() => {
    if (import.meta.env.MODE === 'development') {
      console.log('🔧 Dev Environment Check:');
      console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL ? '✅ SET' : '❌ NOT SET');
      console.log('Mapbox Token:', import.meta.env.VITE_MAPBOX_TOKEN ? '✅ SET' : '❌ NOT SET');
    }
    
    // Use Leaflet by default for better cross-browser compatibility
    console.log('🗺️ Using Leaflet maps for reliable cross-browser support');
    setUseMapbox(false);
    
    // Phase 7 deployment check
    if (import.meta.env.VITE_DEPLOYMENT_PHASE === '7') {
      console.log('🚀 Phase 7: Analysis & Optimization Environment');
      console.log('✅ Advanced map features enabled');
      console.log('✅ AI analysis system active');
      console.log('✅ Optimization algorithms ready');
    }
  }, []);

  const [currentView, setCurrentView] = useState(() => {
    // Restore view from localStorage, default to 'login' if not found
    return localStorage.getItem('currentView') || 'login';
  });
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [locations, setLocations] = useState([]);
  const [tradeAreas, setTradeAreas] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [message, setMessage] = useState('');
  const [map, setMap] = useState(null);
  const [candidateLocations, setCandidateLocations] = useState([]);
  const [competitorAnalysis, setCompetitorAnalysis] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [useMapbox, setUseMapbox] = useState(true);
  const [showAIChat, setShowAIChat] = useState(false);
  const [authView, setAuthView] = useState('login'); // 'login' or 'register'
  const [showOptimization, setShowOptimization] = useState(false);
  const demandMeshesRef = useRef([]); // Use ref instead of state to prevent loops
  const [demandDataReady, setDemandDataReady] = useState(false); // Track when data is ready
  const [optimizationResults, setOptimizationResults] = useState(null);
  const [candidateMarkers, setCandidateMarkers] = useState([]);
  const [showDemandGrid, setShowDemandGrid] = useState(false);
  const [meshSize, setMeshSize] = useState(500); // Default 500m mesh size
  const [catchmentRadius, setCatchmentRadius] = useState(2.0); // Default 2km radius
  const [useFullMapBounds, setUseFullMapBounds] = useState(false); // Toggle for full map coverage
  const [formCoordinates, setFormCoordinates] = useState({ lat: '', lng: '' });
  const [currentAddress, setCurrentAddress] = useState('');
  const [analysisRecommendations, setAnalysisRecommendations] = useState('');

  // Helper function to change view and persist to localStorage
  const changeView = (newView) => {
    setCurrentView(newView);
    localStorage.setItem('currentView', newView);
  };

  // Supabase direct API handler for production
  const handleSupabaseAPI = async (endpoint, options = {}) => {
    // Map API endpoints to Supabase operations
    if (endpoint === '/health') {
      return { status: 'OK', timestamp: new Date().toISOString(), service: 'Supabase Direct' };
    }
    
    if (endpoint === '/auth/login') {
      const { email, password } = options.body ? JSON.parse(options.body) : {};
      const { data, error } = await auth.signInWithPassword({ email, password });
      if (error) throw error;
      return { user: data.user, token: data.session?.access_token };
    }
    
    if (endpoint === '/projects') {
      if (options.method === 'POST') {
        const projectData = options.body ? JSON.parse(options.body) : {};
        const { data, error } = await db.from('projects').insert(projectData).select().single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await db.from('projects').select('*');
        if (error) throw error;
        return data;
      }
    }
    
    // Default mock response for unimplemented endpoints
    return { message: 'Supabase direct mode - endpoint not implemented', endpoint };
  };

  // API calls - use Supabase direct in production
  const apiCall = async (endpoint, options = {}) => {
    try {
      // In production, use Supabase directly instead of backend API
      if (import.meta.env.VITE_USE_SUPABASE_DIRECT === 'true') {
        return await handleSupabaseAPI(endpoint, options);
      }
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...options.headers
        },
        ...options
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'API Error');
      return data;
    } catch (error) {
      setMessage(`Error: ${error.message}`);
      throw error;
    }
  };

  // Modern Authentication handlers
  const handleModernLogin = async (email, password) => {
    try {
      console.log('🔐 Attempting login for:', email);
      const { data, error } = await auth.signIn(email, password);
      
      console.log('📝 Login attempt result:', { 
        success: !!data?.session, 
        user: data?.user?.email, 
        error: error?.message 
      });
      
      if (error) {
        console.error('❌ Supabase auth error:', error);
        throw new Error(error.message);
      }
      
      if (data?.session?.user) {
        console.log('✅ Login successful, setting user state');
        setUser(data.session.user);
        setToken(data.session.access_token);
        localStorage.setItem('token', data.session.access_token);
        setMessage('Login successful!');
        
        console.log('🔄 Redirecting to dashboard');
        changeView('dashboard');
        
        console.log('📂 Loading projects...');
        await loadProjects();
      } else {
        throw new Error('No session returned from login');
      }
    } catch (error) {
      console.error('❌ Login failed:', error);
      setMessage(`Login error: ${error.message}`);
      throw error; // Re-throw for ModernLoginForm to handle
    }
  };

  // Legacy Authentication (keep for backup)
  const handleLogin = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    await handleModernLogin(formData.get('email'), formData.get('password'));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
      const { data, error } = await auth.signUp(
        formData.get('email'),
        formData.get('password'),
        {
          firstName: formData.get('firstName'),
          lastName: formData.get('lastName')
        }
      );
      
      if (error) {
        throw new Error(error.message);
      }
      
      setToken(data.session?.access_token);
      setUser(data.user);
      setMessage('Registration successful! Please check your email to verify your account.');
      changeView('dashboard');
      loadProjects();
    } catch (error) {
      setMessage(`Registration error: ${error.message}`);
    }
  };

  // Projects
  const loadProjects = async () => {
    try {
      if (!user?.id) {
        console.log('⚠️ Cannot load projects: No user ID available', user);
        return;
      }
      
      console.log('📂 Loading projects for user:', user.id);
      const { data, error } = await db.getProjects(user.id);
      
      if (error) {
        console.error('❌ Error loading projects:', error);
        throw new Error(error.message);
      }
      
      console.log('✅ Projects loaded:', data?.length || 0, 'projects');
      setProjects(data || []);
    } catch (error) {
      console.error('❌ LoadProjects failed:', error);
      setMessage(`Error loading projects: ${error.message}`);
    }
  };

  const createProject = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      
      const { data, error } = await db.createProject(user.id, {
        name: formData.get('name'),
        description: formData.get('description')
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      setMessage('Project created successfully!');
      e.target.reset();
      loadProjects();
    } catch (error) {
      setMessage(`Error creating project: ${error.message}`);
    }
  };

  // AI Analysis Handler using OpenAI API
  const handleAIAnalysis = async () => {
    if (!currentAddress.trim()) {
      setMessage('Please enter your analysis goal first.');
      return;
    }

    // Current project context (moved outside try block)
    const projectContext = {
      projectName: selectedProject?.name || 'Project',
      locationsCount: locations.length,
      storesCount: locations.filter(l => l.location_type === 'store').length,
      competitorsCount: locations.filter(l => l.location_type === 'competitor').length,
      poisCount: locations.filter(l => l.location_type === 'poi').length,
      hasPopulationGrid: showDemandGrid,
      hasTradeAreas: tradeAreas.length > 0
    };

    try {
      setMessage('Analyzing your request with AI...');

      const prompt = `
You are an expert retail location analyst helping with trade area analysis. 

USER REQUEST: "${currentAddress}"

CURRENT PROJECT STATE:
- Project: ${projectContext.projectName}
- Total Locations: ${projectContext.locationsCount}
- Stores: ${projectContext.storesCount}
- Competitors: ${projectContext.competitorsCount}  
- Points of Interest: ${projectContext.poisCount}
- Population Grid: ${projectContext.hasPopulationGrid ? 'ENABLED' : 'NOT ENABLED'}
- Trade Areas: ${projectContext.hasTradeAreas ? tradeAreas.length + ' created' : 'None created'}

AVAILABLE PLATFORM FUNCTIONS & TOOLS:

**1. DATA MANAGEMENT:**
- Add Location: Manually add stores/competitors with name, address, coordinates, type
- CSV Bulk Upload: Import multiple locations with auto-geocoding for Japanese addresses
- Location Types: Store (your locations), Competitor (rival businesses), POI (points of interest)

**2. VISUALIZATION TOOLS:**
- Population Grid: 250m mesh population density overlay (click "📊 Population Grid" button)
- Map Types: Satellite imagery (Mapbox) or Japanese government data (国土地理院)
- Trade Area Creation: Create radius-based or Huff model trade areas for each location

**3. OPTIMIZATION ALGORITHMS:**
- Greedy Optimization: Fast algorithm for finding optimal store locations
- MIP (Mixed Integer Programming): Advanced optimization for complex scenarios  
- Competitive Analysis: Analyze market positioning vs competitors
- Multi-scenario Analysis: Compare 4 strategies (Conservative, Standard, Optimized, Aggressive)
- Capacity Optimization: Optimize store capacity, staffing, and financial performance
- Historical Analysis: Use past performance data to predict optimal locations

**4. AI ANALYSIS FEATURES:**
- AI Analyst Chat: Interactive AI for strategic recommendations and insights
- Natural Language Queries: Ask questions like "find underserved areas" or "analyze competition"
- Automated Recommendations: AI suggests next steps based on current analysis state

**5. SPECIFIC ANALYSIS FUNCTIONS:**
- Distance Decay Analysis: How customer demand decreases with distance
- Market Share Calculation: Estimate potential market capture using Huff model
- Financial Modeling: Revenue/cost projections, ROI calculations, break-even analysis
- Competitive Pressure Analysis: Identify high-threat competitors and market saturation
- Demand Flow Visualization: See customer flow patterns between locations
- Site Selection Scoring: Rate potential locations based on multiple criteria

**6. WORKFLOW CAPABILITIES:**
- Project Management: Create/switch between multiple analysis projects
- Data Export: Download analysis results and recommendations  
- Scenario Comparison: Side-by-side comparison of different expansion strategies
- Performance Tracking: Monitor key metrics across different time periods

**UI BUTTON REFERENCES:**
- "Population Grid" = Enable/disable population density visualization (ChartBar icon)
- "Store Optimizer" = Launch optimization panel with algorithm selection (Target icon)
- "AI Analyst" = Open interactive AI chat for strategic guidance (CpuChip icon)
- "Create Trade Area" = Create trade areas for specific locations (PresentationChart icon)

Based on the user's request and current project state, provide specific, actionable guidance in HTML format with:
- Clear interpretation of their goal
- Step-by-step instructions using the exact button names and functions above
- Expected insights and outcomes
- Recommendations for next actions

Use <strong> for emphasis, <ul><li> for steps, and be specific about which tools/buttons to use.
`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are an expert retail location analyst. Provide clear, actionable guidance.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 500,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const recommendations = data.choices[0].message.content;
      
      setAnalysisRecommendations(recommendations);
      setMessage('AI analysis complete! See recommendations below.');
      
    } catch (error) {
      console.error('AI analysis failed:', error);
      
      // Comprehensive fallback based on current state
      const fallbackRecommendations = `
        <p><strong>Analysis Goal:</strong> ${currentAddress}</p>
        
        <p><strong>Current Status:</strong> ${projectContext.storesCount} store(s), ${projectContext.competitorsCount} competitor(s), Population Grid ${projectContext.hasPopulationGrid ? 'ENABLED' : 'DISABLED'}</p>
        
        <ul>
          ${projectContext.locationsCount === 0 ? `
            <li><strong>Step 1:</strong> Add locations using the "Add Location" form below or CSV bulk upload</li>
            <li><strong>Step 2:</strong> Click <strong>"Population Grid"</strong> to enable population density visualization</li>
          ` : ''}
          
          ${projectContext.locationsCount > 0 && !projectContext.hasPopulationGrid ? `
            <li><strong>Next:</strong> Click <strong>"Population Grid"</strong> to see customer demand patterns</li>
          ` : ''}
          
          ${projectContext.storesCount > 0 ? `
            <li><strong>Analysis:</strong> Click <strong>"Store Optimizer"</strong> and choose algorithm:
              <ul>
                <li>Greedy: Fast optimization for new locations</li>
                <li>Multi-scenario: Compare 4 different strategies</li>
                <li>Capacity: Optimize existing store performance</li>
              </ul>
            </li>
          ` : ''}
          
          <li><strong>AI Insights:</strong> Use <strong>"AI Analyst"</strong> for interactive strategic guidance</li>
          
          ${!projectContext.hasTradeAreas && projectContext.locationsCount > 0 ? `
            <li><strong>Trade Areas:</strong> Click <strong>"Create Trade Area"</strong> for each location to analyze market coverage</li>
          ` : ''}
        </ul>
        
        <p><strong>Available Analysis Types:</strong></p>
        <ul>
          <li>Site Selection & Expansion Planning</li>
          <li>Competitive Market Analysis</li>
          <li>Customer Demand Flow Visualization</li>
          <li>Financial Performance Optimization</li>
          <li>Multi-scenario Strategic Planning</li>
        </ul>
        
        <p><em>For advanced AI-powered recommendations, configure your OpenAI API key in the environment settings.</em></p>
      `;
      
      setAnalysisRecommendations(fallbackRecommendations);
      setMessage('Basic workflow generated. For AI analysis, configure OpenAI API key.');
    }
  };

  // Locations
  const loadLocations = async (projectId) => {
    try {
      const { data, error } = await db.getLocations(projectId);
      if (error) {
        throw new Error(error.message);
      }
      setLocations(data || []);
    } catch (error) {
      setMessage(`Error loading locations: ${error.message}`);
    }
  };

  const createLocation = async (e) => {
    e.preventDefault();
    if (!selectedProject) return;
    
    const formData = new FormData(e.target);
    try {
      const { data, error } = await db.createLocation({
        project_id: selectedProject.id,
        name: formData.get('locationName'),
        address: formData.get('address'),
        latitude: parseFloat(formData.get('latitude')),
        longitude: parseFloat(formData.get('longitude')),
        location_type: formData.get('locationType')
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      setMessage('Location created successfully!');
      e.target.reset();
      setCurrentAddress(''); // Clear the address state
      setFormCoordinates({ lat: '', lng: '' }); // Clear coordinate state
      loadLocations(selectedProject.id);
    } catch (error) {
      setMessage(`Error creating location: ${error.message}`);
    }
  };

  // Update map markers - no-op as maps update automatically via React props
  const updateMapMarkers = () => {
    // Map components automatically update when locations state changes
    // This function exists for compatibility but doesn't need to do anything
  };

  // Delete location functionality
  const deleteLocation = async (locationId) => {
    try {
      const { error } = await db.deleteLocation(locationId);
      
      if (error) {
        throw new Error(error.message);
      }
      
      setMessage('Location deleted successfully!');
      loadLocations(selectedProject.id);
    } catch (error) {
      setMessage(`Error deleting location: ${error.message}`);
    }
  };

  // Enhanced Geocoding with multiple providers
  const geocodeAddress = async (address) => {
    try {
      setMessage('🔍 Searching address...');
      
      // Method 1: Check if input is already coordinates
      const coordMatch = address.match(/(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)/);
      if (coordMatch) {
        const lat = parseFloat(coordMatch[1]);
        const lng = parseFloat(coordMatch[2]);
        
        // Check if coordinates are reasonable for Japan
        if (lat >= 24 && lat <= 46 && lng >= 122 && lng <= 154) {
          setMessage(`✅ Coordinates extracted from input: ${lat}, ${lng}`);
          return {
            latitude: lat,
            longitude: lng
          };
        }
      }
      
      // Method 2: Try 国土地理院 (GSI Japan) API first for Japanese addresses
      try {
        setMessage('🔄 Trying 国土地理院 geocoding service...');
        
        const gsiUrl = `https://msearch.gsi.go.jp/address-search/AddressSearch?q=${encodeURIComponent(address)}`;
        const response = await fetch(gsiUrl);
        
        if (!response.ok) {
          throw new Error(`GSI HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data && data.length > 0) {
          const result = data[0];
          
          // GSI returns coordinates in geometry.coordinates [lng, lat] format
          const coordinates = {
            latitude: parseFloat(result.geometry.coordinates[1]),
            longitude: parseFloat(result.geometry.coordinates[0])
          };
          
          setMessage(`✅ Address found via 国土地理院: ${result.properties.title || address}`);
          return coordinates;
        } else {
          setMessage('🔄 No results from 国土地理院, trying OpenStreetMap...');
        }
      } catch (gsiError) {
        setMessage('🔄 国土地理院 failed, trying OpenStreetMap...');
      }
      
      // Method 3: Try OpenStreetMap Nominatim as fallback
      try {
        setMessage('🔄 Trying OpenStreetMap geocoding...');
        
        const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=jp&limit=3&addressdetails=1`;
        const response = await fetch(nominatimUrl, {
          headers: {
            'User-Agent': 'TradeAreaAnalysis/1.0 (https://trade-area-analysis-2png.vercel.app)'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data && data.length > 0) {
          const result = data[0];
          const coordinates = {
            latitude: parseFloat(result.lat),
            longitude: parseFloat(result.lon)
          };
          
          setMessage(`✅ Address found via OpenStreetMap: ${result.display_name}`);
          return coordinates;
        } else {
          setMessage('🔄 No results from OpenStreetMap, trying global search...');
        }
      } catch (nominatimError) {
        setMessage('🔄 OpenStreetMap failed, trying global search...');
      }
      
      // Method 4: Try a different Nominatim instance (with global search)
      try {
        console.log('=== Method 4: Trying global Nominatim search ===');
        const globalUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address + " Japan")}&limit=3`;
        
        const response = await fetch(globalUrl, {
          headers: {
            'User-Agent': 'TradeAreaAnalysis/1.0'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Global Nominatim data:', data);
          
          // Filter results for Japan
          const japanResults = data.filter(result => {
            const lat = parseFloat(result.lat);
            const lon = parseFloat(result.lon);
            return lat >= 24 && lat <= 46 && lon >= 122 && lon <= 154;
          });
          
          if (japanResults.length > 0) {
            const result = japanResults[0];
            const coordinates = {
              latitude: parseFloat(result.lat),
              longitude: parseFloat(result.lon)
            };
            
            setMessage(`✅ Address found via global search: ${result.display_name}`);
            return coordinates;
          }
        }
      } catch (globalError) {
        console.log('Global search failed:', globalError);
      }
      
      // Method 5: Handle common Japanese location patterns
      const commonLocations = {
        '東京駅': { latitude: 35.6812, longitude: 139.7671 },
        'tokyo station': { latitude: 35.6812, longitude: 139.7671 },
        'tokyo': { latitude: 35.6812, longitude: 139.7671 },
        '新宿駅': { latitude: 35.6896, longitude: 139.7006 },
        'shinjuku station': { latitude: 35.6896, longitude: 139.7006 },
        'shinjuku': { latitude: 35.6896, longitude: 139.7006 },
        '渋谷駅': { latitude: 35.6580, longitude: 139.7016 },
        'shibuya station': { latitude: 35.6580, longitude: 139.7016 },
        'shibuya': { latitude: 35.6580, longitude: 139.7016 },
        '池袋駅': { latitude: 35.7295, longitude: 139.7109 },
        'ikebukuro station': { latitude: 35.7295, longitude: 139.7109 },
        'ikebukuro': { latitude: 35.7295, longitude: 139.7109 },
        '品川駅': { latitude: 35.6284, longitude: 139.7387 },
        'shinagawa station': { latitude: 35.6284, longitude: 139.7387 },
        'shinagawa': { latitude: 35.6284, longitude: 139.7387 },
        // Tokyo areas
        '芝浦': { latitude: 35.6397, longitude: 139.7479 },
        'shibaura': { latitude: 35.6397, longitude: 139.7479 },
        '港区': { latitude: 35.6581, longitude: 139.7414 },
        'minato': { latitude: 35.6581, longitude: 139.7414 },
        '新宿区': { latitude: 35.6938, longitude: 139.7034 },
        'shinjuku-ku': { latitude: 35.6938, longitude: 139.7034 },
        '渋谷区': { latitude: 35.6627, longitude: 139.7038 },
        'shibuya-ku': { latitude: 35.6627, longitude: 139.7038 }
      };
      
      const normalizedAddress = address.toLowerCase().trim();
      
      for (const [key, coords] of Object.entries(commonLocations)) {
        if (normalizedAddress.includes(key)) {
          setMessage(`✅ Found common location: ${key} → ${coords.latitude}, ${coords.longitude}`);
          return coords;
        }
      }
      
      throw new Error('Address not found. Try:\n• Coordinates: "35.6762, 139.6503"\n• Station names: "Tokyo Station", "東京駅"\n• Full addresses: "東京都新宿区新宿3-1-1"');
    } catch (error) {
      console.error('All geocoding methods failed:', error);
      setMessage(`❌ Geocoding failed: ${error.message}`);
      return null;
    }
  };

  // Reverse Geocoding - Get address from coordinates using 国土地理院
  const reverseGeocode = async (latitude, longitude) => {
    try {
      setMessage('🔍 Looking up address...');
      
      // Using 国土地理院 reverse geocoding service
      const response = await fetch(
        `https://mreversegeocoder.gsi.go.jp/reverse-geocoder/LonLatToAddress?lon=${longitude}&lat=${latitude}`
      );
      const data = await response.json();
      
      if (data && data.results && data.results.length > 0) {
        const result = data.results[0];
        let address = '';
        
        // Build Japanese address from components
        if (result.muniCd) {
          // Try to get more detailed address info
          address += result.lv01Nm || ''; // Prefecture
          address += result.lv02Nm || ''; // City/Municipality
          
          if (result.lv03Nm) address += result.lv03Nm; // District
          if (result.lv04Nm) address += result.lv04Nm; // Sub-district
          if (result.lv05Nm) address += result.lv05Nm; // Block
        }
        
        if (!address && result.lv01Nm) {
          // Fallback to basic prefecture/city
          address = `${result.lv01Nm}${result.lv02Nm || ''}`;
        }
        
        if (!address) {
          address = `緯度${latitude.toFixed(6)}, 経度${longitude.toFixed(6)}`;
        }
        
        setMessage(`✅ Address found: ${address}`);
        return address;
      }
      
      throw new Error('Address not found for these coordinates');
    } catch (error) {
      const fallbackAddress = `緯度${latitude.toFixed(6)}, 経度${longitude.toFixed(6)}`;
      setMessage(`⚠️ Using coordinates as address: ${error.message}`);
      return fallbackAddress;
    }
  };

  // Auto-fill coordinates from address
  const handleAddressGeocoding = async (address, callback) => {
    if (!address || address.length < 3) {
      setMessage('Please enter an address with at least 3 characters');
      return;
    }
    
    const coords = await geocodeAddress(address);
    if (coords) {
      // Use callback to update form fields properly
      if (callback) {
        callback(coords);
      } else {
        // Fallback to DOM manipulation
        const latInput = document.querySelector('input[name="latitude"]');
        const lngInput = document.querySelector('input[name="longitude"]');
        
        if (latInput && lngInput) {
          latInput.value = coords.latitude.toString();
          lngInput.value = coords.longitude.toString();
          
          // Trigger change event for React to pick up the change
          const event = new Event('input', { bubbles: true });
          latInput.dispatchEvent(event);
          lngInput.dispatchEvent(event);
        }
      }
    }
  };

  // Auto-fill address from coordinates
  const handleReverseGeocoding = async (latitude, longitude) => {
    if (!latitude || !longitude) return;
    
    const address = await reverseGeocode(latitude, longitude);
    if (address) {
      // Auto-fill the address field
      const addressInput = document.querySelector('input[name="address"]');
      if (addressInput) {
        addressInput.value = address;
      }
    }
  };

  // Advanced Analytics - Enhanced Huff Model Implementation
  const calculateHuffModel = (locations, targetLocation, distanceDecay = 2.0) => {
    if (!locations || locations.length === 0) return [];
    
    // Enhanced attractiveness calculation based on store type
    const getAttractiveness = (locationType) => {
      switch (locationType) {
        case 'store': return 1.5; // Higher attractiveness for own stores
        case 'competitor': return 1.0; // Standard competitor attractiveness
        case 'poi': return 0.5; // Lower attractiveness for general POIs
        default: return 1.0;
      }
    };
    
    // Generate denser demand points grid around the area with realistic spacing
    const bounds = turf.bbox(turf.featureCollection(
      locations.map(loc => turf.point([loc.coordinates.coordinates[0], loc.coordinates.coordinates[1]]))
    ));
    
    // Expand bounds slightly for better coverage
    const padding = 0.01; // ~1km padding
    bounds[0] -= padding; // min lng
    bounds[1] -= padding; // min lat  
    bounds[2] += padding; // max lng
    bounds[3] += padding; // max lat
    
    const demandPoints = [];
    const gridSize = 0.003; // ~300m grid for higher precision
    
    for (let lat = bounds[1]; lat <= bounds[3]; lat += gridSize) {
      for (let lng = bounds[0]; lng <= bounds[2]; lng += gridSize) {
        const point = turf.point([lng, lat]);
        
        // More realistic population distribution with density clustering
        const centerPoint = turf.point([
          (bounds[0] + bounds[2]) / 2, 
          (bounds[1] + bounds[3]) / 2
        ]);
        const distanceFromCenter = turf.distance(point, centerPoint, { units: 'kilometers' });
        
        // Higher population density near centers, with random variation
        const baseDensity = Math.max(50, 800 - (distanceFromCenter * 100));
        const population = baseDensity + (Math.random() * 300 - 150);
        
        demandPoints.push({
          point,
          population: Math.max(10, population), // Minimum 10 people per grid
          coordinates: [lng, lat]
        });
      }
    }
    
    // Calculate Huff Model probabilities for each demand point
    const captureData = demandPoints.map(demand => {
      let totalAttraction = 0;
      const storeAttractions = locations.map(store => {
        const storePoint = turf.point([store.coordinates.coordinates[0], store.coordinates.coordinates[1]]);
        const distance = turf.distance(demand.point, storePoint, { units: 'kilometers' });
        
        if (distance === 0) return { storeId: store.id, attraction: 0, distance: 0 };
        
        // Enhanced attractiveness based on store type and size
        const attractiveness = getAttractiveness(store.location_type);
        const attraction = attractiveness / Math.pow(Math.max(0.1, distance), distanceDecay);
        totalAttraction += attraction;
        
        return {
          storeId: store.id,
          storeName: store.name,
          storeType: store.location_type,
          attraction,
          distance,
          attractiveness
        };
      });
      
      // Calculate capture probability for target location
      const targetStore = storeAttractions.find(s => s.storeId === targetLocation.id);
      const captureProb = totalAttraction > 0 ? (targetStore?.attraction || 0) / totalAttraction : 0;
      
      // Enhanced metrics
      return {
        ...demand,
        captureProb,
        capturedDemand: demand.population * captureProb,
        totalAttraction,
        storeAttractions,
        competitorCount: storeAttractions.filter(s => s.storeType === 'competitor').length,
        nearestCompetitorDistance: Math.min(...storeAttractions.filter(s => s.storeType === 'competitor').map(s => s.distance))
      };
    });
    
    return captureData;
  };

  // Store Location Optimization - Greedy Algorithm Implementation
  const generateCandidateLocations = (existingLocations, numCandidates = 50) => {
    if (!existingLocations || existingLocations.length === 0) return [];
    
    // Calculate bounds around existing locations
    const bounds = turf.bbox(turf.featureCollection(
      existingLocations.map(loc => turf.point([loc.coordinates.coordinates[0], loc.coordinates.coordinates[1]]))
    ));
    
    // Expand bounds for candidate generation
    const padding = 0.02; // ~2km padding
    bounds[0] -= padding;
    bounds[1] -= padding;
    bounds[2] += padding;
    bounds[3] += padding;
    
    const candidates = [];
    
    for (let i = 0; i < numCandidates; i++) {
      // Generate random candidate locations within bounds
      const lng = bounds[0] + (Math.random() * (bounds[2] - bounds[0]));
      const lat = bounds[1] + (Math.random() * (bounds[3] - bounds[1]));
      
      // Check minimum distance from existing locations (avoid placing too close)
      const candidatePoint = turf.point([lng, lat]);
      const minDistanceToExisting = Math.min(...existingLocations.map(loc => {
        const existingPoint = turf.point([loc.coordinates.coordinates[0], loc.coordinates.coordinates[1]]);
        return turf.distance(candidatePoint, existingPoint, { units: 'kilometers' });
      }));
      
      if (minDistanceToExisting > 0.5) { // At least 500m from existing stores
        candidates.push({
          id: `candidate_${i}`,
          name: `Candidate ${i + 1}`,
          coordinates: { coordinates: [lng, lat] },
          location_type: 'candidate',
          attractiveness: 1.0,
          score: 0
        });
      }
    }
    
    return candidates;
  };

  const optimizeStoreLocations = (existingLocations, candidates, numNewStores = 3, distanceDecay = 2.0) => {
    if (!existingLocations || !candidates || candidates.length === 0) return null;
    
    const selectedStores = [];
    const remainingCandidates = [...candidates];
    let currentStores = [...existingLocations];
    
    console.log(`Starting optimization to select ${numNewStores} new store locations...`);
    
    for (let iteration = 0; iteration < numNewStores; iteration++) {
      let bestCandidate = null;
      let bestScore = -1;
      let bestCandidateIndex = -1;
      
      if (remainingCandidates.length === 0) {
        console.log('No more candidates available');
        break;
      }
      
      // Calculate baseline market capture with current stores
      const baselineCapture = calculateMarketCapture(currentStores, distanceDecay);
      
      // Evaluate each remaining candidate
      remainingCandidates.forEach((candidate, index) => {
        // Add candidate to current store set temporarily
        const testStores = [...currentStores, {
          ...candidate,
          location_type: 'store' // Treat as our store for optimization
        }];
        
        // Calculate market capture with this candidate added
        const testCapture = calculateMarketCapture(testStores, distanceDecay);
        
        // Calculate improvement in total captured demand for our stores
        const improvementScore = testCapture.totalOwnDemand - baselineCapture.totalOwnDemand;
        
        if (improvementScore > bestScore) {
          bestScore = improvementScore;
          bestCandidate = {
            ...candidate,
            score: improvementScore,
            marketImpact: {
              additionalDemand: improvementScore,
              totalDemandAfter: testCapture.totalOwnDemand,
              marketShareAfter: testCapture.ownMarketShare
            }
          };
          bestCandidateIndex = index;
        }
      });
      
      if (bestCandidate && bestScore > 0) {
        selectedStores.push(bestCandidate);
        currentStores.push({
          ...bestCandidate,
          location_type: 'store'
        });
        remainingCandidates.splice(bestCandidateIndex, 1);
        
        console.log(`Selected store ${iteration + 1}: ${bestCandidate.name} (Score: ${bestScore.toFixed(2)})`);
      } else {
        console.log(`No suitable candidate found for iteration ${iteration + 1}`);
        break;
      }
    }
    
    // Calculate final optimization results
    const finalCapture = calculateMarketCapture(currentStores, distanceDecay);
    const originalCapture = calculateMarketCapture(existingLocations, distanceDecay);
    
    return {
      selectedStores,
      totalImprovement: finalCapture.totalOwnDemand - originalCapture.totalOwnDemand,
      marketShareGain: finalCapture.ownMarketShare - originalCapture.ownMarketShare,
      finalMarketShare: finalCapture.ownMarketShare,
      competitiveAnalysis: {
        beforeOptimization: originalCapture,
        afterOptimization: finalCapture
      }
    };
  };

  const calculateMarketCapture = (storeLocations, distanceDecay = 2.0) => {
    if (!storeLocations || storeLocations.length === 0) {
      return { totalOwnDemand: 0, totalCompetitorDemand: 0, ownMarketShare: 0 };
    }
    
    // Generate demand grid for market capture calculation
    const bounds = turf.bbox(turf.featureCollection(
      storeLocations.map(loc => turf.point([loc.coordinates.coordinates[0], loc.coordinates.coordinates[1]]))
    ));
    
    const padding = 0.015;
    bounds[0] -= padding;
    bounds[1] -= padding;
    bounds[2] += padding;
    bounds[3] += padding;
    
    const demandPoints = [];
    const gridSize = 0.004; // ~400m grid
    
    for (let lat = bounds[1]; lat <= bounds[3]; lat += gridSize) {
      for (let lng = bounds[0]; lng <= bounds[2]; lng += gridSize) {
        const point = turf.point([lng, lat]);
        
        // Realistic population distribution
        const centerPoint = turf.point([
          (bounds[0] + bounds[2]) / 2,
          (bounds[1] + bounds[3]) / 2
        ]);
        const distanceFromCenter = turf.distance(point, centerPoint, { units: 'kilometers' });
        const baseDensity = Math.max(30, 600 - (distanceFromCenter * 80));
        const population = baseDensity + (Math.random() * 200 - 100);
        
        demandPoints.push({
          point,
          population: Math.max(5, population),
          coordinates: [lng, lat]
        });
      }
    }
    
    // Calculate market capture for each demand point
    let totalOwnDemand = 0;
    let totalCompetitorDemand = 0;
    let totalDemand = 0;
    
    demandPoints.forEach(demand => {
      let totalAttraction = 0;
      const storeAttractions = storeLocations.map(store => {
        const storePoint = turf.point([store.coordinates.coordinates[0], store.coordinates.coordinates[1]]);
        const distance = turf.distance(demand.point, storePoint, { units: 'kilometers' });
        
        if (distance === 0) return { storeType: store.location_type, attraction: 0, distance: 0 };
        
        const attractiveness = store.attractiveness || (store.location_type === 'store' ? 1.2 : 1.0);
        const attraction = attractiveness / Math.pow(Math.max(0.1, distance), distanceDecay);
        totalAttraction += attraction;
        
        return {
          storeType: store.location_type,
          attraction,
          distance
        };
      });
      
      if (totalAttraction > 0) {
        storeAttractions.forEach(store => {
          const captureProb = store.attraction / totalAttraction;
          const capturedDemand = demand.population * captureProb;
          
          if (store.storeType === 'store' || store.storeType === 'candidate') {
            totalOwnDemand += capturedDemand;
          } else if (store.storeType === 'competitor') {
            totalCompetitorDemand += capturedDemand;
          }
          
          totalDemand += capturedDemand;
        });
      }
    });
    
    const ownMarketShare = totalDemand > 0 ? (totalOwnDemand / totalDemand * 100) : 0;
    
    return {
      totalOwnDemand,
      totalCompetitorDemand,
      totalDemand,
      ownMarketShare
    };
  };

  // Advanced Competitor Impact Analysis
  const analyzeCompetitorImpact = (storeLocations, competitorLocations, distanceDecay = 2.0) => {
    if (!storeLocations || !competitorLocations || storeLocations.length === 0 || competitorLocations.length === 0) {
      return null;
    }

    const analysis = {};
    
    storeLocations.forEach(store => {
      if (store.location_type !== 'store') return;
      
      const storePoint = turf.point([store.coordinates.coordinates[0], store.coordinates.coordinates[1]]);
      
      // Find nearby competitors and their impact
      const competitorImpacts = competitorLocations.map(competitor => {
        const competitorPoint = turf.point([competitor.coordinates.coordinates[0], competitor.coordinates.coordinates[1]]);
        const distance = turf.distance(storePoint, competitorPoint, { units: 'kilometers' });
        
        // Calculate impact based on distance decay
        const proximityImpact = distance > 0 ? Math.exp(-distance / 2) : 1; // Exponential decay
        const attractivenessRatio = (competitor.attractiveness || 1.0) / (store.attractiveness || 1.0);
        const competitiveImpact = proximityImpact * attractivenessRatio;
        
        return {
          competitorId: competitor.id,
          competitorName: competitor.name,
          distance: distance,
          proximityImpact: proximityImpact,
          attractivenessRatio: attractivenessRatio,
          competitiveImpact: competitiveImpact,
          threatLevel: competitiveImpact > 0.7 ? 'High' : 
                      competitiveImpact > 0.4 ? 'Medium' : 
                      competitiveImpact > 0.2 ? 'Low' : 'Minimal'
        };
      }).sort((a, b) => b.competitiveImpact - a.competitiveImpact);
      
      // Calculate market pressure metrics
      const totalCompetitivePressure = competitorImpacts.reduce((sum, comp) => sum + comp.competitiveImpact, 0);
      const nearbyCompetitors = competitorImpacts.filter(comp => comp.distance <= 3.0); // Within 3km
      const highThreatCompetitors = competitorImpacts.filter(comp => comp.threatLevel === 'High');
      
      // Calculate market vulnerability
      const vulnerability = Math.min(totalCompetitivePressure / storeLocations.length, 1.0);
      const competitiveAdvantage = 1 - vulnerability;
      
      // Generate strategic recommendations
      const recommendations = generateCompetitorRecommendations(competitorImpacts, totalCompetitivePressure);
      
      analysis[store.id] = {
        storeId: store.id,
        storeName: store.name,
        competitorImpacts: competitorImpacts,
        metrics: {
          totalCompetitivePressure: totalCompetitivePressure,
          nearbyCompetitorCount: nearbyCompetitors.length,
          highThreatCount: highThreatCompetitors.length,
          averageCompetitorDistance: competitorImpacts.length > 0 
            ? competitorImpacts.reduce((sum, comp) => sum + comp.distance, 0) / competitorImpacts.length 
            : 0,
          vulnerability: vulnerability,
          competitiveAdvantage: competitiveAdvantage,
          marketPosition: competitiveAdvantage > 0.7 ? 'Dominant' :
                         competitiveAdvantage > 0.5 ? 'Strong' :
                         competitiveAdvantage > 0.3 ? 'Competitive' : 'Challenged'
        },
        recommendations: recommendations
      };
    });
    
    return analysis;
  };

  const generateCompetitorRecommendations = (competitorImpacts, totalPressure) => {
    const recommendations = [];
    
    if (totalPressure > 1.5) {
      recommendations.push({
        type: 'High Competition',
        priority: 'High',
        action: 'Consider increasing marketing spend and differentiation strategies',
        icon: '⚠️'
      });
    }
    
    const nearbyHighThreats = competitorImpacts.filter(comp => 
      comp.distance <= 1.0 && comp.threatLevel === 'High'
    );
    
    if (nearbyHighThreats.length > 0) {
      recommendations.push({
        type: 'Direct Competition',
        priority: 'High',
        action: `Monitor ${nearbyHighThreats[0].competitorName} closely - within 1km with high impact`,
        icon: '🎯'
      });
    }
    
    if (competitorImpacts.length > 5) {
      recommendations.push({
        type: 'Oversaturated Market',
        priority: 'Medium',
        action: 'Focus on niche positioning and customer loyalty programs',
        icon: '📊'
      });
    }
    
    const distantCompetitors = competitorImpacts.filter(comp => comp.distance > 5.0);
    if (distantCompetitors.length / competitorImpacts.length > 0.7) {
      recommendations.push({
        type: 'Market Opportunity',
        priority: 'Low',
        action: 'Good location with minimal direct competition',
        icon: '✅'
      });
    }
    
    return recommendations;
  };

  // Enhanced Market Share Analysis with Competitor Impact
  const calculateCompetitiveMarketShare = (allLocations, targetStoreId, distanceDecay = 2.0) => {
    const targetStore = allLocations.find(loc => loc.id === targetStoreId);
    if (!targetStore) return null;
    
    // Generate comprehensive demand grid
    const bounds = turf.bbox(turf.featureCollection(
      allLocations.map(loc => turf.point([loc.coordinates.coordinates[0], loc.coordinates.coordinates[1]]))
    ));
    
    const padding = 0.02;
    bounds[0] -= padding;
    bounds[1] -= padding;
    bounds[2] += padding;
    bounds[3] += padding;
    
    const demandPoints = [];
    const gridSize = 0.003; // High resolution for accurate analysis
    
    for (let lat = bounds[1]; lat <= bounds[3]; lat += gridSize) {
      for (let lng = bounds[0]; lng <= bounds[2]; lng += gridSize) {
        const point = turf.point([lng, lat]);
        
        // Realistic population with urban clustering
        const centerPoint = turf.point([targetStore.coordinates.coordinates[0], targetStore.coordinates.coordinates[1]]);
        const distanceFromTarget = turf.distance(point, centerPoint, { units: 'kilometers' });
        
        // Higher density near target store, with random variation
        const baseDensity = Math.max(20, 400 - (distanceFromTarget * 60));
        const population = baseDensity + (Math.random() * 200 - 100);
        
        demandPoints.push({
          point,
          population: Math.max(5, population),
          coordinates: [lng, lat]
        });
      }
    }
    
    // Calculate detailed market share for each demand point
    let targetMarketShare = 0;
    let totalMarketSize = 0;
    const detailedCapture = [];
    
    demandPoints.forEach(demand => {
      let totalAttraction = 0;
      const storeAttractions = allLocations.map(store => {
        const storePoint = turf.point([store.coordinates.coordinates[0], store.coordinates.coordinates[1]]);
        const distance = turf.distance(demand.point, storePoint, { units: 'kilometers' });
        
        if (distance === 0) return { storeId: store.id, attraction: 0, distance: 0 };
        
        const attractiveness = store.attractiveness || 
                              (store.location_type === 'store' ? 1.2 : 
                               store.location_type === 'competitor' ? 1.0 : 0.5);
        const attraction = attractiveness / Math.pow(Math.max(0.1, distance), distanceDecay);
        totalAttraction += attraction;
        
        return {
          storeId: store.id,
          storeName: store.name,
          storeType: store.location_type,
          attraction,
          distance,
          attractiveness
        };
      });
      
      if (totalAttraction > 0) {
        const targetAttraction = storeAttractions.find(s => s.storeId === targetStoreId);
        if (targetAttraction) {
          const captureProb = targetAttraction.attraction / totalAttraction;
          const capturedDemand = demand.population * captureProb;
          
          targetMarketShare += capturedDemand;
          totalMarketSize += demand.population;
          
          // Track competitive dynamics
          const competitorAttractions = storeAttractions
            .filter(s => s.storeType === 'competitor')
            .sort((a, b) => b.attraction - a.attraction);
          
          detailedCapture.push({
            coordinates: demand.coordinates,
            population: demand.population,
            captureProb: captureProb,
            capturedDemand: capturedDemand,
            nearestCompetitor: competitorAttractions[0] || null,
            competitorPressure: competitorAttractions.reduce((sum, comp) => sum + comp.attraction, 0) / totalAttraction
          });
        }
      }
    });
    
    const marketSharePercentage = totalMarketSize > 0 ? (targetMarketShare / totalMarketSize * 100) : 0;
    
    return {
      targetStoreId,
      targetStoreName: targetStore.name,
      marketSharePercentage,
      capturedDemand: targetMarketShare,
      totalMarketSize,
      detailedCapture,
      competitiveMetrics: {
        averageCompetitorPressure: detailedCapture.length > 0 
          ? detailedCapture.reduce((sum, point) => sum + point.competitorPressure, 0) / detailedCapture.length 
          : 0,
        highCaptureAreas: detailedCapture.filter(point => point.captureProb > 0.5).length,
        contestedAreas: detailedCapture.filter(point => point.competitorPressure > 0.6).length
      }
    };
  };

  // Professional Analytics Dashboard
  const generateDashboard = () => {
    if (locations.length === 0) {
      setMessage('No locations available for dashboard analysis');
      return;
    }

    const stores = locations.filter(loc => loc.location_type === 'store');
    const competitors = locations.filter(loc => loc.location_type === 'competitor');
    const pois = locations.filter(loc => loc.location_type === 'poi');

    // Overall market analysis
    const marketAnalysis = stores.length > 0 ? calculateMarketCapture(locations) : null;
    
    // Competitor analysis
    const competitorAnalysisData = stores.length > 0 && competitors.length > 0 
      ? analyzeCompetitorImpact(stores, competitors) 
      : null;

    // Store performance metrics
    const storeMetrics = stores.map(store => {
      const marketShare = calculateCompetitiveMarketShare(locations, store.id);
      const tradeAreaCount = tradeAreas.filter(ta => ta.locationId === store.id).length;
      
      return {
        id: store.id,
        name: store.name,
        coordinates: store.coordinates.coordinates,
        marketShare: marketShare?.marketSharePercentage || 0,
        capturedDemand: marketShare?.capturedDemand || 0,
        tradeAreaCount,
        competitorPressure: competitorAnalysisData?.[store.id]?.metrics.totalCompetitivePressure || 0,
        marketPosition: competitorAnalysisData?.[store.id]?.metrics.marketPosition || 'Unknown',
        vulnerability: competitorAnalysisData?.[store.id]?.metrics.vulnerability || 0
      };
    });

    // Portfolio summary
    const portfolioMetrics = {
      totalStores: stores.length,
      totalCompetitors: competitors.length,
      totalPOIs: pois.length,
      totalMarketShare: storeMetrics.reduce((sum, store) => sum + store.marketShare, 0),
      avgMarketShare: storeMetrics.length > 0 ? storeMetrics.reduce((sum, store) => sum + store.marketShare, 0) / storeMetrics.length : 0,
      totalCapturedDemand: storeMetrics.reduce((sum, store) => sum + store.capturedDemand, 0),
      avgCompetitorPressure: storeMetrics.length > 0 ? storeMetrics.reduce((sum, store) => sum + store.competitorPressure, 0) / storeMetrics.length : 0,
      strongPositions: storeMetrics.filter(s => s.marketPosition === 'Dominant' || s.marketPosition === 'Strong').length,
      challengedPositions: storeMetrics.filter(s => s.marketPosition === 'Challenged').length,
      totalTradeAreas: tradeAreas.length
    };

    // Geographic analysis
    const bounds = locations.length > 0 ? turf.bbox(turf.featureCollection(
      locations.map(loc => turf.point([loc.coordinates.coordinates[0], loc.coordinates.coordinates[1]]))
    )) : null;

    const geographicMetrics = bounds ? {
      coverage: {
        minLat: bounds[1].toFixed(4),
        maxLat: bounds[3].toFixed(4),
        minLng: bounds[0].toFixed(4),
        maxLng: bounds[2].toFixed(4),
        latRange: (bounds[3] - bounds[1]).toFixed(4),
        lngRange: (bounds[2] - bounds[0]).toFixed(4)
      },
      centerPoint: [
        ((bounds[0] + bounds[2]) / 2).toFixed(4),
        ((bounds[1] + bounds[3]) / 2).toFixed(4)
      ]
    } : null;

    const dashboard = {
      generatedAt: new Date().toISOString(),
      portfolioMetrics,
      storeMetrics,
      geographicMetrics,
      marketAnalysis,
      competitorAnalysisData,
      recommendations: generatePortfolioRecommendations(portfolioMetrics, storeMetrics)
    };

    setDashboardData(dashboard);
    setMessage(`✅ Dashboard generated! Analyzed ${stores.length} stores with ${portfolioMetrics.avgMarketShare.toFixed(1)}% average market share`);
  };

  const generatePortfolioRecommendations = (portfolio, stores) => {
    const recommendations = [];

    if (portfolio.avgCompetitorPressure > 1.5) {
      recommendations.push({
        type: 'Portfolio Risk',
        priority: 'High',
        icon: '⚠️',
        action: 'High competitive pressure across portfolio - consider defensive strategies'
      });
    }

    if (portfolio.challengedPositions / portfolio.totalStores > 0.3) {
      recommendations.push({
        type: 'Market Position',
        priority: 'High', 
        icon: '📉',
        action: 'Over 30% of stores in challenged positions - review underperforming locations'
      });
    }

    if (portfolio.avgMarketShare < 20) {
      recommendations.push({
        type: 'Market Share',
        priority: 'Medium',
        icon: '📊',
        action: 'Low average market share - explore market expansion opportunities'
      });
    }

    const topPerformer = stores.reduce((max, store) => store.marketShare > max.marketShare ? store : max, stores[0] || {});
    if (topPerformer.marketShare > 30) {
      recommendations.push({
        type: 'Success Replication',
        priority: 'Low',
        icon: '✅',
        action: `${topPerformer.name} shows strong performance (${topPerformer.marketShare.toFixed(1)}%) - analyze for replication`
      });
    }

    return recommendations;
  };

  // Optimization Engine Handlers
  const handleOptimizationComplete = (results) => {
    setOptimizationResults(results);
    setMessage(`Optimization completed: ${results.algorithm} algorithm selected ${results.totalStores || results.selectedStores?.length || 0} optimal locations`);
  };

  const handleShowCandidates = (candidates) => {
    setCandidateMarkers(candidates);
    setMessage(`Showing ${candidates.length} candidate/optimized locations on map`);
  };

  // Handle demand analysis data without causing re-renders
  const handleDemandAnalysis = useCallback((analysis) => {
    // Store in ref to avoid re-renders
    demandMeshesRef.current = analysis.meshes || [];
    setDemandDataReady(analysis.meshes && analysis.meshes.length > 0);
    console.log('Demand analysis updated:', analysis);
  }, []);

  // Get current map bounds for optimization
  const getCurrentMapBounds = () => {
    if (locations.length === 0) {
      // Return default bounds for Tokyo area when no locations exist
      return {
        north: 35.8,
        south: 35.5,
        east: 140.1,
        west: 139.3
      };
    }
    
    // Calculate bounds from existing locations
    const lats = locations.map(loc => loc.coordinates?.coordinates?.[1] || loc.latitude || 0);
    const lngs = locations.map(loc => loc.coordinates?.coordinates?.[0] || loc.longitude || 0);
    
    if (lats.length === 0 || lngs.length === 0) {
      // Fallback to default bounds if coordinate extraction fails
      return {
        north: 35.8,
        south: 35.5,
        east: 140.1,
        west: 139.3
      };
    }
    
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    
    // Add much larger padding for better grid coverage
    // Use 100% padding (double the area) or minimum 0.05 degrees
    const latPadding = Math.max((maxLat - minLat) * 1.0, 0.05);
    const lngPadding = Math.max((maxLng - minLng) * 1.0, 0.05);
    
    return {
      north: maxLat + latPadding,
      south: minLat - latPadding,
      east: maxLng + lngPadding,
      west: minLng - lngPadding
    };
  };

  // Get full viewport bounds (hardcoded for now, ideally from map instance)
  const getFullMapBounds = () => {
    // This covers a much larger Tokyo metropolitan area
    return {
      north: 35.9,
      south: 35.4,
      east: 140.2,
      west: 139.2
    };
  };

  // Memoize grid bounds to prevent infinite re-renders
  const gridBounds = useMemo(() => {
    if (useFullMapBounds) {
      return getFullMapBounds();
    }
    return getCurrentMapBounds();
  }, [locations, useFullMapBounds]);

  // CSV Bulk Upload with Automatic Geocoding
  const handleCSVImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        setMessage('❌ CSV file must have at least a header row and one data row');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      // Check for required columns - allow either coordinates OR address
      const hasCoordinates = headers.some(h => h.includes('latitude') || h.includes('lat')) && 
                             headers.some(h => h.includes('longitude') || h.includes('lng') || h.includes('lon'));
      const hasAddress = headers.some(h => h.includes('address') || h.includes('住所'));
      const hasName = headers.some(h => h.includes('name') || h.includes('名前') || h.includes('店舗名'));
      const hasType = headers.some(h => h.includes('type') || h.includes('タイプ') || h.includes('種類'));
      
      // Special handling for CSV files without proper headers
      // If first row doesn't look like headers, treat it as data
      const firstDataRow = lines[1]?.split(',').map(v => v.trim());
      const looksLikeHeaders = headers.some(h => 
        h.includes('name') || h.includes('latitude') || h.includes('address') ||
        h.includes('名前') || h.includes('住所') || h.includes('緯度')
      );
      
      // If no proper headers detected and we have 3+ columns, assume: name, address, type
      if (!looksLikeHeaders && headers.length >= 3 && firstDataRow) {
        console.log('CSV appears to have no headers, assuming format: name, address, type');
        setMessage('📋 Detected CSV without headers, assuming format: name, address, type');
        // Override header detection
        const assumedHeaders = ['name', 'address', 'type'];
        for (let i = 0; i < Math.min(assumedHeaders.length, headers.length); i++) {
          headers[i] = assumedHeaders[i];
        }
      }

      // Re-check after potential header override
      const finalHasCoordinates = headers.some(h => h.includes('latitude') || h.includes('lat')) && 
                                  headers.some(h => h.includes('longitude') || h.includes('lng') || h.includes('lon'));
      const finalHasAddress = headers.some(h => h.includes('address') || h.includes('住所'));
      const finalHasName = headers.some(h => h.includes('name') || h.includes('名前') || h.includes('店舗名'));
      const finalHasType = headers.some(h => h.includes('type') || h.includes('タイプ') || h.includes('種類'));

      if (!finalHasName || !finalHasType) {
        setMessage('❌ CSV must have "name" and "type" columns (or 名前/種類 in Japanese)');
        return;
      }

      if (!finalHasCoordinates && !finalHasAddress) {
        setMessage('❌ CSV must have either coordinates (latitude/longitude) OR address column for automatic geocoding');
        return;
      }

      // Find column indices (support both English and Japanese)
      const nameIndex = headers.findIndex(h => h.includes('name') || h.includes('名前') || h.includes('店舗名'));
      const latIndex = headers.findIndex(h => h.includes('latitude') || h.includes('lat') || h.includes('緯度'));
      const lngIndex = headers.findIndex(h => h.includes('longitude') || h.includes('lng') || h.includes('lon') || h.includes('経度'));
      const typeIndex = headers.findIndex(h => h.includes('type') || h.includes('タイプ') || h.includes('種類'));
      const addressIndex = headers.findIndex(h => h.includes('address') || h.includes('住所'));

      let successCount = 0;
      let errorCount = 0;
      let geocodedCount = 0;

      setMessage('🔄 Processing CSV with automatic geocoding...');

      // Start from line 0 if no headers detected, line 1 if headers detected
      const startLine = looksLikeHeaders ? 1 : 0;
      
      for (let i = startLine; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        
        if (values.length < 2) continue;

        const name = values[nameIndex];
        const locationType = values[typeIndex]?.toLowerCase();
        const address = addressIndex >= 0 ? values[addressIndex] : '';

        // Validate basic data
        if (!name) {
          errorCount++;
          continue;
        }

        // Map common Japanese/English terms to valid types
        let validType = locationType;
        if (locationType === 'eneos' || locationType === 'ガソリンスタンド' || locationType === 'gas station') {
          validType = 'poi';
        } else if (locationType === '店舗' || locationType === 'shop') {
          validType = 'store';
        } else if (locationType === '競合' || locationType === '競合店') {
          validType = 'competitor';
        }
        
        if (!['store', 'competitor', 'poi'].includes(validType)) {
          console.warn(`Invalid location type: ${locationType}, expected: store/competitor/poi`);
          errorCount++;
          continue;
        }

        let latitude, longitude;

        // Try to get coordinates
        if (latIndex >= 0 && lngIndex >= 0) {
          latitude = parseFloat(values[latIndex]);
          longitude = parseFloat(values[lngIndex]);
        }

        // If no valid coordinates but we have address, try geocoding
        if ((isNaN(latitude) || isNaN(longitude)) && address) {
          try {
            setMessage(`🔍 Geocoding "${name}" at "${address}"... (${i}/${lines.length - 1})`);
            const coords = await geocodeAddress(address);
            if (coords) {
              latitude = coords.latitude;
              longitude = coords.longitude;
              geocodedCount++;
              setMessage(`✅ Geocoded "${name}": ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
              // Small delay to avoid rate limiting
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          } catch (geocodeError) {
            console.warn(`Geocoding failed for ${name}: ${geocodeError.message}`);
          }
        }

        // Final validation
        if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
          errorCount++;
          continue;
        }

        try {
          const { error } = await db.createLocation({
            project_id: selectedProject.id,
            name: name,
            address: address,
            latitude: latitude,
            longitude: longitude,
            location_type: validType
          });
          
          if (error) {
            throw new Error(error.message);
          }
          
          successCount++;
        } catch (error) {
          errorCount++;
        }
      }

      setMessage(`✅ CSV bulk upload complete! ${successCount} locations added, ${geocodedCount} addresses geocoded, ${errorCount} errors`);
      loadLocations(selectedProject.id);
      
    } catch (error) {
      setMessage(`❌ Error reading CSV file: ${error.message}`);
    }

    // Reset file input
    event.target.value = '';
  };

  // Enhanced Trade Area Creation with Huff Model
  const createTradeArea = (locationId, radiusKm, name, analysisType = 'radius') => {
    const location = locations.find(loc => loc.id === locationId);
    if (!location) return;

    let tradeArea;
    
    if (analysisType === 'huff' && locations.length > 1) {
      // Enhanced Huff Model Analysis
      const huffData = calculateHuffModel(locations, location);
      const totalCapturedDemand = huffData.reduce((sum, point) => sum + point.capturedDemand, 0);
      const totalPopulation = huffData.reduce((sum, p) => sum + p.population, 0);
      
      // Advanced trade area definition with multiple probability thresholds
      const highCapturePoints = huffData
        .filter(point => point.captureProb > 0.2) // 20% or higher capture probability
        .map(point => point.coordinates);
      
      // Competitive analysis metrics
      const competitorLocations = locations.filter(loc => loc.location_type === 'competitor');
      const avgCompetitorDistance = competitorLocations.length > 0 
        ? competitorLocations.reduce((sum, comp) => {
            const compPoint = turf.point([comp.coordinates.coordinates[0], comp.coordinates.coordinates[1]]);
            const targetPoint = turf.point([location.coordinates.coordinates[0], location.coordinates.coordinates[1]]);
            return sum + turf.distance(targetPoint, compPoint, { units: 'kilometers' });
          }, 0) / competitorLocations.length 
        : null;
      
      // Market dominance zones
      const dominanceZones = {
        high: huffData.filter(p => p.captureProb > 0.5).length, // >50% capture
        medium: huffData.filter(p => p.captureProb >= 0.3 && p.captureProb <= 0.5).length, // 30-50%
        low: huffData.filter(p => p.captureProb >= 0.1 && p.captureProb < 0.3).length, // 10-30%
        minimal: huffData.filter(p => p.captureProb > 0 && p.captureProb < 0.1).length // <10%
      };
      
      if (highCapturePoints.length > 3) {
        const hull = turf.convex(turf.featureCollection(
          highCapturePoints.map(coord => turf.point(coord))
        ));
        
        tradeArea = {
          id: Date.now().toString(),
          locationId,
          locationName: location.name,
          name: name || `${location.name} - Huff Analysis`,
          analysisType: 'huff',
          geometry: hull,
          center: location.coordinates.coordinates,
          totalDemand: totalCapturedDemand,
          totalPopulation,
          captureData: huffData.filter(p => p.captureProb > 0.05), // Include 5%+ capture areas
          marketShare: (totalCapturedDemand / totalPopulation * 100).toFixed(1),
          competitorAnalysis: {
            nearbyCompetitors: competitorLocations.length,
            averageDistance: avgCompetitorDistance?.toFixed(2),
            dominanceZones
          },
          analytics: {
            averageCaptureProb: (huffData.reduce((sum, p) => sum + p.captureProb, 0) / huffData.length * 100).toFixed(1),
            maxCaptureProb: (Math.max(...huffData.map(p => p.captureProb)) * 100).toFixed(1),
            effectiveRange: Math.max(...huffData.filter(p => p.captureProb > 0.1).map(p => 
              turf.distance(p.point, turf.point([location.coordinates.coordinates[0], location.coordinates.coordinates[1]]), { units: 'kilometers' })
            )).toFixed(2)
          }
        };
      } else {
        // Fallback to radius if not enough points
        const center = turf.point([location.coordinates.coordinates[0], location.coordinates.coordinates[1]]);
        const circle = turf.circle(center, radiusKm || 2, { units: 'kilometers' });
        
        tradeArea = {
          id: Date.now().toString(),
          locationId,
          locationName: location.name,
          name: name || `${location.name} - ${radiusKm || 2}km`,
          analysisType: 'radius',
          radiusKm: radiusKm || 2,
          geometry: circle,
          center: location.coordinates.coordinates
        };
      }
    } else {
      // Simple Radius Analysis
      const center = turf.point([location.coordinates.coordinates[0], location.coordinates.coordinates[1]]);
      const circle = turf.circle(center, radiusKm, { units: 'kilometers' });
      
      tradeArea = {
        id: Date.now().toString(),
        locationId,
        locationName: location.name,
        name: name || `${location.name} - ${radiusKm}km`,
        analysisType: 'radius',
        radiusKm,
        geometry: circle,
        center: location.coordinates.coordinates
      };
    }

    setTradeAreas(prev => [...prev, tradeArea]);
    updateMapTradeAreas([...tradeAreas, tradeArea]);
    setMessage(`Trade area "${tradeArea.name}" created successfully! ${tradeArea.analysisType === 'huff' ? `Market Share: ${tradeArea.marketShare}%` : ''}`);
  };

  const deleteTradeArea = (tradeAreaId) => {
    const newTradeAreas = tradeAreas.filter(ta => ta.id !== tradeAreaId);
    setTradeAreas(newTradeAreas);
    updateMapTradeAreas(newTradeAreas);
    setMessage('Trade area deleted');
  };

  const updateMapTradeAreas = (areas) => {
    if (!map) return;

    // Remove existing trade area layers
    map.eachLayer((layer) => {
      if (layer.options && layer.options.tradeArea) {
        map.removeLayer(layer);
      }
    });

    // Add trade area polygons
    areas.forEach((tradeArea, index) => {
      const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'];
      const color = colors[index % colors.length];
      
      L.geoJSON(tradeArea.geometry, {
        style: {
          color: color,
          weight: 2,
          fillColor: color,
          fillOpacity: 0.2,
          tradeArea: true // Custom property to identify trade area layers
        }
      }).addTo(map).bindPopup(`
        <strong>${tradeArea.name}</strong><br/>
        Center: ${tradeArea.locationName}<br/>
        ${tradeArea.analysisType === 'huff' ? `
          🎯 Analysis: Huff Model<br/>
          📊 Market Share: ${tradeArea.marketShare}%<br/>
          👥 Captured Demand: ${Math.round(tradeArea.totalDemand).toLocaleString()}<br/>
          📈 Capture Points: ${tradeArea.captureData?.length || 0}<br/>
          ${tradeArea.competitorAnalysis ? `
            🏢 Competitors: ${tradeArea.competitorAnalysis.nearbyCompetitors}<br/>
            📏 Avg Distance: ${tradeArea.competitorAnalysis.averageDistance}km<br/>
            🎯 High Dominance: ${tradeArea.competitorAnalysis.dominanceZones.high} zones
          ` : ''}
          ${tradeArea.analytics ? `
            <small>Effective Range: ${tradeArea.analytics.effectiveRange}km</small>
          ` : ''}
        ` : `
          📏 Radius: ${tradeArea.radiusKm}km<br/>
          <small>Area: ${(Math.PI * tradeArea.radiusKm * tradeArea.radiusKm).toFixed(2)} km²</small>
        `}
      `);
    });
  };

  // Map functions


  const updateMapOptimizedLocations = (optimizedStores) => {
    if (!map) return;

    // Remove existing optimized markers
    map.eachLayer((layer) => {
      if (layer.options && layer.options.optimizedLocation) {
        map.removeLayer(layer);
      }
    });

    // Add optimized location markers
    optimizedStores.forEach((store, index) => {
      const marker = L.marker([store.coordinates.coordinates[1], store.coordinates.coordinates[0]], {
        optimizedLocation: true // Custom property to identify optimized markers
      }).addTo(map).bindPopup(`
        <strong>⭐ ${store.name}</strong><br/>
        🎯 Optimized Location #${index + 1}<br/>
        📊 Optimization Score: ${store.score.toFixed(2)}<br/>
        👥 Additional Demand: ${Math.round(store.marketImpact.additionalDemand).toLocaleString()}<br/>
        📈 Market Share After: ${store.marketImpact.marketShareAfter.toFixed(1)}%
      `);

      // Change marker icon to indicate it's optimized
      marker.setIcon(L.divIcon({
        html: '⭐',
        className: 'custom-div-icon',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      }));
    });
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setProjects([]);
    setSelectedProject(null);
    setLocations([]);
    localStorage.removeItem('token');
    changeView('login');
    setMessage('Logged out successfully');
  };

  // Using Apple-style design system from theme.js and layouts.js

  // Check for existing session on app load
  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log('🔍 Checking existing session...');
        const result = await auth.getSession();
        
        // Handle case where result might be undefined
        if (!result) {
          console.log('❌ No session result returned');
          setIsInitialLoad(false);
          return;
        }

        const { data, error } = result;
        
        if (error) {
          console.error('❌ Session check error:', error);
          setIsInitialLoad(false);
          return;
        }

        // Handle case where data might be undefined
        if (!data) {
          console.log('❌ No session data returned');
          // If we have a user and token from localStorage, but no session data,
          // the user is still authenticated but Supabase session expired
          if (user && token) {
            console.log('🔄 Have user/token but no session - staying authenticated');
            if (currentView !== 'dashboard' && currentView !== 'analysis' && currentView !== 'map') {
              changeView('dashboard');
            }
          }
          setIsInitialLoad(false);
          return;
        }

        const { session } = data;

        if (session?.user) {
          console.log('✅ Valid session found for:', session.user.email);
          setUser(session.user);
          setToken(session.access_token);
          
          // If user is authenticated but currentView is login, redirect to dashboard
          if (currentView === 'login') {
            console.log('🔄 Redirecting authenticated user to dashboard');
            changeView('dashboard');
          }
          
          setIsInitialLoad(false);
          await loadProjects();
        } else {
          console.log('❌ No valid session found');
          // Check if we have stored authentication
          if (user && token) {
            console.log('🔄 Using stored authentication');
            if (currentView === 'login') {
              changeView('dashboard');
            }
          } else {
            // If no session and no stored auth, ensure we're on login page
            if (currentView !== 'login') {
              console.log('🔄 Redirecting unauthenticated user to login');
              changeView('login');
            }
          }
          setIsInitialLoad(false);
        }
      } catch (error) {
        console.error('❌ Session check failed:', error);
        setIsInitialLoad(false);
      }
    };

    checkSession();
  }, []); // Run only once on mount

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = auth.onAuthStateChange(
      (event, session) => {
        if (import.meta.env.MODE === 'development') {
          console.log('🔐 Auth:', event, session?.user?.email || 'No user');
        }
        
        if (event === 'SIGNED_IN' && session) {
          setUser(session.user);
          setToken(session.access_token);
          // Only redirect to dashboard if user is currently on login page
          // This preserves current page when session is restored
          if (currentView === 'login') {
            changeView('dashboard');
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setToken(null);
          localStorage.removeItem('token');
          localStorage.removeItem('currentView');
          changeView('login');
        }
      }
    );

    return () => {
      subscription?.unsubscribe?.();
    };
  }, []);

  // Load projects when user is set and we're on dashboard
  useEffect(() => {
    if (user && currentView === 'dashboard') {
      loadProjects();
    }
  }, [user, currentView]);



  // Debug rendering conditions
  console.log('🖼️ Render state:', {
    currentView,
    hasUser: !!user,
    userEmail: user?.email,
    isInitialLoad,
    token: !!token
  });

  return (
    <div style={containerStyle}>
      {/* App Header */}
      <header style={headerStyle}>
        <h1 style={titleStyle}>Trade Area Analysis Platform</h1>
        <p style={subtitleStyle}>Professional retail analytics with AI-powered insights</p>
      </header>
      
      {/* Debug Info (Development only) */}
      {import.meta.env.MODE === 'development' && (
        <div style={{
          background: '#f0f0f0',
          padding: '8px',
          margin: '8px 0',
          fontSize: '12px',
          fontFamily: 'monospace'
        }}>
          View: {currentView} | User: {user?.email || 'None'} | Initial: {isInitialLoad ? 'Yes' : 'No'}
        </div>
      )}
      
      {/* Message Display */}
      {message && (
        <div style={message.includes('Error') ? errorMessageStyle : successMessageStyle}>
          <span>{message}</span>
          <button 
            onClick={() => setMessage('')} 
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer',
              fontSize: theme.typography.fontSize.lg,
              color: 'inherit',
              padding: theme.spacing[1]
            }}
            aria-label="Dismiss message"
          >
            ×
          </button>
        </div>
      )}

      {/* Navigation Bar (when authenticated) */}
      {user && (
        <nav style={{
          background: theme.colors.white,
          borderBottom: `1px solid ${theme.colors.gray[200]}`,
          padding: theme.spacing[3],
          marginBottom: theme.spacing[4]
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            maxWidth: '1200px',
            margin: '0 auto'
          }}>
            <div style={{ display: 'flex', gap: theme.spacing[3] }}>
              <Button 
                variant={currentView === 'dashboard' ? 'primary' : 'secondary'}
                onClick={() => changeView('dashboard')}
                size="small"
              >
                Dashboard
              </Button>
              <Button 
                variant={currentView === 'analysis' ? 'primary' : 'secondary'}
                onClick={() => changeView('analysis')}
                size="small"
              >
                Analysis
              </Button>
              <Button 
                variant={currentView === 'map' ? 'primary' : 'secondary'}
                onClick={() => changeView('map')}
                size="small"
              >
                Map
              </Button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[3] }}>
              <span style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.gray[600] }}>
                {user.email}
              </span>
              <Button variant="secondary" onClick={logout} size="small">
                Logout
              </Button>
            </div>
          </div>
        </nav>
      )}

      {currentView === 'login' && (
        <ModernLoginForm
          onLogin={handleModernLogin}
          onSwitchToRegister={() => setAuthView('register')}
          loading={false}
          error={message?.includes('Login error') ? message.replace('Login error: ', '') : undefined}
        />
      )}

      {currentView === 'dashboard' && user && (
        <div style={sectionStyle}>
          {/* Dashboard Header */}
          <div style={flexBetweenStyle}>
            <h2 style={heading2Style}>Welcome, {user.first_name || user.email}!</h2>
            <Button variant="secondary" onClick={logout}>
              Logout
            </Button>
          </div>

          {/* Create Project Form */}
          <div style={formStyle}>
            <h3 style={formHeaderStyle}>Create New Project</h3>
            <form onSubmit={createProject} style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[4] }}>
              <Input 
                type="text" 
                name="name" 
                placeholder="Project Name" 
                label="Project Name"
                required 
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
                  Project Description (optional)
                </label>
                <textarea 
                  name="description" 
                  placeholder="Describe your trade area analysis project..."
                  rows={3}
                  style={{
                    ...theme.components.input.base,
                    resize: 'vertical',
                    minHeight: '80px'
                  }}
                />
              </div>
              <Button type="submit" variant="primary">
                Create Project
              </Button>
            </form>
          </div>

          {/* Projects List */}
          <div style={sectionStyle}>
            <h3 style={heading3Style}>Your Projects ({projects.length})</h3>
            {projects.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: theme.spacing[8],
                color: theme.colors.gray[600]
              }}>
                <p style={bodyTextStyle}>No projects yet. Create your first project above!</p>
              </div>
            ) : (
              <div style={{ 
                display: 'grid',
                gap: theme.spacing[4],
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))'
              }}>
                {projects.map(project => (
                  <div 
                    key={project.id} 
                    style={projectCardStyle}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = theme.shadows.md;
                      e.currentTarget.style.borderColor = theme.colors.gray[400];
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = theme.shadows.sm;
                      e.currentTarget.style.borderColor = theme.colors.gray[300];
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <h4 style={{
                      ...heading3Style,
                      marginBottom: theme.spacing[2],
                      fontSize: theme.typography.fontSize.lg
                    }}>
                      {project.name}
                    </h4>
                    {project.description && (
                      <p style={{
                        ...bodyTextStyle,
                        marginBottom: theme.spacing[3],
                        fontSize: theme.typography.fontSize.sm
                      }}>
                        {project.description}
                      </p>
                    )}
                    <div style={{
                      ...captionTextStyle,
                      marginBottom: theme.spacing[4]
                    }}>
                      Created: {new Date(project.created_at).toLocaleDateString()}
                    </div>
                    <Button 
                      onClick={() => {
                        // Clear candidate sites and optimization results from previous project
                        setCandidateMarkers([]);
                        setOptimizationResults(null);
                        
                        // Switch to new project
                        setSelectedProject(project);
                        changeView('map');
                        loadLocations(project.id);
                      }}
                      variant="primary"
                      style={{ width: '100%' }}
                    >
                      🗾 Open Map & Locations
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {currentView === 'map' && selectedProject && (
        <div>
          {/* Quick Guide with AI Analysis */}
          <div style={formStyle}>
            <h3 style={heading3Style}>Quick Guide</h3>
            
            <div style={{
              backgroundColor: theme.colors.gray[50],
              border: `1px solid ${theme.colors.gray[200]}`,
              borderRadius: theme.borderRadius.md,
              padding: theme.spacing[4],
              marginBottom: theme.spacing[4]
            }}>
              <ul style={{ margin: 0, paddingLeft: theme.spacing[6], ...bodyTextStyle, lineHeight: '1.6' }}>
                <li style={{ marginBottom: theme.spacing[2] }}>
                  <strong>Step 1:</strong> Add your store locations using the "Add Location" form below
                </li>
                <li style={{ marginBottom: theme.spacing[2] }}>
                  <strong>Step 2:</strong> Click "Population Grid" to see demand patterns
                </li>
                <li style={{ marginBottom: theme.spacing[2] }}>
                  <strong>Step 3:</strong> Use "Store Optimizer" to find optimal locations
                </li>
                <li style={{ marginBottom: theme.spacing[2] }}>
                  <strong>Step 4:</strong> Try "AI Analyst" for detailed insights
                </li>
              </ul>
            </div>

            {/* AI Analysis Input */}
            <div style={{ marginBottom: theme.spacing[4] }}>
              <Input
                type="text"
                placeholder="Describe your analysis goals (e.g., 'Find best locations for coffee shops in Tokyo')"
                value={currentAddress}
                onChange={(e) => setCurrentAddress(e.target.value)}
                label="Get AI Analysis"
              />
              <div style={{ marginTop: theme.spacing[2], display: 'flex', gap: theme.spacing[2] }}>
                <Button 
                  onClick={handleAIAnalysis}
                  variant="primary"
                  size="small"
                >
                  <Icon icon={MagnifyingGlassIcon} size={16} className="mr-1" /> Analyze & Guide Me
                </Button>
                <Button 
                  onClick={() => setCurrentAddress('')}
                  variant="secondary"
                  size="small"
                >
                  Clear
                </Button>
              </div>
            </div>

            {/* AI Analysis Results */}
            {analysisRecommendations && (
              <div style={{
                backgroundColor: theme.colors.primary[50],
                border: `1px solid ${theme.colors.primary[100]}`,
                borderRadius: theme.borderRadius.lg,
                padding: theme.spacing[4],
                marginBottom: theme.spacing[4]
              }}>
                <h4 style={{ ...heading3Style, color: theme.colors.primary[700], marginBottom: theme.spacing[3] }}>
                  📋 AI Analysis Results
                </h4>
                <div dangerouslySetInnerHTML={{ __html: analysisRecommendations }} />
              </div>
            )}

          </div>

          <div style={responsiveFlexStyle}>
            <h2 style={heading2Style}><Icon icon={MapPinIcon} size={20} className="mr-2" /> {selectedProject.name} - Locations & Map</h2>
            <div style={preventOverflowStyle}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                marginRight: '10px'
              }}>
                <select
                  value={useMapbox ? 'mapbox' : 'leaflet'}
                  onChange={(e) => setUseMapbox(e.target.value === 'mapbox')}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    fontSize: '14px',
                    backgroundColor: 'white',
                    color: '#333',
                    cursor: 'pointer',
                    minWidth: '200px'
                  }}
                >
                  <option value="mapbox">🛰️ Professional (Satellite & AI)</option>
                  <option value="leaflet">🗾 Japan Local (国土地理院)</option>
                </select>
                
                <div style={{
                  fontSize: '12px',
                  color: '#666',
                  maxWidth: '250px',
                  lineHeight: '1.3'
                }}>
                  {useMapbox ? (
                    <span>
                      <strong>Satellite imagery</strong> with AI analysis for global coverage
                    </span>
                  ) : (
                    <span>
                      <strong>Japanese government data</strong> optimized for local analysis
                    </span>
                  )}
                </div>
              </div>
              
              {/* Navigation Buttons */}
              <div style={buttonContainerStyle}>
                <Button 
                  onClick={() => setShowAIChat(!showAIChat)} 
                  variant={showAIChat ? 'primary' : 'secondary'}
                  size="small"
                >
                  <Icon icon={CpuChipIcon} size={16} className="mr-1" /> AI Analyst
                </Button>
                <Button 
                  onClick={() => setShowOptimization(!showOptimization)} 
                  variant={showOptimization ? 'primary' : 'secondary'}
                  size="small"
                >
                  <Icon icon={CursorArrowRaysIcon} size={16} className="mr-1" /> Store Optimizer
                </Button>
                <Button 
                  onClick={() => setShowDemandGrid(!showDemandGrid)} 
                  variant={showDemandGrid ? 'primary' : 'secondary'}
                  size="small"
                >
                  <Icon icon={ChartBarIcon} size={16} className="mr-1" /> Population Grid
                </Button>
                <Button onClick={() => changeView('dashboard')} variant="secondary" size="small">
                  ← Back to Dashboard
                </Button>
                <Button onClick={logout} variant="secondary" size="small">
                  Logout
                </Button>
              </div>
            </div>
            
            {/* Population Grid Controls */}
            {showDemandGrid && (
              <div style={{
                display: 'flex',
                gap: theme.spacing[4],
                marginTop: theme.spacing[3],
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', color: theme.colors.gray[600], display: 'block', marginBottom: '4px' }}>
                    Mesh Size: {meshSize}m
                  </label>
                  <input
                    type="range"
                    min="250"
                    max="1000"
                    step="50"
                    value={meshSize}
                    onChange={(e) => setMeshSize(Number(e.target.value))}
                    style={{
                      width: '100%',
                      height: '6px',
                      background: '#e5e7eb',
                      borderRadius: '3px',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: theme.colors.gray[500], marginTop: '2px' }}>
                    <span>250m</span>
                    <span>1000m</span>
                  </div>
                </div>
                
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', color: theme.colors.gray[600], display: 'block', marginBottom: '4px' }}>
                    Catchment Radius: {catchmentRadius}km
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="5"
                    step="0.5"
                    value={catchmentRadius}
                    onChange={(e) => setCatchmentRadius(Number(e.target.value))}
                    style={{
                      width: '100%',
                      height: '6px',
                      background: '#e5e7eb',
                      borderRadius: '3px',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: theme.colors.gray[500], marginTop: '2px' }}>
                    <span>0.5km</span>
                    <span>5km</span>
                  </div>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  marginLeft: theme.spacing[4],
                  minWidth: '200px'
                }}>
                  <input
                    type="checkbox"
                    id="fullMapBounds"
                    checked={useFullMapBounds}
                    onChange={(e) => setUseFullMapBounds(e.target.checked)}
                    style={{ marginRight: '8px', cursor: 'pointer' }}
                  />
                  <label 
                    htmlFor="fullMapBounds" 
                    style={{ 
                      fontSize: '12px', 
                      color: theme.colors.gray[600], 
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                  >
                    Cover Full Map Area
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Professional Analytics Dashboard */}
          <div style={formStyle}>
            <div style={responsiveFlexStyle}>
              <h3 style={heading3Style}>📊 Analytics Dashboard</h3>
              <div style={buttonContainerStyle}>
                <Button 
                  onClick={() => setShowHelp(!showHelp)}
                  variant="secondary"
                  size="small"
                >
                  📚 How to Use
                </Button>
                <Button 
                  onClick={generateDashboard}
                  variant="primary"
                  size="small"
                >
                  📈 Generate Dashboard
                </Button>
              </div>
            </div>


            {dashboardData && (
              <div style={{ 
                backgroundColor: '#fff', 
                border: '2px solid #28a745',
                borderRadius: '8px',
                padding: '20px',
                marginTop: '15px'
              }}>
                <h4 style={{ margin: '0 0 20px 0', color: '#28a745' }}>
                  📊 Portfolio Analytics Report
                  <span style={{ fontSize: '12px', color: '#666', fontWeight: 'normal', marginLeft: '10px' }}>
                    Generated: {new Date(dashboardData.generatedAt).toLocaleString()}
                  </span>
                </h4>

                {/* Portfolio Summary */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                  gap: '15px',
                  marginBottom: '20px'
                }}>
                  <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '5px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
                      🏪 Portfolio Overview
                    </div>
                    <div style={{ fontSize: '12px' }}>
                      Stores: {dashboardData.portfolioMetrics.totalStores}<br/>
                      Competitors: {dashboardData.portfolioMetrics.totalCompetitors}<br/>
                      POIs: {dashboardData.portfolioMetrics.totalPOIs}<br/>
                      Trade Areas: {dashboardData.portfolioMetrics.totalTradeAreas}
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '5px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
                      📈 Market Performance
                    </div>
                    <div style={{ fontSize: '12px' }}>
                      Avg Market Share: {dashboardData.portfolioMetrics.avgMarketShare.toFixed(1)}%<br/>
                      Total Captured Demand: {Math.round(dashboardData.portfolioMetrics.totalCapturedDemand).toLocaleString()}<br/>
                      Strong Positions: {dashboardData.portfolioMetrics.strongPositions}<br/>
                      Challenged: {dashboardData.portfolioMetrics.challengedPositions}
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '5px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
                      🎯 Competitive Landscape
                    </div>
                    <div style={{ fontSize: '12px' }}>
                      Avg Pressure: {dashboardData.portfolioMetrics.avgCompetitorPressure.toFixed(2)}<br/>
                      Environment: {
                        dashboardData.portfolioMetrics.avgCompetitorPressure > 2 ? 'Highly Competitive' :
                        dashboardData.portfolioMetrics.avgCompetitorPressure > 1 ? 'Competitive' : 'Favorable'
                      }<br/>
                      Risk Level: {
                        dashboardData.portfolioMetrics.challengedPositions / dashboardData.portfolioMetrics.totalStores > 0.3 ? 'High' :
                        dashboardData.portfolioMetrics.avgCompetitorPressure > 1.5 ? 'Medium' : 'Low'
                      }
                    </div>
                  </div>

                  {dashboardData.geographicMetrics && (
                    <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '5px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
                        🗾 Geographic Coverage
                      </div>
                      <div style={{ fontSize: '12px' }}>
                        Center: {dashboardData.geographicMetrics.centerPoint[1]}, {dashboardData.geographicMetrics.centerPoint[0]}<br/>
                        Lat Range: {dashboardData.geographicMetrics.coverage.latRange}<br/>
                        Lng Range: {dashboardData.geographicMetrics.coverage.lngRange}
                      </div>
                    </div>
                  )}
                </div>

                {/* Portfolio Recommendations */}
                {dashboardData.recommendations && dashboardData.recommendations.length > 0 && (
                  <div style={{ marginBottom: '20px' }}>
                    <h5 style={{ marginBottom: '10px' }}>💡 Strategic Recommendations:</h5>
                    {dashboardData.recommendations.map((rec, index) => (
                      <div key={index} style={{
                        fontSize: '12px',
                        padding: '8px 12px',
                        marginBottom: '5px',
                        backgroundColor: 
                          rec.priority === 'High' ? '#f8d7da' :
                          rec.priority === 'Medium' ? '#fff3cd' : '#d4edda',
                        borderRadius: '3px',
                        border: `1px solid ${
                          rec.priority === 'High' ? '#f5c6cb' :
                          rec.priority === 'Medium' ? '#ffeaa7' : '#c3e6cb'
                        }`
                      }}>
                        <span style={{ fontWeight: 'bold' }}>
                          {rec.icon} {rec.type} ({rec.priority}):
                        </span> {rec.action}
                      </div>
                    ))}
                  </div>
                )}

                {/* Store Performance Table */}
                {dashboardData.storeMetrics && dashboardData.storeMetrics.length > 0 && (
                  <div>
                    <h5 style={{ marginBottom: '10px' }}>🏪 Store Performance Analysis:</h5>
                    <div style={{ 
                      maxHeight: '300px', 
                      overflowY: 'auto',
                      border: '1px solid #dee2e6',
                      borderRadius: '5px'
                    }}>
                      <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
                        <thead style={{ backgroundColor: '#f8f9fa', position: 'sticky', top: 0 }}>
                          <tr>
                            <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Store</th>
                            <th style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>Market Share</th>
                            <th style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>Demand</th>
                            <th style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>Position</th>
                            <th style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>Pressure</th>
                            <th style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>Trade Areas</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dashboardData.storeMetrics
                            .sort((a, b) => b.marketShare - a.marketShare)
                            .map((store, index) => (
                            <tr key={store.id} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa' }}>
                              <td style={{ padding: '8px', borderBottom: '1px solid #dee2e6' }}>
                                <strong>{store.name}</strong>
                              </td>
                              <td style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>
                                {store.marketShare.toFixed(1)}%
                              </td>
                              <td style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>
                                {Math.round(store.capturedDemand).toLocaleString()}
                              </td>
                              <td style={{ 
                                padding: '8px', 
                                textAlign: 'center', 
                                borderBottom: '1px solid #dee2e6',
                                color: store.marketPosition === 'Dominant' ? '#28a745' :
                                       store.marketPosition === 'Strong' ? '#17a2b8' :
                                       store.marketPosition === 'Competitive' ? '#ffc107' : '#dc3545',
                                fontWeight: 'bold'
                              }}>
                                {store.marketPosition}
                              </td>
                              <td style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>
                                {store.competitorPressure.toFixed(2)}
                              </td>
                              <td style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>
                                {store.tradeAreaCount}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <button 
                  onClick={() => {
                    setDashboardData(null);
                    setMessage('Dashboard cleared');
                  }}
                  style={{
                    ...theme.components.button.secondary,
                    backgroundColor: '#6c757d',
                    fontSize: '12px',
                    padding: '8px 12px',
                    marginTop: '15px'
                  }}
                >
                  Clear Dashboard
                </button>
              </div>
            )}

            {/* How to Use Guide */}
            {showHelp && (
              <div style={{
                backgroundColor: '#fff',
                border: '2px solid #17a2b8',
                borderRadius: '8px',
                padding: '20px',
                marginTop: '15px'
              }}>
                <h4 style={{ margin: '0 0 20px 0', color: '#17a2b8' }}>
                  📚 How to Use Trade Area Analysis Tool
                </h4>

                <div style={{ marginBottom: '25px' }}>
                  <h5 style={{ color: '#007bff', marginBottom: '10px' }}>🇺🇸 English Guide</h5>
                  
                  <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
                    <div style={{ marginBottom: '15px' }}>
                      <strong>🚀 Quick Start:</strong><br/>
                      1. <strong>Add Locations:</strong> Use the form below or CSV bulk upload to add stores, competitors, and points of interest<br/>
                      2. <strong>Generate Dashboard:</strong> Click "Generate Dashboard" to see portfolio analytics<br/>
                      3. <strong>Create Trade Areas:</strong> Select any location and choose analysis type (Radius or Huff Model)<br/>
                      4. <strong>Optimize Locations:</strong> Use AI-powered site selection to find optimal new store locations<br/>
                      5. <strong>Analyze Competitors:</strong> Run competitive intelligence to understand market threats
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                      <strong>📍 Adding Locations:</strong><br/>
                      • <strong>Manual Entry:</strong> Fill out the location form with name, coordinates, and type<br/>
                      • <strong>Geocoding:</strong> Type Japanese address and click 🔍 to auto-fill coordinates<br/>
                      • <strong>Reverse Geocoding:</strong> Enter coordinates and click 📍→📫 to get address<br/>
                      • <strong>CSV Bulk Upload:</strong> Upload CSV with auto-geocoding (supports coordinates OR addresses)
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                      <strong>🎯 Trade Area Analysis:</strong><br/>
                      • <strong>Simple Radius:</strong> Traditional circular trade area around your store<br/>
                      • <strong>Huff Model:</strong> Advanced probability-based trade area considering competitor impact<br/>
                      • <strong>Market Share:</strong> Shows captured demand and competitive advantage<br/>
                      • <strong>Competitive Analysis:</strong> Identifies high-threat competitors and market pressure
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                      <strong>🧠 AI Features:</strong><br/>
                      • <strong>Store Optimization:</strong> Generate candidate locations → Run optimization to find best sites<br/>
                      • <strong>Competitor Analysis:</strong> Threat assessment with distance decay modeling<br/>
                      • <strong>Market Intelligence:</strong> Strategic recommendations based on competitive landscape<br/>
                      • <strong>Portfolio Analytics:</strong> Comprehensive dashboard with performance metrics
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                      <strong>📊 Dashboard Features:</strong><br/>
                      • <strong>Portfolio Overview:</strong> Store count, market share, competitive pressure<br/>
                      • <strong>Performance Ranking:</strong> Stores ranked by market share and position<br/>
                      • <strong>Risk Assessment:</strong> Vulnerability analysis and strategic recommendations<br/>
                      • <strong>Geographic Coverage:</strong> Market territory analysis with boundary mapping
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '25px' }}>
                  <h5 style={{ color: '#007bff', marginBottom: '10px' }}>🇯🇵 日本語ガイド</h5>
                  
                  <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
                    <div style={{ marginBottom: '15px' }}>
                      <strong>🚀 クイックスタート:</strong><br/>
                      1. <strong>ロケーション追加:</strong> 下記フォームまたはCSVインポートで店舗・競合・POIを追加<br/>
                      2. <strong>ダッシュボード生成:</strong> "ダッシュボード生成"をクリックしてポートフォリオ分析を表示<br/>
                      3. <strong>商圏作成:</strong> ロケーションを選択し分析タイプ（半径またはハフモデル）を選択<br/>
                      4. <strong>ロケーション最適化:</strong> AI駆動のサイト選定で最適な新店舗場所を発見<br/>
                      5. <strong>競合分析:</strong> 競合インテリジェンスを実行して市場脅威を理解
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                      <strong>📍 ロケーション追加方法:</strong><br/>
                      • <strong>手動入力:</strong> 名前、座標、タイプでロケーションフォームを記入<br/>
                      • <strong>ジオコーディング:</strong> 日本の住所を入力し🔍をクリックして座標を自動入力<br/>
                      • <strong>逆ジオコーディング:</strong> 座標を入力し📍→📫をクリックして住所を取得<br/>
                      • <strong>CSVインポート:</strong> 列（name, latitude, longitude, type, address（任意））のCSVファイルをアップロード
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                      <strong>🎯 商圏分析:</strong><br/>
                      • <strong>シンプル半径:</strong> 店舗周辺の伝統的な円形商圏<br/>
                      • <strong>ハフモデル:</strong> 競合の影響を考慮した確率ベースの高度な商圏<br/>
                      • <strong>マーケットシェア:</strong> 獲得需要と競争優位性を表示<br/>
                      • <strong>競合分析:</strong> 高脅威競合と市場圧力を特定
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                      <strong>🧠 AI機能:</strong><br/>
                      • <strong>店舗最適化:</strong> 候補地生成 → 最適化実行で最適サイトを発見<br/>
                      • <strong>競合分析:</strong> 距離減衰モデリングによる脅威評価<br/>
                      • <strong>市場インテリジェンス:</strong> 競争環境に基づく戦略的推奨事項<br/>
                      • <strong>ポートフォリオ分析:</strong> パフォーマンス指標による包括的ダッシュボード
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                      <strong>📊 ダッシュボード機能:</strong><br/>
                      • <strong>ポートフォリオ概要:</strong> 店舗数、マーケットシェア、競争圧力<br/>
                      • <strong>パフォーマンスランキング:</strong> マーケットシェアとポジションによる店舗ランキング<br/>
                      • <strong>リスク評価:</strong> 脆弱性分析と戦略的推奨事項<br/>
                      • <strong>地理的カバレッジ:</strong> 境界マッピングによる市場テリトリー分析
                    </div>
                  </div>
                </div>

                <div style={{ 
                  backgroundColor: '#f8f9fa', 
                  padding: '15px', 
                  borderRadius: '5px',
                  marginBottom: '15px'
                }}>
                  <strong style={{ color: '#28a745' }}>💡 Pro Tips / プロのヒント:</strong><br/>
                  <div style={{ fontSize: '12px', marginTop: '8px' }}>
                    • Use competitor analysis before opening new stores / 新店舗開店前に競合分析を使用<br/>
                    • Use CSV bulk upload with auto-geocoding for efficiency / 効率のため自動ジオコーディング付きCSV一括アップロードを使用<br/>
                    • Compare Radius vs Huff Model for accuracy / 精度のため半径とハフモデルを比較<br/>
                    • Generate dashboard regularly for portfolio monitoring / ポートフォリオ監視のため定期的にダッシュボードを生成
                  </div>
                </div>

                <button 
                  onClick={() => setShowHelp(false)}
                  style={{
                    ...theme.components.button.secondary,
                    backgroundColor: '#17a2b8',
                    fontSize: '12px',
                    padding: '8px 12px'
                  }}
                >
                  Close Guide / ガイドを閉じる
                </button>
              </div>
            )}
          </div>

          {/* CSV Bulk Upload - Moved to top */}
          <div style={{ 
            ...formStyle,
            marginBottom: theme.spacing[5]
          }}>
            <h3 style={formHeaderStyle}>📤 CSV Bulk Upload with Auto-Geocoding</h3>
              <div style={{ marginBottom: theme.spacing[4] }}>
                <p style={{
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.gray[600],
                  marginBottom: theme.spacing[3],
                  lineHeight: '1.5'
                }}>
                  Upload a CSV file to add multiple locations at once. Supports automatic address geocoding.
                </p>
                
                <div style={{
                  backgroundColor: theme.colors.primary[50],
                  border: `1px solid ${theme.colors.gray[200]}`,
                  borderRadius: '8px',
                  padding: theme.spacing[3],
                  marginBottom: theme.spacing[3]
                }}>
                  <div style={{
                    fontSize: theme.typography.fontSize.xs,
                    color: theme.colors.primary[700],
                    marginBottom: theme.spacing[2]
                  }}>
                    <strong>📋 Required CSV Columns:</strong>
                  </div>
                  <div style={{
                    fontSize: theme.typography.fontSize.xs,
                    color: theme.colors.primary[600],
                    lineHeight: '1.4'
                  }}>
                    • <strong>name</strong> (名前) - Location name<br/>
                    • <strong>type</strong> (種類) - store, competitor, poi, ENEOS<br/>
                    • <strong>address</strong> (住所) - Address for auto-geocoding OR<br/>
                    • <strong>latitude, longitude</strong> (緯度, 経度) - Coordinates<br/>
                    <em>Works with or without headers - auto-detects format</em>
                  </div>
                </div>

                <div style={{
                  border: '2px dashed #e5e7eb',
                  borderRadius: '8px',
                  padding: theme.spacing[4],
                  textAlign: 'center',
                  backgroundColor: '#fafafa',
                  transition: 'border-color 0.3s ease'
                }}>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCSVImport}
                    style={{ display: 'none' }}
                    id="csv-upload"
                  />
                  <label 
                    htmlFor="csv-upload"
                    style={{
                      cursor: 'pointer',
                      display: 'block',
                      color: theme.colors.primary[600],
                      fontSize: theme.typography.fontSize.sm,
                      fontWeight: theme.typography.fontWeight.medium
                    }}
                  >
                    <div style={{ marginBottom: theme.spacing[2] }}>
                      📁 Click to select CSV file
                    </div>
                    <div style={{
                      fontSize: theme.typography.fontSize.xs,
                      color: theme.colors.gray[500]
                    }}>
                      Automatic geocoding will convert addresses to coordinates
                    </div>
                  </label>
                </div>
              </div>
            </div>

          {/* Add Location and Locations side by side */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: theme.spacing[5], 
            marginBottom: theme.spacing[5],
            
            '@media (max-width: 768px)': {
              gridTemplateColumns: '1fr'
            }
          }}>
            {/* Add Location Form */}
            <div style={formStyle}>
              <h3 style={formHeaderStyle}>Add New Location</h3>
              <form onSubmit={createLocation} style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[4] }}>
                <Input 
                  type="text" 
                  name="locationName" 
                  placeholder="Location Name (e.g., 新宿店)" 
                  label="Location Name"
                  required 
                />
                
                {/* Enhanced Address Input with Geocoding */}
                <div style={{ position: 'relative' }}>
                  <Input 
                    type="text" 
                    name="address" 
                    value={currentAddress}
                    onChange={(e) => setCurrentAddress(e.target.value)}
                    placeholder="Address (e.g., 東京都新宿区新宿3-1-1 or 35.6762, 139.6503)" 
                    label="Address"
                    onBlur={(e) => {
                      const address = e.target.value;
                      if (address && address.length > 5) {
                        // Auto-geocode when user finishes typing address
                        handleAddressGeocoding(address, (coords) => {
                          setFormCoordinates({ lat: coords.latitude.toString(), lng: coords.longitude.toString() });
                        });
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      console.log('Button clicked, current address:', currentAddress);
                      if (currentAddress && currentAddress.trim().length > 0) {
                        handleAddressGeocoding(currentAddress.trim(), (coords) => {
                          console.log('Geocoding success:', coords);
                          // Update form coordinates
                          setFormCoordinates({ lat: coords.latitude.toString(), lng: coords.longitude.toString() });
                          // Also update the form inputs directly
                          const form = e.target.closest('form');
                          const latInput = form?.querySelector('input[name="latitude"]');
                          const lngInput = form?.querySelector('input[name="longitude"]');
                          if (latInput && lngInput) {
                            latInput.value = coords.latitude.toString();
                            lngInput.value = coords.longitude.toString();
                          }
                          setMessage(`✅ Coordinates found: ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`);
                        });
                      } else {
                        setMessage('⚠️ Please enter an address first');
                        console.log('No address entered, current value:', currentAddress);
                      }
                    }}
                    variant="primary"
                    size="small"
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '11px',
                      padding: '4px 8px',
                      zIndex: 10
                    }}
                    title="Get coordinates from address"
                  >
                    <Icon icon={MagnifyingGlassIcon} size={14} /> Find
                  </Button>
                </div>

                {/* Enhanced Coordinate Inputs with Reverse Geocoding */}
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: theme.spacing[2],
                    fontSize: theme.typography.fontSize.sm,
                    fontWeight: theme.typography.fontWeight.medium,
                    color: theme.colors.gray[700],
                    fontFamily: theme.typography.fontFamily.primary
                  }}>
                    Coordinates
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: theme.spacing[3], alignItems: 'end' }}>
                    <input 
                      type="number" 
                      name="latitude" 
                      placeholder="Latitude (緯度)" 
                      step="any" 
                      required 
                      style={theme.components.input.base}
                      onChange={(e) => {
                        const lat = parseFloat(e.target.value);
                        const lngInput = e.target.parentElement.querySelector('input[name="longitude"]');
                        const lng = parseFloat(lngInput?.value);
                        
                        // Auto-reverse geocode when both coordinates are valid
                        if (lat && lng && lat >= 20 && lat <= 50 && lng >= 120 && lng <= 150) {
                          handleReverseGeocoding(lat, lng);
                        }
                      }}
                    />
                    <input 
                      type="number" 
                      name="longitude" 
                      placeholder="Longitude (経度)" 
                      step="any" 
                      required 
                      style={theme.components.input.base}
                      onChange={(e) => {
                        const lng = parseFloat(e.target.value);
                        const latInput = e.target.parentElement.querySelector('input[name="latitude"]');
                        const lat = parseFloat(latInput?.value);
                        
                        // Auto-reverse geocode when both coordinates are valid
                        if (lat && lng && lat >= 20 && lat <= 50 && lng >= 120 && lng <= 150) {
                          handleReverseGeocoding(lat, lng);
                        }
                      }}
                    />
                    <Button 
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        const latInput = document.querySelector('input[name="latitude"]');
                        const lngInput = document.querySelector('input[name="longitude"]');
                        const lat = parseFloat(latInput?.value);
                        const lng = parseFloat(lngInput?.value);
                        
                        if (lat && lng) {
                          handleReverseGeocoding(lat, lng);
                        } else {
                          setMessage('Please enter both latitude and longitude first');
                        }
                      }}
                      variant="secondary"
                      size="small"
                      title="Get address from coordinates"
                    >
                      <Icon icon={EnvelopeIcon} size={14} />
                    </Button>
                  </div>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: theme.spacing[2],
                    fontSize: theme.typography.fontSize.sm,
                    fontWeight: theme.typography.fontWeight.medium,
                    color: theme.colors.gray[700],
                    fontFamily: theme.typography.fontFamily.primary
                  }}>
                    Location Type
                  </label>
                  <select name="locationType" required style={theme.components.input.base}>
                    <option value="">Select Type</option>
                    <option value="store">Store (店舗)</option>
                    <option value="competitor">Competitor (競合)</option>
                    <option value="poi">Point of Interest</option>
                  </select>
                </div>
                <Button type="submit" variant="primary" style={{ width: '100%' }}>Add Location</Button>
              </form>
            </div>

            {/* Locations List */}
            <div style={formStyle}>
              <h3 style={formHeaderStyle}>Locations ({locations.length})</h3>
              {locations.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: theme.spacing[8],
                  color: theme.colors.gray[600]
                }}>
                  <p style={bodyTextStyle}>No locations yet. Add your first location!</p>
                </div>
              ) : (
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {locations.map(location => (
                    <div key={location.id} style={{ 
                      ...projectCardStyle,
                      padding: theme.spacing[4], 
                      marginBottom: theme.spacing[3],
                      position: 'relative'
                    }}>
                      <div style={{ 
                        ...heading3Style,
                        fontSize: theme.typography.fontSize.base,
                        marginBottom: theme.spacing[2]
                      }}>
                        {location.location_type === 'store' ? 
                          <Icon icon={BuildingStorefrontIcon} size={16} className="mr-1" /> : 
                         location.location_type === 'competitor' ? 
                          <Icon icon={BuildingOfficeIcon} size={16} className="mr-1" /> : 
                          <Icon icon={MapPinIcon} size={16} className="mr-1" />} {location.name}
                      </div>
                      {location.address && (
                        <div style={{
                          ...captionTextStyle,
                          marginBottom: theme.spacing[2]
                        }}>
                          {location.address}
                        </div>
                      )}
                      <div style={{ 
                        ...captionTextStyle,
                        fontSize: theme.typography.fontSize.xs,
                        marginBottom: theme.spacing[3]
                      }}>
                        {location.coordinates.coordinates[1].toFixed(4)}, {location.coordinates.coordinates[0].toFixed(4)}
                      </div>
                      <div style={buttonGroupStyle}>
                        <Button 
                          onClick={() => setSelectedLocation(location)}
                          variant="primary"
                          size="small"
                        >
                          <Icon icon={PresentationChartLineIcon} size={16} className="mr-1" /> Create Trade Area
                        </Button>
                        <Button 
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete "${location.name}"?`)) {
                              deleteLocation(location.id);
                            }
                          }}
                          variant="danger"
                          size="small"
                        >
                          <Icon icon={TrashIcon} size={16} className="mr-1" /> Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>


          {/* Trade Area Creation Form */}
          {selectedLocation && (
            <div style={compactFormStyle}>
              <h3 style={formHeaderStyle}>📊 Advanced Trade Area Analysis for {selectedLocation.name}</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const analysisType = formData.get('analysisType');
                const radius = formData.get('radius') ? parseFloat(formData.get('radius')) : 3;
                const name = formData.get('tradeAreaName');
                createTradeArea(selectedLocation.id, radius, name, analysisType);
                setSelectedLocation(null);
                e.target.reset();
              }}>
                <div style={{ marginBottom: theme.spacing[4] }}>
                  <label style={{
                    display: 'block',
                    marginBottom: theme.spacing[2],
                    fontSize: theme.typography.fontSize.sm,
                    fontWeight: theme.typography.fontWeight.medium,
                    color: theme.colors.gray[700],
                    fontFamily: theme.typography.fontFamily.primary
                  }}>
                    Analysis Type:
                  </label>
                  <select name="analysisType" required style={theme.components.input.base}>
                    <option value="radius">📏 Simple Radius (Basic)</option>
                    <option value="huff">🎯 Huff Model (Advanced - needs multiple locations)</option>
                  </select>
                  <small style={{ 
                    ...captionTextStyle,
                    marginTop: theme.spacing[1],
                    display: 'block'
                  }}>
                    Huff Model uses competitor locations for realistic market capture analysis
                  </small>
                </div>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: theme.spacing[3], 
                  marginBottom: theme.spacing[4] 
                }}>
                  <Input 
                    type="text" 
                    name="tradeAreaName" 
                    placeholder="Trade Area Name (optional)"
                    label="Trade Area Name"
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
                      Radius
                    </label>
                    <select name="radius" style={theme.components.input.base}>
                      <option value="">Auto-size for Huff Model</option>
                      <option value="0.5">500m radius</option>
                      <option value="1">1km radius</option>
                      <option value="2">2km radius</option>
                      <option value="3">3km radius</option>
                      <option value="5">5km radius</option>
                      <option value="10">10km radius</option>
                    </select>
                  </div>
                </div>

                <div style={{ 
                  backgroundColor: theme.colors.primary[50], 
                  padding: theme.spacing[3], 
                  borderRadius: theme.borderRadius.lg, 
                  marginBottom: theme.spacing[4],
                  fontSize: theme.typography.fontSize.sm,
                  border: `1px solid ${theme.colors.primary[100]}`
                }}>
                  <strong style={{ color: theme.colors.primary[700] }}>💡 Analysis Methods:</strong><br/>
                  • <strong>Simple Radius:</strong> Traditional circular trade area<br/>
                  • <strong>Huff Model:</strong> Scientific customer capture probability based on distance decay and competitor locations
                </div>

                <div style={buttonGroupStyle}>
                  <Button type="submit" variant="primary">
                    {locations.length > 1 ? '🎯 Run Analysis' : '📏 Create Trade Area'}
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => setSelectedLocation(null)}
                    variant="secondary"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Store Location Optimization */}
          {locations.length >= 2 && (
            <div style={formStyle}>
              <h3>🎯 Store Location Optimization</h3>
              <div style={{ 
                backgroundColor: '#e8f5e8', 
                padding: '15px', 
                borderRadius: '5px', 
                marginBottom: '15px',
                fontSize: '14px'
              }}>
                <strong>🧠 AI-Powered Site Selection</strong><br/>
                Find optimal locations for new stores using advanced analytics and competitor analysis
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <button 
                  onClick={() => {
                    const candidates = generateCandidateLocations(locations, 40);
                    setCandidateLocations(candidates);
                    setMessage(`Generated ${candidates.length} candidate locations for optimization`);
                  }}
                  style={{
                    ...theme.components.button.secondary,
                    backgroundColor: '#6c757d',
                    fontSize: '14px'
                  }}
                >
                  🎲 Generate Candidates
                </button>
                
                <button 
                  onClick={() => {
                    if (candidateLocations.length === 0) {
                      setMessage('Please generate candidate locations first');
                      return;
                    }
                    
                    const results = optimizeStoreLocations(locations, candidateLocations, 3, 2.0);
                    setOptimizationResults(results);
                    
                    if (results && results.selectedStores.length > 0) {
                      setMessage(`Optimization complete! Found ${results.selectedStores.length} optimal locations with ${results.marketShareGain.toFixed(1)}% market share gain`);
                      
                      // Add optimized locations to map
                      updateMapOptimizedLocations(results.selectedStores);
                    } else {
                      setMessage('No suitable optimization candidates found');
                    }
                  }}
                  style={{
                    ...theme.components.button.secondary,
                    backgroundColor: candidateLocations.length > 0 ? '#28a745' : '#6c757d',
                    fontSize: '14px'
                  }}
                  disabled={candidateLocations.length === 0}
                >
                  🚀 Run Optimization
                </button>
              </div>

              {candidateLocations.length > 0 && (
                <div style={{ 
                  fontSize: '13px', 
                  color: '#666', 
                  marginBottom: '10px',
                  padding: '10px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '3px'
                }}>
                  📊 Generated {candidateLocations.length} candidate locations
                </div>
              )}

              {optimizationResults && (
                <div style={{ 
                  backgroundColor: '#fff', 
                  border: '2px solid #28a745',
                  borderRadius: '8px',
                  padding: '15px',
                  marginTop: '15px'
                }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#28a745' }}>🎯 Optimization Results</h4>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                      📈 Market Share Gain: <strong>{optimizationResults.marketShareGain.toFixed(1)}%</strong><br/>
                      👥 Additional Demand: <strong>{Math.round(optimizationResults.totalImprovement).toLocaleString()}</strong><br/>
                      🎯 Final Market Share: <strong>{optimizationResults.finalMarketShare.toFixed(1)}%</strong>
                    </div>
                  </div>

                  <div>
                    <strong>Selected Optimal Locations:</strong>
                    <div style={{ marginTop: '8px' }}>
                      {optimizationResults.selectedStores.map((store, index) => (
                        <div key={store.id} style={{ 
                          padding: '8px', 
                          backgroundColor: '#f8f9fa', 
                          borderRadius: '3px', 
                          marginBottom: '5px',
                          fontSize: '13px'
                        }}>
                          <div style={{ fontWeight: 'bold', color: '#28a745' }}>
                            ⭐ {store.name}
                          </div>
                          <div style={{ color: '#666' }}>
                            📍 {store.coordinates.coordinates[1].toFixed(4)}, {store.coordinates.coordinates[0].toFixed(4)}<br/>
                            📊 Score: {store.score.toFixed(2)} | 
                            👥 Additional Demand: {Math.round(store.marketImpact.additionalDemand).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      setOptimizationResults(null);
                      setCandidateLocations([]);
                      updateMapOptimizedLocations([]);
                      setMessage('Optimization results cleared');
                    }}
                    style={{
                      ...theme.components.button.secondary,
                      backgroundColor: '#dc3545',
                      fontSize: '12px',
                      padding: '8px 12px',
                      marginTop: '10px'
                    }}
                  >
                    Clear Results
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Competitor Impact Analysis */}
          {locations.filter(loc => loc.location_type === 'store').length > 0 && 
           locations.filter(loc => loc.location_type === 'competitor').length > 0 && (
            <div style={formStyle}>
              <h3>🏢 Competitor Impact Analysis</h3>
              <div style={{ 
                backgroundColor: '#fff3cd', 
                padding: '15px', 
                borderRadius: '5px', 
                marginBottom: '15px',
                fontSize: '14px'
              }}>
                <strong>📊 Advanced Competitive Intelligence</strong><br/>
                Analyze competitor threats, market pressure, and strategic positioning for your stores
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <button 
                  onClick={() => {
                    const stores = locations.filter(loc => loc.location_type === 'store');
                    const competitors = locations.filter(loc => loc.location_type === 'competitor');
                    
                    if (stores.length === 0 || competitors.length === 0) {
                      setMessage('Need at least 1 store and 1 competitor for analysis');
                      return;
                    }
                    
                    const analysis = analyzeCompetitorImpact(stores, competitors);
                    setCompetitorAnalysis(analysis);
                    
                    if (analysis) {
                      const storeCount = Object.keys(analysis).length;
                      const avgVulnerability = Object.values(analysis).reduce((sum, store) => sum + store.metrics.vulnerability, 0) / storeCount;
                      setMessage(`Competitor analysis complete! Analyzed ${storeCount} stores with ${(avgVulnerability * 100).toFixed(1)}% average vulnerability`);
                    }
                  }}
                  style={{
                    ...theme.components.button.secondary,
                    backgroundColor: '#dc3545',
                    fontSize: '14px'
                  }}
                >
                  🔍 Analyze Competitive Threats
                </button>
                
                <button 
                  onClick={() => {
                    const stores = locations.filter(loc => loc.location_type === 'store');
                    if (stores.length === 0) {
                      setMessage('No stores available for market share analysis');
                      return;
                    }
                    
                    // Analyze market share for first store as example
                    const marketShare = calculateCompetitiveMarketShare(locations, stores[0].id);
                    if (marketShare) {
                      setMessage(`Market Share Analysis: ${marketShare.targetStoreName} captures ${marketShare.marketSharePercentage.toFixed(1)}% market share`);
                      console.log('Market Share Details:', marketShare);
                    }
                  }}
                  style={{
                    ...theme.components.button.secondary,
                    backgroundColor: '#17a2b8',
                    fontSize: '14px'
                  }}
                >
                  📈 Market Share Analysis
                </button>
              </div>

              {competitorAnalysis && (
                <div style={{ 
                  backgroundColor: '#fff', 
                  border: '2px solid #dc3545',
                  borderRadius: '8px',
                  padding: '15px',
                  marginTop: '15px'
                }}>
                  <h4 style={{ margin: '0 0 15px 0', color: '#dc3545' }}>🏢 Competitive Intelligence Report</h4>
                  
                  {Object.values(competitorAnalysis).map((storeAnalysis, index) => (
                    <div key={storeAnalysis.storeId} style={{
                      marginBottom: '20px',
                      padding: '15px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '5px',
                      border: `1px solid ${
                        storeAnalysis.metrics.marketPosition === 'Dominant' ? '#28a745' :
                        storeAnalysis.metrics.marketPosition === 'Strong' ? '#17a2b8' :
                        storeAnalysis.metrics.marketPosition === 'Competitive' ? '#ffc107' : '#dc3545'
                      }`
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: '10px'
                      }}>
                        <h5 style={{ margin: 0, color: '#333' }}>
                          🏪 {storeAnalysis.storeName}
                        </h5>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          backgroundColor: 
                            storeAnalysis.metrics.marketPosition === 'Dominant' ? '#d4edda' :
                            storeAnalysis.metrics.marketPosition === 'Strong' ? '#d1ecf1' :
                            storeAnalysis.metrics.marketPosition === 'Competitive' ? '#fff3cd' : '#f8d7da',
                          color:
                            storeAnalysis.metrics.marketPosition === 'Dominant' ? '#155724' :
                            storeAnalysis.metrics.marketPosition === 'Strong' ? '#0c5460' :
                            storeAnalysis.metrics.marketPosition === 'Competitive' ? '#856404' : '#721c24'
                        }}>
                          {storeAnalysis.metrics.marketPosition}
                        </span>
                      </div>

                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '1fr 1fr', 
                        gap: '15px',
                        marginBottom: '15px'
                      }}>
                        <div>
                          <div style={{ fontSize: '13px', marginBottom: '8px' }}>
                            <strong>Competitive Metrics:</strong><br/>
                            🎯 Competitive Advantage: {(storeAnalysis.metrics.competitiveAdvantage * 100).toFixed(1)}%<br/>
                            ⚠️ Vulnerability: {(storeAnalysis.metrics.vulnerability * 100).toFixed(1)}%<br/>
                            🏢 Nearby Competitors: {storeAnalysis.metrics.nearbyCompetitorCount}<br/>
                            🔥 High Threats: {storeAnalysis.metrics.highThreatCount}
                          </div>
                        </div>
                        
                        <div>
                          <div style={{ fontSize: '13px', marginBottom: '8px' }}>
                            <strong>Market Pressure:</strong><br/>
                            📊 Total Pressure: {storeAnalysis.metrics.totalCompetitivePressure.toFixed(2)}<br/>
                            📏 Avg Distance: {storeAnalysis.metrics.averageCompetitorDistance.toFixed(2)}km<br/>
                            🎪 Market Environment: {
                              storeAnalysis.metrics.totalCompetitivePressure > 2 ? 'Highly Competitive' :
                              storeAnalysis.metrics.totalCompetitivePressure > 1 ? 'Competitive' : 'Favorable'
                            }
                          </div>
                        </div>
                      </div>

                      {storeAnalysis.recommendations && storeAnalysis.recommendations.length > 0 && (
                        <div>
                          <strong style={{ fontSize: '14px', marginBottom: '8px', display: 'block' }}>
                            💡 Strategic Recommendations:
                          </strong>
                          {storeAnalysis.recommendations.map((rec, recIndex) => (
                            <div key={recIndex} style={{
                              fontSize: '12px',
                              padding: '6px 10px',
                              marginBottom: '4px',
                              backgroundColor: 
                                rec.priority === 'High' ? '#f8d7da' :
                                rec.priority === 'Medium' ? '#fff3cd' : '#d4edda',
                              borderRadius: '3px',
                              border: `1px solid ${
                                rec.priority === 'High' ? '#f5c6cb' :
                                rec.priority === 'Medium' ? '#ffeaa7' : '#c3e6cb'
                              }`
                            }}>
                              <span style={{ fontWeight: 'bold' }}>
                                {rec.icon} {rec.type} ({rec.priority}):
                              </span> {rec.action}
                            </div>
                          ))}
                        </div>
                      )}

                      {storeAnalysis.competitorImpacts && storeAnalysis.competitorImpacts.slice(0, 3).length > 0 && (
                        <div style={{ marginTop: '12px' }}>
                          <strong style={{ fontSize: '13px' }}>Top Competitive Threats:</strong>
                          {storeAnalysis.competitorImpacts.slice(0, 3).map((competitor, compIndex) => (
                            <div key={competitor.competitorId} style={{
                              fontSize: '11px',
                              padding: '4px 8px',
                              marginTop: '4px',
                              backgroundColor: '#ffffff',
                              borderRadius: '3px',
                              border: '1px solid #dee2e6'
                            }}>
                              🏢 <strong>{competitor.competitorName}</strong> - 
                              {competitor.distance.toFixed(2)}km away, 
                              <span style={{
                                color: competitor.threatLevel === 'High' ? '#dc3545' :
                                       competitor.threatLevel === 'Medium' ? '#ffc107' : '#28a745',
                                fontWeight: 'bold'
                              }}>
                                {competitor.threatLevel} threat
                              </span> (Impact: {competitor.competitiveImpact.toFixed(2)})
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  <button 
                    onClick={() => {
                      setCompetitorAnalysis(null);
                      setMessage('Competitor analysis cleared');
                    }}
                    style={{
                      ...theme.components.button.secondary,
                      backgroundColor: '#6c757d',
                      fontSize: '12px',
                      padding: '8px 12px',
                      marginTop: '10px'
                    }}
                  >
                    Clear Analysis
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Trade Areas List */}
          {tradeAreas.length > 0 && (
            <div style={formStyle}>
              <h3 style={formHeaderStyle}>🎯 Trade Areas ({tradeAreas.length})</h3>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                gap: theme.spacing[4] 
              }}>
                {tradeAreas.map((tradeArea, index) => {
                  const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'];
                  const color = colors[index % colors.length];
                  return (
                    <div key={tradeArea.id} style={{ 
                      ...projectCardStyle,
                      border: `2px solid ${color}`,
                      position: 'relative'
                    }}>
                      <div style={{ 
                        ...heading3Style,
                        marginBottom: theme.spacing[3],
                        paddingRight: theme.spacing[8] // Make room for delete button
                      }}>
                        {tradeArea.name}
                      </div>
                      <div style={{ 
                        ...bodyTextStyle,
                        fontSize: theme.typography.fontSize.sm,
                        lineHeight: 1.6
                      }}>
                        📍 Center: {tradeArea.locationName}<br/>
                        {tradeArea.analysisType === 'huff' ? (
                          <>
                            🎯 Analysis: Huff Model<br/>
                            📊 Market Share: {tradeArea.marketShare}%<br/>
                            👥 Captured Demand: {Math.round(tradeArea.totalDemand).toLocaleString()}<br/>
                            📈 Capture Points: {tradeArea.captureData?.length || 0}<br/>
                            {tradeArea.competitorAnalysis && (
                              <>
                                🏢 Competitors: {tradeArea.competitorAnalysis.nearbyCompetitors}<br/>
                                📏 Avg Distance: {tradeArea.competitorAnalysis.averageDistance}km<br/>
                                🎯 Dominance: {tradeArea.competitorAnalysis.dominanceZones.high} high zones
                              </>
                            )}
                          </>
                        ) : (
                          <>
                            📏 Radius: {tradeArea.radiusKm}km<br/>
                            📐 Area: {(Math.PI * tradeArea.radiusKm * tradeArea.radiusKm).toFixed(2)} km²
                          </>
                        )}
                      </div>
                      <Button 
                        onClick={() => deleteTradeArea(tradeArea.id)}
                        variant="danger"
                        size="small"
                        style={{
                          position: 'absolute',
                          top: theme.spacing[3],
                          right: theme.spacing[3]
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Map and AI Chat Integration */}
          <div style={{ 
            display: 'flex', 
            gap: theme.spacing[5], 
            marginTop: theme.spacing[5],
            flexDirection: 'column',
            
            '@media (min-width: 1024px)': {
              flexDirection: 'row'
            }
          }}>
            {/* Map Section */}
            <div style={{ 
              ...mapContainerStyle,
              flex: showAIChat ? '1' : '1', 
              height: '600px',
              minHeight: '500px'
            }}>
              {useMapbox ? (
                <MapboxMap
                  locations={[
                    ...locations.map(loc => ({
                      id: loc.id,
                      name: loc.name,
                      latitude: loc.latitude || loc.coordinates?.coordinates?.[1] || 35.6895,
                      longitude: loc.longitude || loc.coordinates?.coordinates?.[0] || 139.6917,
                      location_type: loc.location_type,
                      address: loc.address
                    })),
                    ...candidateMarkers.map(candidate => ({
                      id: candidate.id,
                      name: candidate.name || `Optimized Site ${candidate.storeNumber || ''}`,
                      latitude: candidate.lat,
                      longitude: candidate.lng,
                      location_type: 'candidate',
                      address: candidate.address || 'Optimized Location'
                    }))
                  ]}
                  onLocationSelect={(location) => {
                    setSelectedLocation(location);
                    setMessage(`Selected: ${location.name}`);
                  }}
                  onMapClick={(coordinates) => {
                    console.log('Map clicked at:', coordinates);
                    setMessage(`Clicked at: ${coordinates[1].toFixed(4)}, ${coordinates[0].toFixed(4)}`);
                  }}
                  showDemandGrid={showDemandGrid}
                  gridBounds={gridBounds}
                  meshSize={meshSize}
                  catchmentRadius={catchmentRadius}
                  onDemandAnalysis={handleDemandAnalysis}
                />
              ) : (
                <LeafletMap
                  locations={locations.map(loc => ({
                    id: loc.id,
                    name: loc.name,
                    latitude: loc.latitude || loc.coordinates?.coordinates?.[1] || 35.6895,
                    longitude: loc.longitude || loc.coordinates?.coordinates?.[0] || 139.6917,
                    location_type: loc.location_type,
                    address: loc.address
                  }))}
                  onLocationSelect={(location) => {
                    setSelectedLocation(location);
                    setMessage(`Selected: ${location.name}`);
                  }}
                  onMapClick={(coordinates) => {
                    console.log('Map clicked at:', coordinates);
                    setMessage(`Clicked at: ${coordinates[1].toFixed(4)}, ${coordinates[0].toFixed(4)}`);
                  }}
                  showDemandGrid={showDemandGrid}
                  gridBounds={gridBounds}
                  meshSize={meshSize}
                  catchmentRadius={catchmentRadius}
                  onDemandAnalysis={handleDemandAnalysis}
                />
              )}
            </div>

            {/* AI Chat Section */}
            {showAIChat && (
              <div style={{ 
                ...mapContainerStyle,
                flex: '1',
                maxWidth: '500px',
                height: '600px',
                minHeight: '500px'
              }}>
                <AIAnalysisChat
                  project={selectedProject}
                  locations={locations}
                  onLocationHighlight={(locationIds) => {
                    setMessage(`Highlighting locations: ${locationIds.join(', ')}`);
                  }}
                  onRecommendationSelect={(recommendation) => {
                    setMessage(`AI Recommendation: ${recommendation}`);
                  }}
                />
              </div>
            )}
          </div>

          {/* Store Optimization Panel */}
          {showOptimization && (
            <div style={{ 
              ...formStyle,
              marginTop: theme.spacing[5]
            }}>
              {!demandDataReady && (
                <div style={{
                  backgroundColor: '#fef3c7',
                  border: '1px solid #f59e0b',
                  borderRadius: '6px',
                  padding: '12px 16px',
                  marginBottom: '16px',
                  fontSize: '14px',
                  color: '#92400e'
                }}>
                  ⚠️ <strong>Population Grid Required:</strong> Please enable the Population Grid (📊 button) before running optimization. The optimizer needs demand data to calculate optimal store locations.
                </div>
              )}
              <OptimizationPanel
                demandMeshes={demandMeshesRef.current} // Use ref data
                existingStores={locations.filter(loc => loc.location_type === 'store')}
                competitors={locations.filter(loc => loc.location_type === 'competitor')}
                bounds={getCurrentMapBounds()}
                onOptimizationComplete={handleOptimizationComplete}
                onShowCandidates={handleShowCandidates}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;