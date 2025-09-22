import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { categoriesAPI } from '../../services/api';

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  parentCategory?: {
    _id: string;
    name: string;
    slug: string;
  };
  subcategories?: Array<{
    _id: string;
    name: string;
    slug: string;
    description: string;
    icon: string;
  }>;
  isActive: boolean;
  order: number;
  isWinnipegSpecific: boolean;
  seasonalAvailability: {
    spring: boolean;
    summer: boolean;
    fall: boolean;
    winter: boolean;
  };
  children?: Category[];
}

interface CategoriesState {
  categories: Category[];
  categoryTree: Category[];
  popularCategories: Category[];
  winnipegCategories: Category[];
  isLoading: boolean;
  error: string | null;
}

const initialState: CategoriesState = {
  categories: [],
  categoryTree: [],
  popularCategories: [],
  winnipegCategories: [],
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchCategories = createAsyncThunk(
  'categories/fetchCategories',
  async (params: { parent?: string; search?: string; season?: string } = {}, { rejectWithValue }) => {
    try {
      const response = await categoriesAPI.getCategories(params);
      return response.categories;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch categories');
    }
  }
);

export const fetchCategoryTree = createAsyncThunk(
  'categories/fetchCategoryTree',
  async (_, { rejectWithValue }) => {
    try {
      const response = await categoriesAPI.getCategoryTree();
      return response.categories;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch category tree');
    }
  }
);

export const fetchPopularCategories = createAsyncThunk(
  'categories/fetchPopularCategories',
  async (limit?: number, { rejectWithValue }) => {
    try {
      const response = await categoriesAPI.getPopularCategories(limit);
      return response.categories;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch popular categories');
    }
  }
);

export const fetchWinnipegCategories = createAsyncThunk(
  'categories/fetchWinnipegCategories',
  async (season?: string, { rejectWithValue }) => {
    try {
      const response = await categoriesAPI.getWinnipegCategories(season);
      return response.categories;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch Winnipeg categories');
    }
  }
);

export const searchCategories = createAsyncThunk(
  'categories/searchCategories',
  async (query: string, { rejectWithValue }) => {
    try {
      const response = await categoriesAPI.searchCategories(query);
      return response.categories;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to search categories');
    }
  }
);

const categoriesSlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch categories
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.isLoading = false;
        state.categories = action.payload;
        state.error = null;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch category tree
    builder
      .addCase(fetchCategoryTree.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCategoryTree.fulfilled, (state, action) => {
        state.isLoading = false;
        state.categoryTree = action.payload;
        state.error = null;
      })
      .addCase(fetchCategoryTree.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch popular categories
    builder
      .addCase(fetchPopularCategories.fulfilled, (state, action) => {
        state.popularCategories = action.payload;
      });

    // Fetch Winnipeg categories
    builder
      .addCase(fetchWinnipegCategories.fulfilled, (state, action) => {
        state.winnipegCategories = action.payload;
      });

    // Search categories
    builder
      .addCase(searchCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
      });
  },
});

export const { clearError } = categoriesSlice.actions;
export default categoriesSlice.reducer;
