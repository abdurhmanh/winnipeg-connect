import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { quotesAPI } from '../../services/api';

export interface Quote {
  _id: string;
  job: {
    _id: string;
    title: string;
    category: string;
    status: string;
  };
  provider: {
    _id: string;
    firstName: string;
    lastName: string;
    avatar?: { url: string };
    rating: { average: number; count: number };
    categories: string[];
  };
  seeker: {
    _id: string;
    firstName: string;
    lastName: string;
    avatar?: { url: string };
  };
  price: {
    amount: number;
    type: 'fixed' | 'hourly';
    breakdown?: Array<{
      item: string;
      cost: number;
      description: string;
    }>;
  };
  estimatedDuration: {
    value: number;
    unit: 'hours' | 'days' | 'weeks' | 'months';
  };
  startDate?: string;
  completionDate?: string;
  message: string;
  includesSupplies: boolean;
  supplyDetails?: string;
  warranty: {
    offered: boolean;
    duration?: string;
    details?: string;
  };
  availability: {
    immediate: boolean;
    startDate?: string;
    notes?: string;
  };
  terms?: string;
  paymentTerms?: {
    deposit: {
      required: boolean;
      percentage?: number;
      amount?: number;
    };
    milestones?: Array<{
      description: string;
      percentage: number;
      amount: number;
    }>;
  };
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn' | 'expired';
  viewedBySeeker: boolean;
  viewedAt?: string;
  respondedAt?: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

interface QuotesState {
  quotes: Quote[];
  myQuotes: Quote[];
  jobQuotes: Quote[];
  currentQuote: Quote | null;
  stats: {
    total: number;
    pending: number;
    accepted: number;
    rejected: number;
    acceptanceRate: string;
    averageQuoteValue: string;
  };
  isLoading: boolean;
  error: string | null;
}

const initialState: QuotesState = {
  quotes: [],
  myQuotes: [],
  jobQuotes: [],
  currentQuote: null,
  stats: {
    total: 0,
    pending: 0,
    accepted: 0,
    rejected: 0,
    acceptanceRate: '0',
    averageQuoteValue: '0',
  },
  isLoading: false,
  error: null,
};

// Async thunks
export const createQuote = createAsyncThunk(
  'quotes/createQuote',
  async (quoteData: Partial<Quote>, { rejectWithValue }) => {
    try {
      const response = await quotesAPI.createQuote(quoteData);
      return response.quote;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create quote');
    }
  }
);

export const fetchMyQuotes = createAsyncThunk(
  'quotes/fetchMyQuotes',
  async (params: { page?: number; limit?: number; status?: string }, { rejectWithValue }) => {
    try {
      const response = await quotesAPI.getMyQuotes(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch quotes');
    }
  }
);

export const fetchJobQuotes = createAsyncThunk(
  'quotes/fetchJobQuotes',
  async (jobId: string, { rejectWithValue }) => {
    try {
      const response = await quotesAPI.getJobQuotes(jobId);
      return response.quotes;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch job quotes');
    }
  }
);

export const fetchQuoteById = createAsyncThunk(
  'quotes/fetchQuoteById',
  async (quoteId: string, { rejectWithValue }) => {
    try {
      const response = await quotesAPI.getQuoteById(quoteId);
      return response.quote;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch quote');
    }
  }
);

export const updateQuote = createAsyncThunk(
  'quotes/updateQuote',
  async ({ quoteId, quoteData }: { quoteId: string; quoteData: Partial<Quote> }, { rejectWithValue }) => {
    try {
      const response = await quotesAPI.updateQuote(quoteId, quoteData);
      return response.quote;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update quote');
    }
  }
);

export const acceptQuote = createAsyncThunk(
  'quotes/acceptQuote',
  async (quoteId: string, { rejectWithValue }) => {
    try {
      const response = await quotesAPI.acceptQuote(quoteId);
      return response.quote;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to accept quote');
    }
  }
);

export const rejectQuote = createAsyncThunk(
  'quotes/rejectQuote',
  async ({ quoteId, reason }: { quoteId: string; reason?: string }, { rejectWithValue }) => {
    try {
      const response = await quotesAPI.rejectQuote(quoteId, reason);
      return response.quote;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reject quote');
    }
  }
);

export const withdrawQuote = createAsyncThunk(
  'quotes/withdrawQuote',
  async (quoteId: string, { rejectWithValue }) => {
    try {
      await quotesAPI.withdrawQuote(quoteId);
      return quoteId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to withdraw quote');
    }
  }
);

export const fetchQuoteStats = createAsyncThunk(
  'quotes/fetchQuoteStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await quotesAPI.getQuoteStats();
      return response.stats;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch quote stats');
    }
  }
);

const quotesSlice = createSlice({
  name: 'quotes',
  initialState,
  reducers: {
    clearCurrentQuote: (state) => {
      state.currentQuote = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateQuoteInList: (state, action) => {
      const updatedQuote = action.payload;
      
      // Update in myQuotes
      const myQuoteIndex = state.myQuotes.findIndex(quote => quote._id === updatedQuote._id);
      if (myQuoteIndex !== -1) {
        state.myQuotes[myQuoteIndex] = updatedQuote;
      }
      
      // Update in jobQuotes
      const jobQuoteIndex = state.jobQuotes.findIndex(quote => quote._id === updatedQuote._id);
      if (jobQuoteIndex !== -1) {
        state.jobQuotes[jobQuoteIndex] = updatedQuote;
      }
      
      // Update current quote
      if (state.currentQuote && state.currentQuote._id === updatedQuote._id) {
        state.currentQuote = updatedQuote;
      }
    },
  },
  extraReducers: (builder) => {
    // Create quote
    builder
      .addCase(createQuote.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createQuote.fulfilled, (state, action) => {
        state.isLoading = false;
        state.myQuotes.unshift(action.payload);
        state.error = null;
      })
      .addCase(createQuote.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch my quotes
    builder
      .addCase(fetchMyQuotes.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMyQuotes.fulfilled, (state, action) => {
        state.isLoading = false;
        state.myQuotes = action.payload.quotes;
        state.stats = action.payload.stats;
        state.error = null;
      })
      .addCase(fetchMyQuotes.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch job quotes
    builder
      .addCase(fetchJobQuotes.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchJobQuotes.fulfilled, (state, action) => {
        state.isLoading = false;
        state.jobQuotes = action.payload;
        state.error = null;
      })
      .addCase(fetchJobQuotes.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch quote by ID
    builder
      .addCase(fetchQuoteById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchQuoteById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentQuote = action.payload;
        state.error = null;
      })
      .addCase(fetchQuoteById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update quote
    builder
      .addCase(updateQuote.fulfilled, (state, action) => {
        const updatedQuote = action.payload;
        const index = state.myQuotes.findIndex(quote => quote._id === updatedQuote._id);
        if (index !== -1) {
          state.myQuotes[index] = updatedQuote;
        }
        if (state.currentQuote && state.currentQuote._id === updatedQuote._id) {
          state.currentQuote = updatedQuote;
        }
      });

    // Accept quote
    builder
      .addCase(acceptQuote.fulfilled, (state, action) => {
        const acceptedQuote = action.payload;
        const index = state.jobQuotes.findIndex(quote => quote._id === acceptedQuote._id);
        if (index !== -1) {
          state.jobQuotes[index] = acceptedQuote;
        }
      });

    // Reject quote
    builder
      .addCase(rejectQuote.fulfilled, (state, action) => {
        const rejectedQuote = action.payload;
        const index = state.jobQuotes.findIndex(quote => quote._id === rejectedQuote._id);
        if (index !== -1) {
          state.jobQuotes[index] = rejectedQuote;
        }
      });

    // Withdraw quote
    builder
      .addCase(withdrawQuote.fulfilled, (state, action) => {
        const quoteId = action.payload;
        state.myQuotes = state.myQuotes.filter(quote => quote._id !== quoteId);
        state.jobQuotes = state.jobQuotes.filter(quote => quote._id !== quoteId);
        if (state.currentQuote && state.currentQuote._id === quoteId) {
          state.currentQuote = null;
        }
      });

    // Fetch quote stats
    builder
      .addCase(fetchQuoteStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      });
  },
});

export const { clearCurrentQuote, clearError, updateQuoteInList } = quotesSlice.actions;
export default quotesSlice.reducer;
