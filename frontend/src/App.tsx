import React, { useState, useEffect } from 'react';
import L from 'leaflet';
import * as turf from '@turf/turf';
import 'leaflet/dist/leaflet.css';
import { auth, db } from './lib/supabase';

function App() {
  // Debug environment variables
  useEffect(() => {
    console.log('=== Environment Variables Debug ===');
    console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
    console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
    console.log('Mode:', import.meta.env.MODE);
    console.log('All env vars:', Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')));
  }, []);

  const [currentView, setCurrentView] = useState('login');
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
  const [optimizationResults, setOptimizationResults] = useState(null);
  const [competitorAnalysis, setCompetitorAnalysis] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [showHelp, setShowHelp] = useState(false);

  // API calls
  const apiCall = async (endpoint, options = {}) => {
    try {
      const response = await fetch(`http://localhost:8000/api${endpoint}`, {
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

  // Authentication
  const handleLogin = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
      const { data, error } = await auth.signIn(
        formData.get('email'),
        formData.get('password')
      );
      
      if (error) {
        throw new Error(error.message);
      }
      
      setToken(data.session?.access_token);
      setUser(data.user);
      setMessage('Login successful!');
      setCurrentView('dashboard');
      loadProjects();
    } catch (error) {
      // Error already handled in apiCall
    }
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
      setCurrentView('dashboard');
      loadProjects();
    } catch (error) {
      setMessage(`Registration error: ${error.message}`);
    }
  };

  // Projects
  const loadProjects = async () => {
    try {
      if (!user?.id) return;
      const { data, error } = await db.getProjects(user.id);
      if (error) {
        throw new Error(error.message);
      }
      setProjects(data || []);
    } catch (error) {
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
      loadLocations(selectedProject.id);
      updateMapMarkers();
    } catch (error) {
      setMessage(`Error creating location: ${error.message}`);
    }
  };

  // Enhanced Geocoding with 国土地理院 API
  const geocodeAddress = async (address) => {
    try {
      setMessage('🔍 Searching address...');
      
      // Using 国土地理院 geocoding service
      const response = await fetch(`https://msearch.gsi.go.jp/address-search/AddressSearch?q=${encodeURIComponent(address)}`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        const coordinates = {
          latitude: parseFloat(result.geometry.coordinates[1]),
          longitude: parseFloat(result.geometry.coordinates[0])
        };
        
        setMessage(`✅ Address found: ${result.properties.title || address}`);
        return coordinates;
      }
      throw new Error('Address not found in 国土地理院 database');
    } catch (error) {
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
  const handleAddressGeocoding = async (address) => {
    if (!address || address.length < 3) return;
    
    const coords = await geocodeAddress(address);
    if (coords) {
      // Auto-fill the latitude and longitude fields
      const latInput = document.querySelector('input[name="latitude"]');
      const lngInput = document.querySelector('input[name="longitude"]');
      
      if (latInput && lngInput) {
        latInput.value = coords.latitude.toString();
        lngInput.value = coords.longitude.toString();
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

  // CSV Import Functionality
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
      const requiredHeaders = ['name', 'latitude', 'longitude', 'type'];
      
      const missingHeaders = requiredHeaders.filter(req => 
        !headers.some(h => h.includes(req))
      );

      if (missingHeaders.length > 0) {
        setMessage(`❌ Missing required columns: ${missingHeaders.join(', ')}. Required: name, latitude, longitude, type`);
        return;
      }

      // Find column indices
      const nameIndex = headers.findIndex(h => h.includes('name'));
      const latIndex = headers.findIndex(h => h.includes('latitude') || h.includes('lat'));
      const lngIndex = headers.findIndex(h => h.includes('longitude') || h.includes('lng') || h.includes('lon'));
      const typeIndex = headers.findIndex(h => h.includes('type'));
      const addressIndex = headers.findIndex(h => h.includes('address'));

      let successCount = 0;
      let errorCount = 0;

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        
        if (values.length < requiredHeaders.length) continue;

        const name = values[nameIndex];
        const latitude = parseFloat(values[latIndex]);
        const longitude = parseFloat(values[lngIndex]);
        const locationType = values[typeIndex].toLowerCase();
        const address = addressIndex >= 0 ? values[addressIndex] : '';

        // Validate data
        if (!name || isNaN(latitude) || isNaN(longitude)) {
          errorCount++;
          continue;
        }

        if (!['store', 'competitor', 'poi'].includes(locationType)) {
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
            location_type: locationType
          });
          
          if (error) {
            throw new Error(error.message);
          }
          
          successCount++;
        } catch (error) {
          errorCount++;
        }
      }

      setMessage(`✅ CSV Import complete! ${successCount} locations added, ${errorCount} errors`);
      loadLocations(selectedProject.id);
      updateMapMarkers();
      
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
  const initializeMap = () => {
    if (map) return;
    
    const mapInstance = L.map('map').setView([35.6762, 139.6503], 10); // Tokyo center
    
    // 国土地理院 base map
    L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.gsi.go.jp/">国土地理院</a>',
      maxZoom: 18
    }).addTo(mapInstance);
    
    setMap(mapInstance);
    return mapInstance;
  };

  const updateMapMarkers = () => {
    if (!map) return;
    
    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });
    
    // Add location markers
    locations.forEach(location => {
      const icon = location.location_type === 'store' ? '🏪' : 
                   location.location_type === 'competitor' ? '🏢' : '📍';
      
      const marker = L.marker([location.coordinates.coordinates[1], location.coordinates.coordinates[0]])
        .addTo(map)
        .bindPopup(`${icon} ${location.name}<br/>${location.address || ''}<br/><small>${location.location_type}</small>`);
    });
  };

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
    setCurrentView('login');
    setMessage('Logged out successfully');
  };

  // Styles
  const containerStyle = { padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto' };
  const formStyle = { backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '5px', marginBottom: '20px' };
  const inputStyle = { width: '100%', padding: '8px', margin: '5px 0', borderRadius: '3px', border: '1px solid #ccc' };
  const buttonStyle = { backgroundColor: '#007bff', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '3px', cursor: 'pointer', margin: '5px' };
  const projectStyle = { backgroundColor: '#f0f0f0', padding: '15px', borderRadius: '5px', marginBottom: '10px' };

  // Effects
  useEffect(() => {
    if (token) {
      auth.getUser()
        .then(({ user, error }) => {
          if (error) {
            throw new Error(error.message);
          }
          setUser(user);
          setCurrentView('dashboard');
          loadProjects();
        })
        .catch(() => {
          setToken(null);
        });
    }
  }, []); // Keep empty dependency to run only once on mount

  // Load projects when user is set and we're on dashboard
  useEffect(() => {
    if (user && currentView === 'dashboard') {
      loadProjects();
    }
  }, [user, currentView]);

  useEffect(() => {
    if (currentView === 'map') {
      setTimeout(() => {
        initializeMap();
      }, 100);
    }
  }, [currentView]);

  useEffect(() => {
    if (map && locations.length > 0) {
      updateMapMarkers();
    }
  }, [map, locations]);

  useEffect(() => {
    if (map && tradeAreas.length > 0) {
      updateMapTradeAreas(tradeAreas);
    }
  }, [map, tradeAreas]);

  return (
    <div style={containerStyle}>
      <h1>Trade Area Analysis - MVP</h1>
      
      {message && (
        <div style={{ padding: '10px', backgroundColor: message.includes('Error') ? '#ffe6e6' : '#e6ffe6', borderRadius: '3px', marginBottom: '20px' }}>
          {message}
          <button onClick={() => setMessage('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
        </div>
      )}

      {currentView === 'login' && (
        <div>
          <div style={formStyle}>
            <h2>Login</h2>
            <form onSubmit={handleLogin}>
              <input type="email" name="email" placeholder="Email" required style={inputStyle} />
              <input type="password" name="password" placeholder="Password" required style={inputStyle} />
              <button type="submit" style={buttonStyle}>Login</button>
            </form>
          </div>
          
          <div style={formStyle}>
            <h2>Register New Account</h2>
            <form onSubmit={handleRegister}>
              <input type="text" name="firstName" placeholder="First Name" style={inputStyle} />
              <input type="text" name="lastName" placeholder="Last Name" style={inputStyle} />
              <input type="email" name="email" placeholder="Email" required style={inputStyle} />
              <input type="password" name="password" placeholder="Password (min 8 chars)" required style={inputStyle} />
              <button type="submit" style={buttonStyle}>Register</button>
            </form>
          </div>
        </div>
      )}

      {currentView === 'dashboard' && user && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>Welcome, {user.first_name || user.email}!</h2>
            <button onClick={logout} style={buttonStyle}>Logout</button>
          </div>

          <div style={formStyle}>
            <h3>Create New Project</h3>
            <form onSubmit={createProject}>
              <input type="text" name="name" placeholder="Project Name" required style={inputStyle} />
              <textarea name="description" placeholder="Project Description (optional)" style={inputStyle} rows="3"></textarea>
              <button type="submit" style={buttonStyle}>Create Project</button>
            </form>
          </div>

          <div>
            <h3>Your Projects ({projects.length})</h3>
            {projects.length === 0 ? (
              <p>No projects yet. Create your first project above!</p>
            ) : (
              projects.map(project => (
                <div key={project.id} style={projectStyle}>
                  <h4 style={{ margin: '0 0 8px 0' }}>{project.name}</h4>
                  {project.description && (
                    <p style={{ margin: '0 0 8px 0', color: '#666' }}>{project.description}</p>
                  )}
                  <div style={{ fontSize: '12px', color: '#888', marginBottom: '12px' }}>
                    Created: {new Date(project.created_at).toLocaleDateString()}
                  </div>
                  <button 
                    onClick={() => {
                      setSelectedProject(project);
                      setCurrentView('map');
                      loadLocations(project.id);
                    }}
                    style={{
                      ...buttonStyle,
                      width: '100%',
                      backgroundColor: '#28a745',
                      fontSize: '14px'
                    }}
                  >
                    🗾 Open Map & Locations
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {currentView === 'map' && selectedProject && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>📍 {selectedProject.name} - Locations & Map</h2>
            <div>
              <button onClick={() => setCurrentView('dashboard')} style={buttonStyle}>
                ← Back to Dashboard
              </button>
              <button onClick={logout} style={buttonStyle}>Logout</button>
            </div>
          </div>

          {/* Professional Analytics Dashboard */}
          <div style={formStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3>📊 Analytics Dashboard</h3>
              <div>
                <button 
                  onClick={() => setShowHelp(!showHelp)}
                  style={{
                    ...buttonStyle,
                    backgroundColor: '#17a2b8',
                    fontSize: '12px',
                    padding: '8px 12px',
                    marginRight: '10px'
                  }}
                >
                  📚 How to Use
                </button>
                <button 
                  onClick={generateDashboard}
                  style={{
                    ...buttonStyle,
                    backgroundColor: '#28a745',
                    fontSize: '14px'
                  }}
                >
                  📈 Generate Dashboard
                </button>
              </div>
            </div>

            {/* CSV Import Section */}
            <div style={{ 
              backgroundColor: '#e7f3ff', 
              padding: '15px', 
              borderRadius: '5px', 
              marginBottom: '15px' 
            }}>
              <div style={{ marginBottom: '10px', fontSize: '14px', fontWeight: 'bold' }}>
                📁 Bulk Import Locations (CSV)
              </div>
              <div style={{ marginBottom: '10px', fontSize: '12px', color: '#666' }}>
                Required columns: name, latitude, longitude, type (store/competitor/poi)<br/>
                Optional: address
              </div>
              <input 
                type="file" 
                accept=".csv"
                onChange={handleCSVImport}
                style={{ marginBottom: '5px' }}
              />
              <div style={{ fontSize: '11px', color: '#888' }}>
                Example CSV: "Shibuya Store,35.6580,139.7016,store,Tokyo Shibuya"
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
                    ...buttonStyle,
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
                      1. <strong>Add Locations:</strong> Use the form below or import CSV to add stores, competitors, and points of interest<br/>
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
                      • <strong>CSV Import:</strong> Upload CSV file with columns: name, latitude, longitude, type, address (optional)
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
                    • Import large datasets via CSV for efficiency / 効率のためCSV経由で大規模データセットをインポート<br/>
                    • Compare Radius vs Huff Model for accuracy / 精度のため半径とハフモデルを比較<br/>
                    • Generate dashboard regularly for portfolio monitoring / ポートフォリオ監視のため定期的にダッシュボードを生成
                  </div>
                </div>

                <button 
                  onClick={() => setShowHelp(false)}
                  style={{
                    ...buttonStyle,
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            {/* Add Location Form */}
            <div style={formStyle}>
              <h3>Add New Location</h3>
              <form onSubmit={createLocation}>
                <input 
                  type="text" 
                  name="locationName" 
                  placeholder="Location Name (e.g., 新宿店)" 
                  required 
                  style={inputStyle} 
                />
                
                {/* Enhanced Address Input with Geocoding */}
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    name="address" 
                    placeholder="Address (e.g., 東京都新宿区新宿3-1-1)" 
                    style={inputStyle}
                    onBlur={(e) => {
                      const address = e.target.value;
                      if (address && address.length > 5) {
                        // Auto-geocode when user finishes typing address
                        handleAddressGeocoding(address);
                      }
                    }}
                  />
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      const addressInput = e.target.previousElementSibling;
                      if (addressInput.value) {
                        handleAddressGeocoding(addressInput.value);
                      } else {
                        setMessage('Please enter an address first');
                      }
                    }}
                    style={{
                      position: 'absolute',
                      right: '5px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      padding: '5px 8px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                    title="Get coordinates from address"
                  >
                    🔍
                  </button>
                </div>

                {/* Enhanced Coordinate Inputs with Reverse Geocoding */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px', alignItems: 'end' }}>
                  <input 
                    type="number" 
                    name="latitude" 
                    placeholder="Latitude (緯度)" 
                    step="any" 
                    required 
                    style={inputStyle}
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
                    style={inputStyle}
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
                  <button 
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
                    style={{
                      ...buttonStyle,
                      fontSize: '12px',
                      padding: '8px 12px',
                      backgroundColor: '#28a745'
                    }}
                    title="Get address from coordinates"
                  >
                    📍→📫
                  </button>
                </div>

                <select name="locationType" required style={inputStyle}>
                  <option value="">Select Type</option>
                  <option value="store">🏪 Store (店舗)</option>
                  <option value="competitor">🏢 Competitor (競合)</option>
                  <option value="poi">📍 Point of Interest</option>
                </select>
                <button type="submit" style={buttonStyle}>Add Location</button>
              </form>
              
              <div style={{ marginTop: '15px', padding: '12px', backgroundColor: '#e8f5e8', borderRadius: '5px' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#2d5016' }}>
                  🗾 国土地理院 Geocoding Features:
                </div>
                <div style={{ fontSize: '12px', color: '#2d5016' }}>
                  • <strong>Address → Coordinates:</strong> Type address and click 🔍 or press Tab<br/>
                  • <strong>Coordinates → Address:</strong> Enter lat/lng and click 📍→📫<br/>
                  • <strong>Auto-geocoding:</strong> Automatically triggers when typing complete addresses<br/>
                  • <strong>Example:</strong> 東京都新宿区新宿3-1-1 → 35.6895, 139.7006
                </div>
              </div>
            </div>

            {/* Locations List */}
            <div style={formStyle}>
              <h3>Locations ({locations.length})</h3>
              {locations.length === 0 ? (
                <p>No locations yet. Add your first location!</p>
              ) : (
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {locations.map(location => (
                    <div key={location.id} style={{ 
                      padding: '10px', 
                      backgroundColor: '#f8f9fa', 
                      borderRadius: '3px', 
                      marginBottom: '5px',
                      fontSize: '14px'
                    }}>
                      <div style={{ fontWeight: 'bold' }}>
                        {location.location_type === 'store' ? '🏪' : 
                         location.location_type === 'competitor' ? '🏢' : '📍'} {location.name}
                      </div>
                      {location.address && <div style={{ color: '#666' }}>{location.address}</div>}
                      <div style={{ fontSize: '12px', color: '#888' }}>
                        {location.coordinates.coordinates[1].toFixed(4)}, {location.coordinates.coordinates[0].toFixed(4)}
                      </div>
                      <button 
                        onClick={() => setSelectedLocation(location)}
                        style={{
                          ...buttonStyle,
                          fontSize: '12px',
                          padding: '5px 10px',
                          marginTop: '5px',
                          backgroundColor: '#17a2b8'
                        }}
                      >
                        📊 Create Trade Area
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Map */}
          <div style={formStyle}>
            <h3>🗾 Map (国土地理院)</h3>
            <div 
              id="map" 
              style={{ 
                height: '500px', 
                width: '100%', 
                border: '1px solid #ddd', 
                borderRadius: '5px' 
              }}
            />
            <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
              Map data © <a href="https://www.gsi.go.jp/" target="_blank" rel="noopener">国土地理院</a>
            </div>
          </div>

          {/* Trade Area Creation Form */}
          {selectedLocation && (
            <div style={formStyle}>
              <h3>📊 Advanced Trade Area Analysis for {selectedLocation.name}</h3>
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
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Analysis Type:
                  </label>
                  <select name="analysisType" required style={inputStyle}>
                    <option value="radius">📏 Simple Radius (Basic)</option>
                    <option value="huff">🎯 Huff Model (Advanced - needs multiple locations)</option>
                  </select>
                  <small style={{ color: '#666', fontSize: '12px' }}>
                    Huff Model uses competitor locations for realistic market capture analysis
                  </small>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                  <input 
                    type="text" 
                    name="tradeAreaName" 
                    placeholder="Trade Area Name (optional)"
                    style={inputStyle} 
                  />
                  <select name="radius" style={inputStyle}>
                    <option value="">Auto-size for Huff Model</option>
                    <option value="0.5">500m radius</option>
                    <option value="1">1km radius</option>
                    <option value="2">2km radius</option>
                    <option value="3">3km radius</option>
                    <option value="5">5km radius</option>
                    <option value="10">10km radius</option>
                  </select>
                </div>

                <div style={{ 
                  backgroundColor: '#e3f2fd', 
                  padding: '10px', 
                  borderRadius: '5px', 
                  marginBottom: '15px',
                  fontSize: '13px'
                }}>
                  <strong>💡 Analysis Methods:</strong><br/>
                  • <strong>Simple Radius:</strong> Traditional circular trade area<br/>
                  • <strong>Huff Model:</strong> Scientific customer capture probability based on distance decay and competitor locations
                </div>

                <div style={{ marginTop: '10px' }}>
                  <button type="submit" style={buttonStyle}>
                    {locations.length > 1 ? '🎯 Run Analysis' : '📏 Create Trade Area'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setSelectedLocation(null)}
                    style={{...buttonStyle, backgroundColor: '#6c757d'}}
                  >
                    Cancel
                  </button>
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
                    ...buttonStyle,
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
                    ...buttonStyle,
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
                      ...buttonStyle,
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
                    ...buttonStyle,
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
                    ...buttonStyle,
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
                      ...buttonStyle,
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
              <h3>🎯 Trade Areas ({tradeAreas.length})</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '10px' }}>
                {tradeAreas.map((tradeArea, index) => {
                  const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'];
                  const color = colors[index % colors.length];
                  return (
                    <div key={tradeArea.id} style={{ 
                      padding: '15px', 
                      backgroundColor: '#fff', 
                      border: `2px solid ${color}`,
                      borderRadius: '8px',
                      position: 'relative'
                    }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                        {tradeArea.name}
                      </div>
                      <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
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
                      <button 
                        onClick={() => deleteTradeArea(tradeArea.id)}
                        style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          padding: '5px 8px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;