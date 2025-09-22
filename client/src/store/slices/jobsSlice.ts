import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { jobsAPI } from '../../services/api';

export interface Job {
  _id: string;
  title: string;
  description: string;
  category: string;
  subcategories: string[];
  postedBy: {
    _id: string;
    firstName: string;
    lastName: string;
    avatar?: { url: string };
    rating?: { average: number; count: number };
  };
  budget: {
    type: 'fixed' | 'hourly' | 'range';
    amount?: number;
    hourlyRate?: number;
    range?: { min: number; max: number };
  };
  timeline: {
    startDate?: Date;
    endDate?: Date;
    estimatedDuration?: string;
    isFlexible: boolean;
  };
  location: {
    address: {
      street: string;
      city: string;
      province: string;
      postalCode: string;
      suburb: string;
    };
    coordinates: {
      type: 'Point';
      coordinates: [number, number];
    };
    isRemote: boolean;
  };
  images?: Array<{
    url: string;
    description: string;
    publicId: string;
  }>;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  quotes: string[];
  selectedProvider?: {
    _id: string;
    firstName: string;
    lastName: string;
    avatar?: { url: string };
    rating?: { average: number; count: number };
  };
  requirements: {
    insurance?: boolean;
    license?: boolean;
    backgroundCheck?: boolean;
    minimumRating?: number;
  };
  views: number;
  saves: string[];
  createdAt: string;
  updatedAt: string;
  distance?: number;
  isSaved?: boolean;
  canApply?: boolean;
}

interface JobFilters {
  category?: string;
  minBudget?: number;
  maxBudget?: number;
  location?: {
    lat: number;
    lng: number;
    radius: number;
  };
  priority?: string;
  startDate?: string;
  search?: string;
}

interface JobsState {
  jobs: Job[];
  myJobs: Job[];
  savedJobs: Job[];
  currentJob: Job | null;
  filters: JobFilters;
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

const initialState: JobsState = {
  jobs: [],
  myJobs: [],
  savedJobs: [],
  currentJob: null,
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
export const fetchJobs = createAsyncThunk(
  'jobs/fetchJobs',
  async (params: { page?: number; limit?: number; filters?: JobFilters }, { rejectWithValue }) => {
    try {
      const response = await jobsAPI.getJobs(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch jobs');
    }
  }
);

export const fetchJobById = createAsyncThunk(
  'jobs/fetchJobById',
  async (jobId: string, { rejectWithValue }) => {
    try {
      const response = await jobsAPI.getJobById(jobId);
      return response.job;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch job');
    }
  }
);

export const createJob = createAsyncThunk(
  'jobs/createJob',
  async (jobData: Partial<Job> & { images?: File[] }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      
      // Add job data
      Object.entries(jobData).forEach(([key, value]) => {
        if (key !== 'images' && value !== undefined) {
          if (typeof value === 'object') {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, value.toString());
          }
        }
      });

      // Add images
      if (jobData.images) {
        jobData.images.forEach((image) => {
          formData.append('images', image);
        });
      }

      const response = await jobsAPI.createJob(formData);
      return response.job;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create job');
    }
  }
);

export const updateJob = createAsyncThunk(
  'jobs/updateJob',
  async ({ jobId, jobData }: { jobId: string; jobData: Partial<Job> }, { rejectWithValue }) => {
    try {
      const response = await jobsAPI.updateJob(jobId, jobData);
      return response.job;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update job');
    }
  }
);

export const deleteJob = createAsyncThunk(
  'jobs/deleteJob',
  async (jobId: string, { rejectWithValue }) => {
    try {
      await jobsAPI.deleteJob(jobId);
      return jobId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete job');
    }
  }
);

export const fetchMyJobs = createAsyncThunk(
  'jobs/fetchMyJobs',
  async (params: { page?: number; limit?: number; status?: string }, { rejectWithValue }) => {
    try {
      const response = await jobsAPI.getMyJobs(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch my jobs');
    }
  }
);

export const saveJob = createAsyncThunk(
  'jobs/saveJob',
  async (jobId: string, { rejectWithValue }) => {
    try {
      const response = await jobsAPI.saveJob(jobId);
      return { jobId, isSaved: response.isSaved };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to save job');
    }
  }
);

export const fetchSavedJobs = createAsyncThunk(
  'jobs/fetchSavedJobs',
  async (params: { page?: number; limit?: number }, { rejectWithValue }) => {
    try {
      const response = await jobsAPI.getSavedJobs(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch saved jobs');
    }
  }
);

const jobsSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<JobFilters>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    clearCurrentJob: (state) => {
      state.currentJob = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateJobInList: (state, action: PayloadAction<Job>) => {
      const updatedJob = action.payload;
      
      // Update in jobs array
      const jobIndex = state.jobs.findIndex(job => job._id === updatedJob._id);
      if (jobIndex !== -1) {
        state.jobs[jobIndex] = updatedJob;
      }
      
      // Update in myJobs array
      const myJobIndex = state.myJobs.findIndex(job => job._id === updatedJob._id);
      if (myJobIndex !== -1) {
        state.myJobs[myJobIndex] = updatedJob;
      }
      
      // Update current job if it matches
      if (state.currentJob && state.currentJob._id === updatedJob._id) {
        state.currentJob = updatedJob;
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch jobs
    builder
      .addCase(fetchJobs.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchJobs.fulfilled, (state, action) => {
        state.isLoading = false;
        state.jobs = action.payload.jobs;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(fetchJobs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch job by ID
    builder
      .addCase(fetchJobById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchJobById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentJob = action.payload;
        state.error = null;
      })
      .addCase(fetchJobById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create job
    builder
      .addCase(createJob.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createJob.fulfilled, (state, action) => {
        state.isLoading = false;
        state.myJobs.unshift(action.payload);
        state.error = null;
      })
      .addCase(createJob.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update job
    builder
      .addCase(updateJob.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateJob.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedJob = action.payload;
        
        // Update in myJobs
        const index = state.myJobs.findIndex(job => job._id === updatedJob._id);
        if (index !== -1) {
          state.myJobs[index] = updatedJob;
        }
        
        // Update current job
        if (state.currentJob && state.currentJob._id === updatedJob._id) {
          state.currentJob = updatedJob;
        }
        
        state.error = null;
      })
      .addCase(updateJob.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Delete job
    builder
      .addCase(deleteJob.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteJob.fulfilled, (state, action) => {
        state.isLoading = false;
        const jobId = action.payload;
        state.myJobs = state.myJobs.filter(job => job._id !== jobId);
        state.jobs = state.jobs.filter(job => job._id !== jobId);
        if (state.currentJob && state.currentJob._id === jobId) {
          state.currentJob = null;
        }
        state.error = null;
      })
      .addCase(deleteJob.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch my jobs
    builder
      .addCase(fetchMyJobs.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMyJobs.fulfilled, (state, action) => {
        state.isLoading = false;
        state.myJobs = action.payload.jobs;
        state.error = null;
      })
      .addCase(fetchMyJobs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Save job
    builder
      .addCase(saveJob.fulfilled, (state, action) => {
        const { jobId, isSaved } = action.payload;
        
        // Update in jobs array
        const jobIndex = state.jobs.findIndex(job => job._id === jobId);
        if (jobIndex !== -1) {
          state.jobs[jobIndex].isSaved = isSaved;
        }
        
        // Update current job
        if (state.currentJob && state.currentJob._id === jobId) {
          state.currentJob.isSaved = isSaved;
        }
      });

    // Fetch saved jobs
    builder
      .addCase(fetchSavedJobs.fulfilled, (state, action) => {
        state.savedJobs = action.payload.jobs;
      });
  },
});

export const { setFilters, clearFilters, clearCurrentJob, clearError, updateJobInList } = jobsSlice.actions;
export default jobsSlice.reducer;
