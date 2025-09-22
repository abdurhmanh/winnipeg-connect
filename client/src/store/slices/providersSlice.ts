import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { providersAPI } from '../../services/api';

export interface Provider {
  _id: string;
  firstName: string;
  lastName: string;
  avatar?: {
    url: string;
    publicId: string;
  };
  bio: string;
  categories: string[];
  skills: string[];
  rates: {
    hourly?: number;
    fixed?: {
      min: number;
      max: number;
    };
  };
  portfolio: Array<{
    url: string;
    description: string;
    category: string;
    publicId: string;
  }>;
  rating: {
    average: number;
    count: number;
  };
  location: {
    coordinates: [number, number];
  };
  address: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
    suburb: string;
  };
  availability: {
    schedule: {
      [key: string]: {
        available: boolean;
        hours: string;
      };
    };
    unavailableDates: string[];
  };
  certifications: Array<{
    name: string;
    issuer: string;
    dateIssued: string;
    expiryDate?: string;
    documentUrl?: string;
  }>;
  isActive: boolean;
  lastActive: string;
  distance?: number;
}

interface ProviderFilters {
  category?: string;
  minRating?: number;
  location?: {
    lat: number;
    lng: number;
    radius: number;
  };
  search?: string;
  sort?: string;
}

interface ProvidersState {
  providers: Provider[];
  currentProvider: Provider | null;
  filters: ProviderFilters;
  pagination: {
    current: number;
    pages: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  isLoading: boolean;
  error: string | null;
}

const initialState: ProvidersState = {
  providers: [],
  currentProvider: null,
  filters: {},
  pagination: {
    current: 1,
    pages: 1,
    total: 0,
    hasNext: false,
    hasPrev: false,
  },
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchProviders = createAsyncThunk(
  'providers/fetchProviders',
  async (params: { 
    page?: number; 
    limit?: number; 
    filters?: ProviderFilters 
  }, { rejectWithValue }) => {
    try {
      const response = await providersAPI.getProviders(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch providers');
    }
  }
);

export const fetchProviderById = createAsyncThunk(
  'providers/fetchProviderById',
  async (providerId: string, { rejectWithValue }) => {
    try {
      const response = await providersAPI.getProviderById(providerId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch provider');
    }
  }
);

export const searchProviders = createAsyncThunk(
  'providers/searchProviders',
  async (params: {
    query: string;
    category?: string;
    location?: { lat: number; lng: number; radius?: number };
    page?: number;
    limit?: number;
  }, { rejectWithValue }) => {
    try {
      const response = await providersAPI.searchProviders(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to search providers');
    }
  }
);

const providersSlice = createSlice({
  name: 'providers',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    clearCurrentProvider: (state) => {
      state.currentProvider = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch providers
    builder
      .addCase(fetchProviders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProviders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.providers = action.payload.providers;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(fetchProviders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch provider by ID
    builder
      .addCase(fetchProviderById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProviderById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentProvider = action.payload.provider;
        state.error = null;
      })
      .addCase(fetchProviderById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Search providers
    builder
      .addCase(searchProviders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(searchProviders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.providers = action.payload.providers;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(searchProviders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setFilters, clearFilters, clearCurrentProvider, clearError } = providersSlice.actions;
export default providersSlice.reducer;
