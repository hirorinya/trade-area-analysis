import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface MapState {
  viewport: {
    longitude: number;
    latitude: number;
    zoom: number;
  };
  selectedLocation: string | null;
  isLoading: boolean;
  showTradeAreas: boolean;
  showCompetitors: boolean;
  showDemographics: boolean;
}

const initialState: MapState = {
  viewport: {
    longitude: -74.006,
    latitude: 40.7128,
    zoom: 11,
  },
  selectedLocation: null,
  isLoading: false,
  showTradeAreas: true,
  showCompetitors: true,
  showDemographics: false,
};

const mapSlice = createSlice({
  name: 'map',
  initialState,
  reducers: {
    setViewport: (state, action: PayloadAction<{ longitude: number; latitude: number; zoom: number }>) => {
      state.viewport = action.payload;
    },
    setSelectedLocation: (state, action: PayloadAction<string | null>) => {
      state.selectedLocation = action.payload;
    },
    toggleTradeAreas: (state) => {
      state.showTradeAreas = !state.showTradeAreas;
    },
    toggleCompetitors: (state) => {
      state.showCompetitors = !state.showCompetitors;
    },
    toggleDemographics: (state) => {
      state.showDemographics = !state.showDemographics;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const {
  setViewport,
  setSelectedLocation,
  toggleTradeAreas,
  toggleCompetitors,
  toggleDemographics,
  setLoading,
} = mapSlice.actions;

export default mapSlice.reducer;