const mongoose = require('mongoose');

const quoteSchema = new mongoose.Schema({
  // References
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  seeker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Quote details
  price: {
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    type: {
      type: String,
      enum: ['fixed', 'hourly'],
      required: true
    },
    breakdown: [{
      item: String,
      cost: Number,
      description: String
    }]
  },
  
  // Timeline
  estimatedDuration: {
    value: Number,
    unit: {
      type: String,
      enum: ['hours', 'days', 'weeks', 'months']
    }
  },
  startDate: Date,
  completionDate: Date,
  
  // Proposal
  message: {
    type: String,
    required: true,
    maxlength: 1000
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'withdrawn', 'expired'],
    default: 'pending'
  },
  
  // Additional details
  includesSupplies: {
    type: Boolean,
    default: false
  },
  supplyDetails: String,
  
  warranty: {
    offered: { type: Boolean, default: false },
    duration: String, // e.g., "1 year", "6 months"
    details: String
  },
  
  // Availability
  availability: {
    immediate: { type: Boolean, default: false },
    startDate: Date,
    notes: String
  },
  
  // Terms and conditions
  terms: String,
  paymentTerms: {
    deposit: {
      required: { type: Boolean, default: false },
      percentage: Number,
      amount: Number
    },
    milestones: [{
      description: String,
      percentage: Number,
      amount: Number
    }]
  },
  
  // Response tracking
  viewedBySeeker: {
    type: Boolean,
    default: false
  },
  viewedAt: Date,
  respondedAt: Date,
  
  // Expiry
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
quoteSchema.index({ job: 1 });
quoteSchema.index({ provider: 1 });
quoteSchema.index({ seeker: 1 });
quoteSchema.index({ status: 1 });
quoteSchema.index({ createdAt: -1 });
quoteSchema.index({ expiresAt: 1 });

// Virtual for formatted price
quoteSchema.virtual('formattedPrice').get(function() {
  const amount = this.price.amount.toFixed(2);
  return this.price.type === 'hourly' ? `$${amount}/hr` : `$${amount}`;
});

// Method to check if quote is still valid
quoteSchema.methods.isValid = function() {
  return this.status === 'pending' && new Date() < this.expiresAt;
};

// Method to calculate total with breakdown
quoteSchema.methods.calculateTotal = function() {
  if (this.price.breakdown && this.price.breakdown.length > 0) {
    return this.price.breakdown.reduce((total, item) => total + item.cost, 0);
  }
  return this.price.amount;
};

// Pre-save middleware to update respondedAt when status changes
quoteSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status !== 'pending' && !this.respondedAt) {
    this.respondedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('Quote', quoteSchema);
