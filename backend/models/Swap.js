import mongoose from 'mongoose';

const swapSchema = new mongoose.Schema({
  initiator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  initiatorItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: function() {
      return this.type === 'swap'; // Only required for swap type, not redeem
    }
  },
  recipientItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  type: {
    type: String,
    enum: ['swap', 'redeem'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
    default: 'pending'
  },
  points: {
    type: Number,
    default: 0,
    min: [0, 'Points cannot be negative']
  },
  message: {
    type: String,
    maxlength: [500, 'Message cannot be more than 500 characters']
  },
  initiatorRating: {
    rating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    comment: {
      type: String,
      maxlength: [200, 'Comment cannot be more than 200 characters']
    },
    createdAt: Date
  },
  recipientRating: {
    rating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    comment: {
      type: String,
      maxlength: [200, 'Comment cannot be more than 200 characters']
    },
    createdAt: Date
  },
  shipping: {
    initiatorTracking: String,
    recipientTracking: String,
    initiatorShippedAt: Date,
    recipientShippedAt: Date,
    initiatorReceivedAt: Date,
    recipientReceivedAt: Date
  },
  dispute: {
    raisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      enum: ['item-not-as-described', 'damaged', 'not-received', 'other']
    },
    description: String,
    status: {
      type: String,
      enum: ['open', 'resolved', 'closed'],
      default: 'open'
    },
    adminNotes: String,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: Date
  },
  timeline: [{
    action: {
      type: String,
      enum: ['created', 'accepted', 'rejected', 'shipped', 'received', 'completed', 'cancelled', 'disputed']
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    details: String
  }],
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

// Virtual for checking if swap is expired
swapSchema.virtual('isExpired').get(function() {
  return this.status === 'pending' && new Date() > this.expiresAt;
});

// Virtual for checking if both parties have rated
swapSchema.virtual('bothRated').get(function() {
  return this.initiatorRating.rating && this.recipientRating.rating;
});

// Indexes for better query performance
swapSchema.index({ initiator: 1 });
swapSchema.index({ recipient: 1 });
swapSchema.index({ status: 1 });
swapSchema.index({ createdAt: -1 });
swapSchema.index({ expiresAt: 1 });

// Pre-save middleware to add timeline entry
swapSchema.pre('save', function(next) {
  if (this.isNew) {
    this.timeline.push({
      action: 'created',
      user: this.initiator,
      details: 'Swap request created'
    });
  }
  next();
});

// Instance method to accept swap
swapSchema.methods.accept = function(userId) {
  if (this.status !== 'pending') {
    throw new Error('Swap is not in pending status');
  }
  
  if (this.recipient.toString() !== userId.toString()) {
    throw new Error('Only recipient can accept swap');
  }
  
  this.status = 'accepted';
  this.timeline.push({
    action: 'accepted',
    user: userId,
    details: 'Swap accepted'
  });
  
  return this.save();
};

// Instance method to reject swap
swapSchema.methods.reject = function(userId) {
  if (this.status !== 'pending') {
    throw new Error('Swap is not in pending status');
  }
  
  if (this.recipient.toString() !== userId.toString()) {
    throw new Error('Only recipient can reject swap');
  }
  
  this.status = 'rejected';
  this.timeline.push({
    action: 'rejected',
    user: userId,
    details: 'Swap rejected'
  });
  
  return this.save();
};

// Instance method to mark as shipped
swapSchema.methods.markShipped = function(userId, trackingNumber) {
  if (this.status !== 'accepted') {
    throw new Error('Swap must be accepted before marking as shipped');
  }
  
  if (this.initiator.toString() === userId.toString()) {
    this.shipping.initiatorTracking = trackingNumber;
    this.shipping.initiatorShippedAt = new Date();
    this.timeline.push({
      action: 'shipped',
      user: userId,
      details: 'Initiator shipped item'
    });
  } else if (this.recipient.toString() === userId.toString()) {
    this.shipping.recipientTracking = trackingNumber;
    this.shipping.recipientShippedAt = new Date();
    this.timeline.push({
      action: 'shipped',
      user: userId,
      details: 'Recipient shipped item'
    });
  } else {
    throw new Error('User not authorized to mark as shipped');
  }
  
  return this.save();
};

// Instance method to mark as received
swapSchema.methods.markReceived = function(userId) {
  if (this.status !== 'accepted') {
    throw new Error('Swap must be accepted before marking as received');
  }
  
  if (this.initiator.toString() === userId.toString()) {
    this.shipping.initiatorReceivedAt = new Date();
    this.timeline.push({
      action: 'received',
      user: userId,
      details: 'Initiator received item'
    });
  } else if (this.recipient.toString() === userId.toString()) {
    this.shipping.recipientReceivedAt = new Date();
    this.timeline.push({
      action: 'received',
      user: userId,
      details: 'Recipient received item'
    });
  } else {
    throw new Error('User not authorized to mark as received');
  }
  
  // Check if both parties have received items
  if (this.shipping.initiatorReceivedAt && this.shipping.recipientReceivedAt) {
    this.status = 'completed';
    this.timeline.push({
      action: 'completed',
      user: null,
      details: 'Swap completed successfully'
    });
  }
  
  return this.save();
};

// Instance method to add rating
swapSchema.methods.addRating = function(userId, rating, comment) {
  if (this.status !== 'completed') {
    throw new Error('Can only rate completed swaps');
  }
  
  if (this.initiator.toString() === userId.toString()) {
    if (this.initiatorRating.rating) {
      throw new Error('Initiator has already rated this swap');
    }
    this.initiatorRating = { rating, comment, createdAt: new Date() };
  } else if (this.recipient.toString() === userId.toString()) {
    if (this.recipientRating.rating) {
      throw new Error('Recipient has already rated this swap');
    }
    this.recipientRating = { rating, comment, createdAt: new Date() };
  } else {
    throw new Error('User not authorized to rate this swap');
  }
  
  return this.save();
};

// Instance method to raise dispute
swapSchema.methods.raiseDispute = function(userId, reason, description) {
  if (this.status !== 'accepted' && this.status !== 'completed') {
    throw new Error('Can only raise dispute for accepted or completed swaps');
  }
  
  if (this.dispute.status === 'open') {
    throw new Error('Dispute already exists for this swap');
  }
  
  this.dispute = {
    raisedBy: userId,
    reason,
    description,
    status: 'open'
  };
  
  this.timeline.push({
    action: 'disputed',
    user: userId,
    details: `Dispute raised: ${reason}`
  });
  
  return this.save();
};

// Static method to get user's swaps
swapSchema.statics.getUserSwaps = function(userId, status = null) {
  const query = {
    $or: [{ initiator: userId }, { recipient: userId }]
  };
  
  if (status) {
    query.status = status;
  }
  
  return this.find(query)
    .populate('initiator', 'name avatar')
    .populate('recipient', 'name avatar')
    .populate('initiatorItem', 'title images points')
    .populate('recipientItem', 'title images points')
    .sort({ createdAt: -1 });
};

// Static method to get pending swaps for user
swapSchema.statics.getPendingSwaps = function(userId) {
  return this.find({
    recipient: userId,
    status: 'pending',
    expiresAt: { $gt: new Date() }
  })
  .populate('initiator', 'name avatar')
  .populate('initiatorItem', 'title images points')
  .populate('recipientItem', 'title images points')
  .sort({ createdAt: -1 });
};

const Swap = mongoose.model('Swap', swapSchema);

export default Swap; 