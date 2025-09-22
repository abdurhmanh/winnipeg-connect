import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
}

interface UIState {
  notifications: Notification[];
  isDrawerOpen: boolean;
  isLoading: boolean;
  loadingMessage: string;
  searchQuery: string;
  currentLocation: {
    lat: number;
    lng: number;
    address?: string;
  } | null;
  theme: 'light' | 'dark';
  filters: {
    [key: string]: any;
  };
}

const initialState: UIState = {
  notifications: [],
  isDrawerOpen: false,
  isLoading: false,
  loadingMessage: '',
  searchQuery: '',
  currentLocation: null,
  theme: 'light',
  filters: {},
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Notifications
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id'>>) => {
      const notification: Notification = {
        id: Date.now().toString(),
        duration: 5000,
        ...action.payload,
      };
      state.notifications.push(notification);
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },

    // Drawer
    toggleDrawer: (state) => {
      state.isDrawerOpen = !state.isDrawerOpen;
    },
    openDrawer: (state) => {
      state.isDrawerOpen = true;
    },
    closeDrawer: (state) => {
      state.isDrawerOpen = false;
    },

    // Loading
    setLoading: (state, action: PayloadAction<{ isLoading: boolean; message?: string }>) => {
      state.isLoading = action.payload.isLoading;
      state.loadingMessage = action.payload.message || '';
    },

    // Search
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    clearSearchQuery: (state) => {
      state.searchQuery = '';
    },

    // Location
    setCurrentLocation: (state, action: PayloadAction<{
      lat: number;
      lng: number;
      address?: string;
    }>) => {
      state.currentLocation = action.payload;
    },
    clearCurrentLocation: (state) => {
      state.currentLocation = null;
    },

    // Theme
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
      localStorage.setItem('theme', action.payload);
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', state.theme);
    },

    // Filters
    setFilter: (state, action: PayloadAction<{ key: string; value: any }>) => {
      state.filters[action.payload.key] = action.payload.value;
    },
    clearFilter: (state, action: PayloadAction<string>) => {
      delete state.filters[action.payload];
    },
    clearAllFilters: (state) => {
      state.filters = {};
    },
  },
});

export const {
  addNotification,
  removeNotification,
  clearNotifications,
  toggleDrawer,
  openDrawer,
  closeDrawer,
  setLoading,
  setSearchQuery,
  clearSearchQuery,
  setCurrentLocation,
  clearCurrentLocation,
  setTheme,
  toggleTheme,
  setFilter,
  clearFilter,
  clearAllFilters,
} = uiSlice.actions;

export default uiSlice.reducer;

// Notification helper functions
export const showSuccessNotification = (title: string, message?: string) => 
  addNotification({ type: 'success', title, message });

export const showErrorNotification = (title: string, message?: string) => 
  addNotification({ type: 'error', title, message });

export const showWarningNotification = (title: string, message?: string) => 
  addNotification({ type: 'warning', title, message });

export const showInfoNotification = (title: string, message?: string) => 
  addNotification({ type: 'info', title, message });
