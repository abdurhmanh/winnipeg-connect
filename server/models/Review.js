const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  // References
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Review type
  reviewerType: {
    type: String,
    enum: ['provider', 'seeker'],
    required: true
  },
  
  // Rating and feedback
  rating: {
    overall: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    // Detailed ratings for providers
    quality: {
      type: Number,
      min: 1,
      max: 5
    },
    communication: {
      type: Number,
      min: 1,
      max: 5
    },
    punctuality: {
      type: Number,
      min: 1,
      max: 5
    },
    professionalism: {
      type: Number,
      min: 1,
      max: 5
    },
    // Detailed ratings for seekers
    clarity: {
      type: Number,
      min: 1,
      max: 5
    },
    payment: {
      type: Number,
      min: 1,
      max: 5
    },
    cooperation: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  
  // Written feedback
  title: {
    type: String,
    trim: true,
    maxlength: 100
  },
  comment: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  
  // Additional feedback
  wouldRecommend: {
    type: Boolean,
    required: true
  },
  wouldHireAgain: Boolean, // For seeker reviews of providers
  
  // Tags for quick feedback
  tags: [{
    type: String,
    enum: [
      // Positive tags
      'professional', 'punctual', 'quality_work', 'fair_pricing', 
      'good_communication', 'clean_workspace', 'exceeded_expectations',
      'problem_solver', 'reliable', 'skilled', 'friendly',
      // Negative tags
      'late', 'poor_communication', 'overpriced', 'messy', 
      'unprofessional', 'rushed_work', 'unreliable'
    ]
  }],
  
  // Media
  images: [{
    url: String,
    description: String,
    publicId: String
  }],
  
  // Status and visibility
  isVisible: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: true // Auto-verify for MVP, can add manual verification later
  },
  
  // Response from reviewee
  response: {
    comment: String,
    createdAt: Date
  },
  
  // Helpful votes
  helpfulVotes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Reporting
  reports: [{
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      enum: ['inappropriate', 'fake', 'spam', 'harassment', 'other']
    },
    details: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
reviewSchema.index({ job: 1 });
reviewSchema.index({ reviewer: 1 });
reviewSchema.index({ reviewee: 1 });
reviewSchema.index({ reviewerType: 1 });
reviewSchema.index({ 'rating.overall': -1 });
reviewSchema.index({ createdAt: -1 });
reviewSchema.index({ isVisible: 1 });

// Virtual for helpful votes count
reviewSchema.virtual('helpfulCount').get(function() {
  return this.helpfulVotes.length;
});

// Virtual for average detailed rating
reviewSchema.virtual('averageDetailedRating').get(function() {
  const ratings = [];
  
  if (this.reviewerType === 'seeker') {
    // Provider ratings
    if (this.rating.quality) ratings.push(this.rating.quality);
    if (this.rating.communication) ratings.push(this.rating.communication);
    if (this.rating.punctuality) ratings.push(this.rating.punctuality);
    if (this.rating.professionalism) ratings.push(this.rating.professionalism);
  } else {
    // Seeker ratings
    if (this.rating.clarity) ratings.push(this.rating.clarity);
    if (this.rating.payment) ratings.push(this.rating.payment);
    if (this.rating.cooperation) ratings.push(this.rating.cooperation);
  }
  
  if (ratings.length === 0) return this.rating.overall;
  
  const sum = ratings.reduce((total, rating) => total + rating, 0);
  return sum / ratings.length;
});

// Method to check if user can vote helpful
reviewSchema.methods.canVoteHelpful = function(userId) {
  return !this.helpfulVotes.some(vote => vote.user.toString() === userId.toString());
};

// Method to add helpful vote
reviewSchema.methods.addHelpfulVote = function(userId) {
  if (this.canVoteHelpful(userId)) {
    this.helpfulVotes.push({ user: userId });
    return true;
  }
  return false;
};

// Method to remove helpful vote
reviewSchema.methods.removeHelpfulVote = function(userId) {
  const index = this.helpfulVotes.findIndex(vote => vote.user.toString() === userId.toString());
  if (index > -1) {
    this.helpfulVotes.splice(index, 1);
    return true;
  }
  return false;
};

module.exports = mongoose.model('Review', reviewSchema);
