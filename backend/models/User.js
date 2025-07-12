import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  avatar: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    maxlength: [200, 'Bio cannot be more than 200 characters'],
    default: ''
  },
  points: {
    type: Number,
    default: 0,
    min: [0, 'Points cannot be negative']
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'suspended'],
    default: 'active'
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  lastLogin: {
    type: Date,
    default: Date.now
  },
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    },
    privacy: {
      profileVisible: { type: Boolean, default: true },
      showEmail: { type: Boolean, default: false }
    }
  },
  stats: {
    itemsListed: { type: Number, default: 0 },
    swapsCompleted: { type: Number, default: 0 },
    totalPointsEarned: { type: Number, default: 0 },
    totalPointsSpent: { type: Number, default: 0 },
    referralsCount: { type: Number, default: 0 }
  },
  referralCode: {
    type: String,
    unique: true,
    sparse: true
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  achievements: [String]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full profile URL
userSchema.virtual('avatarUrl').get(function() {
  if (this.avatar) {
    return this.avatar;
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(this.name)}&background=random`;
});

// Indexes for better query performance
userSchema.index({ status: 1 });
userSchema.index({ role: 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Instance method to get public profile
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.emailVerificationToken;
  delete userObject.emailVerificationExpires;
  delete userObject.resetPasswordToken;
  delete userObject.resetPasswordExpires;
  return userObject;
};

// Static method to find by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Instance method to generate referral code
userSchema.methods.generateReferralCode = function() {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  this.referralCode = code;
  return this.save();
};

// Static method to find by referral code
userSchema.statics.findByReferralCode = function(code) {
  return this.findOne({ referralCode: code.toUpperCase() });
};

// Instance method to check and award milestones
userSchema.methods.checkMilestones = async function() {
  const milestones = [
    { type: 'itemsListed', levels: [5, 10, 25, 50], points: [50, 100, 250, 500] },
    { type: 'swapsCompleted', levels: [3, 10, 25, 50], points: [75, 200, 500, 1000] },
    { type: 'totalPointsEarned', levels: [100, 500, 1000, 2500], points: [100, 250, 500, 1000] }
  ];

  let totalBonus = 0;
  const achievements = [];

  for (const milestone of milestones) {
    const currentValue = this.stats[milestone.type] || 0;
    
    for (let i = 0; i < milestone.levels.length; i++) {
      const level = milestone.levels[i];
      const points = milestone.points[i];
      
      // Check if user just reached this milestone
      if (currentValue >= level) {
        const milestoneKey = `${milestone.type}_${level}`;
        if (!this.achievements || !this.achievements.includes(milestoneKey)) {
          totalBonus += points;
          achievements.push({
            type: milestone.type,
            level: level,
            points: points,
            description: `Reached ${level} ${milestone.type.replace(/([A-Z])/g, ' $1').toLowerCase()}`
          });
          
          // Mark milestone as achieved
          if (!this.achievements) this.achievements = [];
          this.achievements.push(milestoneKey);
        }
      }
    }
  }

  if (totalBonus > 0) {
    this.points += totalBonus;
    this.stats.totalPointsEarned += totalBonus;
    await this.save();
  }

  return { totalBonus, achievements };
};

// Add achievements field to schema
userSchema.add({
  achievements: [String]
});

const User = mongoose.model('User', userSchema);

export default User; 