const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  // Chat identification
  chatId: {
    type: String,
    required: true,
    index: true
  },
  
  // Participants
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Related job (optional)
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  },
  quote: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quote'
  },
  
  // Message content
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'document', 'system'],
    default: 'text'
  },
  
  // Media attachments
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'document', 'link']
    },
    url: String,
    filename: String,
    size: Number,
    publicId: String // For Cloudinary
  }],
  
  // Message status
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  
  isDelivered: {
    type: Boolean,
    default: false
  },
  deliveredAt: Date,
  
  // System message data
  systemData: {
    type: {
      type: String,
      enum: ['quote_sent', 'quote_accepted', 'quote_rejected', 'job_completed', 'payment_released']
    },
    data: mongoose.Schema.Types.Mixed
  },
  
  // Message threading (for future use)
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  
  // Moderation
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  deletedAt: Date,
  
  isReported: {
    type: Boolean,
    default: false
  },
  reports: [{
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
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
messageSchema.index({ chatId: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ receiver: 1 });
messageSchema.index({ job: 1 });
messageSchema.index({ isRead: 1 });
messageSchema.index({ createdAt: -1 });

// Virtual for formatted timestamp
messageSchema.virtual('formattedTime').get(function() {
  return this.createdAt.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Method to mark as read
messageSchema.methods.markAsRead = function() {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to mark as delivered
messageSchema.methods.markAsDelivered = function() {
  if (!this.isDelivered) {
    this.isDelivered = true;
    this.deliveredAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// Static method to create system message
messageSchema.statics.createSystemMessage = function(chatId, sender, receiver, type, data, job = null) {
  const systemMessages = {
    quote_sent: 'A new quote has been sent for this job.',
    quote_accepted: 'Quote has been accepted! The job is now in progress.',
    quote_rejected: 'Quote has been declined.',
    job_completed: 'Job has been marked as completed.',
    payment_released: 'Payment has been released to the service provider.'
  };

  return this.create({
    chatId,
    sender,
    receiver,
    job,
    content: systemMessages[type] || 'System notification',
    messageType: 'system',
    systemData: { type, data },
    isDelivered: true,
    deliveredAt: new Date()
  });
};

// Static method to generate chat ID
messageSchema.statics.generateChatId = function(userId1, userId2, jobId = null) {
  const sortedIds = [userId1.toString(), userId2.toString()].sort();
  return jobId ? `${sortedIds[0]}_${sortedIds[1]}_${jobId}` : `${sortedIds[0]}_${sortedIds[1]}`;
};

module.exports = mongoose.model('Message', messageSchema);
