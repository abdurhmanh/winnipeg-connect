const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  // Job details
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  subcategories: [{
    type: String,
    trim: true
  }],
  
  // Seeker info
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Budget and timeline
  budget: {
    type: {
      type: String,
      enum: ['fixed', 'hourly', 'range'],
      required: true
    },
    amount: Number, // For fixed budget
    hourlyRate: Number, // For hourly jobs
    range: {
      min: Number,
      max: Number
    }
  },
  timeline: {
    startDate: Date,
    endDate: Date,
    estimatedDuration: String, // e.g., "2-3 days", "1 week"
    isFlexible: { type: Boolean, default: false }
  },
  
  // Location
  location: {
    address: {
      street: String,
      city: { type: String, default: 'Winnipeg' },
      province: { type: String, default: 'Manitoba' },
      postalCode: String,
      suburb: String
    },
    coordinates: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] } // [longitude, latitude]
    },
    isRemote: { type: Boolean, default: false }
  },
  
  // Media
  images: [{
    url: String,
    description: String,
    publicId: String // Cloudinary public ID
  }],
  documents: [{
    url: String,
    filename: String,
    publicId: String
  }],
  
  // Job status and matching
  status: {
    type: String,
    enum: ['open', 'in_progress', 'completed', 'cancelled', 'disputed'],
    default: 'open'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Quotes and selection
  quotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quote'
  }],
  selectedProvider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  selectedQuote: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quote'
  },
  
  // Project tracking
  milestones: [{
    title: String,
    description: String,
    dueDate: Date,
    isCompleted: { type: Boolean, default: false },
    completedDate: Date,
    amount: Number // Partial payment amount
  }],
  
  // Requirements and preferences
  requirements: {
    insurance: { type: Boolean, default: false },
    license: { type: Boolean, default: false },
    backgroundCheck: { type: Boolean, default: false },
    minimumRating: { type: Number, min: 1, max: 5 }
  },
  
  // Communication
  isUrgent: { type: Boolean, default: false },
  responseTime: {
    type: String,
    enum: ['asap', 'within_24h', 'within_week', 'flexible'],
    default: 'flexible'
  },
  
  // Analytics
  views: { type: Number, default: 0 },
  saves: [{ // Users who saved this job
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Completion and review
  completionDate: Date,
  review: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
jobSchema.index({ 'location.coordinates': '2dsphere' });
jobSchema.index({ postedBy: 1 });
jobSchema.index({ category: 1 });
jobSchema.index({ status: 1 });
jobSchema.index({ priority: -1 });
jobSchema.index({ createdAt: -1 });
jobSchema.index({ 'budget.range.min': 1, 'budget.range.max': 1 });

// Virtual for quote count
jobSchema.virtual('quoteCount').get(function() {
  return this.quotes.length;
});

// Method to check if job is still open for quotes
jobSchema.methods.isOpenForQuotes = function() {
  return this.status === 'open' && !this.selectedProvider;
};

// Method to calculate distance from coordinates
jobSchema.methods.calculateDistance = function(lat, lng) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat - this.location.coordinates.coordinates[1]) * Math.PI / 180;
  const dLng = (lng - this.location.coordinates.coordinates[0]) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(this.location.coordinates.coordinates[1] * Math.PI / 180) * 
    Math.cos(lat * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

module.exports = mongoose.model('Job', jobSchema);
