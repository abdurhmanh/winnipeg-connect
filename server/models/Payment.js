const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  // References
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  quote: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quote',
    required: true
  },
  payer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  payee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Payment details
  amount: {
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    platformFee: {
      type: Number,
      required: true,
      min: 0
    },
    stripeFee: {
      type: Number,
      required: true,
      min: 0
    },
    total: {
      type: Number,
      required: true,
      min: 0
    }
  },
  
  // Payment type and status
  paymentType: {
    type: String,
    enum: ['deposit', 'milestone', 'final', 'full'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'authorized', 'captured', 'released', 'refunded', 'failed', 'disputed'],
    default: 'pending'
  },
  
  // Stripe integration
  stripePaymentIntentId: String,
  stripeChargeId: String,
  stripeTransferId: String,
  stripeRefundId: String,
  
  // Escrow details
  escrowStatus: {
    type: String,
    enum: ['held', 'released', 'refunded', 'disputed'],
    default: 'held'
  },
  holdUntil: Date, // Automatic release date
  
  // Milestone information (if applicable)
  milestone: {
    title: String,
    description: String,
    percentage: Number
  },
  
  // Release conditions
  releaseConditions: {
    seekerApproval: { type: Boolean, default: false },
    providerConfirmation: { type: Boolean, default: false },
    autoReleaseDate: Date,
    requiresBothApproval: { type: Boolean, default: true }
  },
  
  // Approval tracking
  approvals: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    userType: {
      type: String,
      enum: ['seeker', 'provider']
    },
    approvedAt: Date,
    notes: String
  }],
  
  // Release/refund details
  releasedAt: Date,
  releasedBy: {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      enum: ['job_completed', 'mutual_agreement', 'auto_release', 'admin_release']
    }
  },
  
  refundedAt: Date,
  refundReason: String,
  refundAmount: Number,
  
  // Dispute information
  dispute: {
    isDisputed: { type: Boolean, default: false },
    disputedAt: Date,
    disputedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    status: {
      type: String,
      enum: ['open', 'under_review', 'resolved', 'closed']
    },
    resolution: String,
    resolvedAt: Date,
    resolvedBy: String // 'platform', 'mutual', 'stripe'
  },
  
  // Transaction metadata
  currency: {
    type: String,
    default: 'CAD'
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'bank_transfer', 'other'],
    default: 'card'
  },
  
  // Notifications
  notifications: {
    payerNotified: { type: Boolean, default: false },
    payeeNotified: { type: Boolean, default: false },
    releaseNotified: { type: Boolean, default: false }
  },
  
  // Audit trail
  statusHistory: [{
    status: String,
    changedAt: {
      type: Date,
      default: Date.now
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    metadata: mongoose.Schema.Types.Mixed
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
paymentSchema.index({ job: 1 });
paymentSchema.index({ quote: 1 });
paymentSchema.index({ payer: 1 });
paymentSchema.index({ payee: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ escrowStatus: 1 });
paymentSchema.index({ stripePaymentIntentId: 1 });
paymentSchema.index({ holdUntil: 1 });
paymentSchema.index({ createdAt: -1 });

// Virtual for net amount to payee
paymentSchema.virtual('netAmount').get(function() {
  return this.amount.subtotal - this.amount.platformFee;
});

// Virtual for can be released
paymentSchema.virtual('canBeReleased').get(function() {
  if (this.escrowStatus !== 'held') return false;
  
  const conditions = this.releaseConditions;
  if (!conditions.requiresBothApproval) return true;
  
  return conditions.seekerApproval && conditions.providerConfirmation;
});

// Method to add approval
paymentSchema.methods.addApproval = function(userId, userType, notes = '') {
  // Check if user already approved
  const existingApproval = this.approvals.find(
    approval => approval.user.toString() === userId.toString()
  );
  
  if (existingApproval) return false;
  
  this.approvals.push({
    user: userId,
    userType,
    approvedAt: new Date(),
    notes
  });
  
  // Update release conditions
  if (userType === 'seeker') {
    this.releaseConditions.seekerApproval = true;
  } else if (userType === 'provider') {
    this.releaseConditions.providerConfirmation = true;
  }
  
  return true;
};

// Method to calculate platform fee
paymentSchema.statics.calculatePlatformFee = function(amount, feePercentage = 0.05) {
  return Math.round(amount * feePercentage * 100) / 100;
};

// Method to calculate Stripe fee (approximate)
paymentSchema.statics.calculateStripeFee = function(amount) {
  return Math.round((amount * 0.029 + 0.30) * 100) / 100;
};

// Pre-save middleware to add status history
paymentSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      changedAt: new Date(),
      reason: 'Status updated'
    });
  }
  next();
});

// Method to check if payment can be refunded
paymentSchema.methods.canBeRefunded = function() {
  return ['authorized', 'captured', 'held'].includes(this.status) && 
         this.escrowStatus === 'held';
};

// Method to check if payment is ready for auto-release
paymentSchema.methods.isReadyForAutoRelease = function() {
  return this.escrowStatus === 'held' && 
         this.holdUntil && 
         new Date() >= this.holdUntil;
};

module.exports = mongoose.model('Payment', paymentSchema);
