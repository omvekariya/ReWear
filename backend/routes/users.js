import express from 'express';
import { body, validationResult, query } from 'express-validator';
import User from '../models/User.js';
import Item from '../models/Item.js';
import Swap from '../models/Swap.js';
import { protect, optionalAuth } from '../middleware/auth.js';
import dotenv from 'dotenv';
dotenv.config();


const router = express.Router();

// @desc    Get user's dashboard data
// @route   GET /api/users/dashboard
// @access  Private
router.get('/dashboard', protect, async (req, res) => {
  try {
    const [
      userItems,
      pendingSwaps,
      recentSwaps,
      userStats
    ] = await Promise.all([
      Item.find({ owner: req.user._id, status: 'active' })
        .select('title images points status createdAt')
        .sort({ createdAt: -1 })
        .limit(5),
      Swap.getPendingSwaps(req.user._id).catch(() => []),
      Swap.getUserSwaps(req.user._id, 'completed')
        .limit(5)
        .catch(() => []),
      User.findById(req.user._id)
        .select('stats points')
        .catch(() => ({ stats: { itemsListed: 0, swapsCompleted: 0 }, points: 0 }))
    ]);

    res.json({
      success: true,
      data: {
        userItems: userItems || [],
        pendingSwaps: pendingSwaps || [],
        recentSwaps: recentSwaps || [],
        stats: userStats?.stats || { itemsListed: 0, swapsCompleted: 0 },
        points: userStats?.points || 0
      }
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard data'
    });
  }
});

// @desc    Search users
// @route   GET /api/users/search
// @access  Public
router.get('/search', [
  query('q')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Search query must be at least 2 characters'),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 })
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { q, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find({
      $and: [
        { status: 'active' },
        {
          $or: [
            { name: { $regex: q, $options: 'i' } },
            { bio: { $regex: q, $options: 'i' } }
          ]
        }
      ]
    })
    .select('name avatar bio stats createdAt')
    .sort({ 'stats.itemsListed': -1, createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    const total = await User.countDocuments({
      $and: [
        { status: 'active' },
        {
          $or: [
            { name: { $regex: q, $options: 'i' } },
            { bio: { $regex: q, $options: 'i' } }
          ]
        }
      ]
    });

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          hasNextPage: skip + users.length < total,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while searching users'
    });
  }
});

// @desc    Get top users
// @route   GET /api/users/top
// @access  Public
router.get('/top', [
  query('type')
    .optional()
    .isIn(['items', 'swaps', 'points'])
    .withMessage('Invalid type'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { type = 'items', limit = 10 } = req.query;

    let sortField = 'stats.itemsListed';
    if (type === 'swaps') sortField = 'stats.swapsCompleted';
    if (type === 'points') sortField = 'points';

    const users = await User.find({ status: 'active' })
      .select('name avatar bio stats points')
      .sort({ [sortField]: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: { users }
    });
  } catch (error) {
    console.error('Get top users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching top users'
    });
  }
});

// @desc    Get user profile (public)
// @route   GET /api/users/:id
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('name avatar bio stats createdAt');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's active items
    const items = await Item.find({
      owner: req.params.id,
      status: 'active'
    })
    .select('title images points category size condition createdAt')
    .sort({ createdAt: -1 })
    .limit(6);

    res.json({
      success: true,
      data: {
        user,
        items
      }
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user profile'
    });
  }
});

// @desc    Get user's items
// @route   GET /api/users/:id/items
// @access  Public
router.get('/:id/items', optionalAuth, [
  query('status').optional().isIn(['active', 'sold', 'all']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 })
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { status = 'active', page = 1, limit = 12 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter
    const filter = { owner: req.params.id };
    if (status !== 'all') {
      filter.status = status;
    }

    const items = await Item.find(filter)
      .populate('owner', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Item.countDocuments(filter);

    res.json({
      success: true,
      data: {
        items,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          hasNextPage: skip + items.length < total,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get user items error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user items'
    });
  }
});

// @desc    Get user's swap history (public)
// @route   GET /api/users/:id/swaps
// @access  Public
router.get('/:id/swaps', optionalAuth, [
  query('status').optional().isIn(['completed', 'all']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 })
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { status = 'completed', page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter
    const filter = {
      $or: [{ initiator: req.params.id }, { recipient: req.params.id }]
    };
    if (status !== 'all') {
      filter.status = status;
    }

    const swaps = await Swap.find(filter)
      .populate('initiator', 'name avatar')
      .populate('recipient', 'name avatar')
      .populate('initiatorItem', 'title images')
      .populate('recipientItem', 'title images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Swap.countDocuments(filter);

    res.json({
      success: true,
      data: {
        swaps,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          hasNextPage: skip + swaps.length < total,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get user swaps error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user swaps'
    });
  }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', protect, [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Bio cannot be more than 200 characters'),
  body('avatar')
    .optional()
    .isURL()
    .withMessage('Avatar must be a valid URL'),
  body('preferences.notifications.email')
    .optional()
    .isBoolean()
    .withMessage('Email notifications must be a boolean'),
  body('preferences.notifications.push')
    .optional()
    .isBoolean()
    .withMessage('Push notifications must be a boolean'),
  body('preferences.privacy.profileVisible')
    .optional()
    .isBoolean()
    .withMessage('Profile visibility must be a boolean'),
  body('preferences.privacy.showEmail')
    .optional()
    .isBoolean()
    .withMessage('Email visibility must be a boolean')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const updateFields = {};
    const { name, bio, avatar, preferences } = req.body;

    if (name) updateFields.name = name;
    if (bio !== undefined) updateFields.bio = bio;
    if (avatar) updateFields.avatar = avatar;
    if (preferences) {
      updateFields.preferences = {
        ...req.user.preferences,
        ...preferences
      };
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateFields,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: user.getPublicProfile()
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile'
    });
  }
});

export default router; 