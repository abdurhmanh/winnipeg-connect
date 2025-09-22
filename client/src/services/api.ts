import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? 'https://your-api-domain.com/api' 
    : 'http://localhost:5001/api',
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),
  
  register: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: 'provider' | 'seeker';
    phone?: string;
  }) => api.post('/auth/register', userData),
  
  getCurrentUser: () => api.get('/auth/me'),
  
  updateProfile: (profileData: any) => api.put('/users/profile', profileData),
  
  uploadAvatar: (formData: FormData) => api.post('/users/upload-avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  
  verifyEmail: (token: string) => api.post('/auth/verify-email', { token }),
  
  refreshToken: () => api.post('/auth/refresh'),
  
  logout: () => api.post('/auth/logout'),
};

// Jobs API
export const jobsAPI = {
  getJobs: (params: any = {}) => api.get('/jobs', { params }),
  
  getJobById: (jobId: string) => api.get(`/jobs/${jobId}`),
  
  createJob: (jobData: any) => api.post('/jobs', jobData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  
  updateJob: (jobId: string, jobData: any) => api.put(`/jobs/${jobId}`, jobData),
  
  deleteJob: (jobId: string) => api.delete(`/jobs/${jobId}`),
  
  getMyJobs: (params: any = {}) => api.get('/jobs/my-jobs', { params }),
  
  saveJob: (jobId: string) => api.post(`/jobs/${jobId}/save`),
  
  getSavedJobs: (params: any = {}) => api.get('/jobs/saved/list', { params }),
  
  updateJobStatus: (jobId: string, status: string) => 
    api.put(`/jobs/${jobId}/status`, { status }),
};

// Categories API
export const categoriesAPI = {
  getCategories: (params: any = {}) => api.get('/categories', { params }),
  
  getCategoryTree: () => api.get('/categories/tree'),
  
  getPopularCategories: (limit?: number) => 
    api.get('/categories/popular', { params: { limit } }),
  
  getWinnipegCategories: (season?: string) => 
    api.get('/categories/winnipeg-specific', { params: { season } }),
  
  searchCategories: (query: string, limit?: number) => 
    api.get('/categories/search', { params: { q: query, limit } }),
  
  getCategoryBySlug: (slug: string) => api.get(`/categories/${slug}`),
};

// Providers API
export const providersAPI = {
  getProviders: (params: any = {}) => api.get('/users/providers', { params }),
  
  getProviderById: (providerId: string) => api.get(`/users/provider/${providerId}`),
  
  searchProviders: (params: any = {}) => api.get('/users/providers', { params }),
  
  updateAvailability: (availability: any) => api.put('/users/availability', availability),
  
  uploadPortfolio: (formData: FormData) => api.post('/users/upload-portfolio', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  
  deletePortfolioImage: (imageId: string) => api.delete(`/users/portfolio/${imageId}`),
  
  getUserStats: () => api.get('/users/stats'),
};

// Quotes API
export const quotesAPI = {
  createQuote: (quoteData: any) => api.post('/quotes', quoteData),
  
  getMyQuotes: (params: any = {}) => api.get('/quotes/my-quotes', { params }),
  
  getJobQuotes: (jobId: string) => api.get(`/quotes/job/${jobId}`),
  
  getQuoteById: (quoteId: string) => api.get(`/quotes/${quoteId}`),
  
  updateQuote: (quoteId: string, quoteData: any) => api.put(`/quotes/${quoteId}`, quoteData),
  
  acceptQuote: (quoteId: string) => api.put(`/quotes/${quoteId}/accept`),
  
  rejectQuote: (quoteId: string, reason?: string) => 
    api.put(`/quotes/${quoteId}/reject`, { reason }),
  
  withdrawQuote: (quoteId: string) => api.delete(`/quotes/${quoteId}`),
  
  getQuoteStats: () => api.get('/quotes/stats/overview'),
};

// Reviews API
export const reviewsAPI = {
  createReview: (reviewData: any) => api.post('/reviews', reviewData),
  
  getUserReviews: (userId: string, params: any = {}) => 
    api.get(`/reviews/user/${userId}`, { params }),
  
  getMyReviews: (params: any = {}) => api.get('/reviews/my-reviews', { params }),
  
  getReviewById: (reviewId: string) => api.get(`/reviews/${reviewId}`),
  
  addReviewResponse: (reviewId: string, comment: string) => 
    api.put(`/reviews/${reviewId}/response`, { comment }),
  
  markReviewHelpful: (reviewId: string) => api.post(`/reviews/${reviewId}/helpful`),
  
  removeHelpfulVote: (reviewId: string) => api.delete(`/reviews/${reviewId}/helpful`),
  
  reportReview: (reviewId: string, reason: string, details?: string) => 
    api.post(`/reviews/${reviewId}/report`, { reason, details }),
  
  deleteReview: (reviewId: string) => api.delete(`/reviews/${reviewId}`),
};

// Messages API
export const messagesAPI = {
  sendMessage: (messageData: any) => api.post('/messages', messageData),
  
  getChats: (params: any = {}) => api.get('/messages/chats', { params }),
  
  getChatMessages: (chatId: string, params: any = {}) => 
    api.get(`/messages/chat/${chatId}`, { params }),
  
  markAsRead: (messageId: string) => api.put(`/messages/${messageId}/read`),
  
  deleteMessage: (messageId: string) => api.delete(`/messages/${messageId}`),
  
  getUnreadCount: () => api.get('/messages/unread-count'),
  
  startChat: (params: any) => api.post('/messages/start-chat', params),
  
  reportMessage: (messageId: string, reason: string) => 
    api.post(`/messages/report/${messageId}`, { reason }),
  
  searchMessages: (params: any = {}) => api.get('/messages/search', { params }),
};

// Payments API
export const paymentsAPI = {
  createPaymentIntent: (data: any) => api.post('/payments/create-payment-intent', data),
  
  confirmPayment: (paymentIntentId: string) => 
    api.post('/payments/confirm-payment', { paymentIntentId }),
  
  getMyPayments: (params: any = {}) => api.get('/payments/my-payments', { params }),
  
  getPaymentById: (paymentId: string) => api.get(`/payments/${paymentId}`),
  
  approveRelease: (paymentId: string, notes?: string) => 
    api.post(`/payments/${paymentId}/approve-release`, { notes }),
  
  releasePayment: (paymentId: string) => api.post(`/payments/${paymentId}/release`),
  
  refundPayment: (paymentId: string, reason: string, amount?: number) => 
    api.post(`/payments/${paymentId}/refund`, { reason, amount }),
  
  disputePayment: (paymentId: string, reason: string) => 
    api.post(`/payments/${paymentId}/dispute`, { reason }),
  
  getPaymentStats: () => api.get('/payments/stats/overview'),
};

export default api;
