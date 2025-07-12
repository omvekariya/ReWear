import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 'accessories']
  },
  size: {
    type: String,
    required: [true, 'Size is required'],
    enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size', 'Custom']
  },
  brand: {
    type: String,
    trim: true,
    maxlength: [50, 'Brand cannot be more than 50 characters']
  },
  condition: {
    type: String,
    required: [true, 'Condition is required'],
    enum: ['new', 'like-new', 'good', 'fair', 'poor']
  },
  material: {
    type: String,
    trim: true,
    maxlength: [100, 'Material cannot be more than 100 characters']
  },
  points: {
    type: Number,
    required: [true, 'Points value is required'],
    min: [1, 'Points must be at least 1'],
    max: [1000, 'Points cannot exceed 1000']
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true
    },
    isMain: {
      type: Boolean,
      default: false
    }
  }],
  tags: [{
    type: String,
    trim: true,
    maxlength: [20, 'Tag cannot be more than 20 characters']
  }],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'sold', 'removed', 'flagged'],
    default: 'pending'
  },
  isSwappable: {
    type: Boolean,
    default: true
  },
  isRedeemable: {
    type: Boolean,
    default: true
  },
  location: {
    city: String,
    state: String,
    country: String
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
    unit: {
      type: String,
      enum: ['cm', 'inches'],
      default: 'cm'
    }
  },
  weight: {
    value: Number,
    unit: {
      type: String,
      enum: ['kg', 'lbs'],
      default: 'kg'
    }
  },
  views: {
    type: Number,
    default: 0
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  reports: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      enum: ['inappropriate', 'spam', 'fake', 'damaged', 'other']
    },
    description: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  adminNotes: {
    type: String,
    maxlength: [500, 'Admin notes cannot be more than 500 characters']
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  featured: {
    type: Boolean,
    default: false
  },
  featuredUntil: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for main image
itemSchema.virtual('mainImage').get(function() {
  if (!this.images || this.images.length === 0) {
    return null;
  }
  const mainImage = this.images.find(img => img.isMain);
  return mainImage ? mainImage.url : this.images[0].url;
});

// Virtual for likes count
itemSchema.virtual('likesCount').get(function() {
  return this.likes ? this.likes.length : 0;
});

// Virtual for reports count
itemSchema.virtual('reportsCount').get(function() {
  return this.reports ? this.reports.length : 0;
});

// Indexes for better query performance
itemSchema.index({ owner: 1 });
itemSchema.index({ status: 1 });
itemSchema.index({ category: 1 });
itemSchema.index({ points: 1 });
itemSchema.index({ createdAt: -1 });
itemSchema.index({ featured: 1, featuredUntil: 1 });
itemSchema.index({ title: 'text', description: 'text' });

// Pre-save middleware to ensure only one main image
itemSchema.pre('save', function(next) {
  if (this.images && this.images.length > 0) {
    const mainImages = this.images.filter(img => img.isMain);
    if (mainImages.length > 1) {
      // Keep only the first main image
      let foundMain = false;
      this.images.forEach(img => {
        if (img.isMain && !foundMain) {
          foundMain = true;
        } else {
          img.isMain = false;
        }
      });
    } else if (mainImages.length === 0) {
      // Set first image as main if no main image exists
      this.images[0].isMain = true;
    }
  }
  next();
});

// Instance method to increment views
itemSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Instance method to toggle like
itemSchema.methods.toggleLike = function(userId) {
  const likeIndex = this.likes.indexOf(userId);
  const wasLiked = likeIndex > -1;
  
  if (wasLiked) {
    this.likes.splice(likeIndex, 1);
  } else {
    this.likes.push(userId);
  }
  
  return this.save().then(async (savedItem) => {
    // Award points to item owner when someone likes their item
    if (!wasLiked) {
      const User = mongoose.model('User');
      const likeBonus = 2; // Points for receiving a like
      await User.findByIdAndUpdate(this.owner, {
        $inc: { 
          points: likeBonus,
          'stats.totalPointsEarned': likeBonus
        }
      });
    }
    return savedItem;
  });
};

// Instance method to add report
itemSchema.methods.addReport = function(userId, reason, description) {
  const existingReport = this.reports.find(report => report.user.toString() === userId.toString());
  if (existingReport) {
    throw new Error('User has already reported this item');
  }
  
  this.reports.push({
    user: userId,
    reason,
    description
  });
  
  // Auto-flag item if it has multiple reports
  if (this.reports.length >= 3) {
    this.status = 'flagged';
  }
  
  return this.save();
};

// Static method to get featured items
itemSchema.statics.getFeaturedItems = function(limit = 10) {
  return this.find({
    status: 'active'
  })
  .populate('owner', 'name avatar')
  .sort({ createdAt: -1 })
  .limit(limit);
};

// Static method to search items
itemSchema.statics.searchItems = function(query, filters = {}) {
  const searchQuery = {
    status: 'active',
    ...filters
  };

  if (query) {
    searchQuery.$text = { $search: query };
  }

  return this.find(searchQuery)
    .populate('owner', 'name avatar')
    .sort({ score: { $meta: 'textScore' }, createdAt: -1 });
};

const Item = mongoose.model('Item', itemSchema);

export default Item; 