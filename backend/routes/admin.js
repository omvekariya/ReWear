import express from 'express';
import { body, validationResult, query } from 'express-validator';
import User from '../models/User.js';
import Item from '../models/Item.js';
import Swap from '../models/Swap.js';
import { protect, admin } from '../middleware/auth.js';
import dotenv from 'dotenv';
dotenv.config();


const router = express.Router();

// Apply admin middleware to all routes
router.use(protect, admin);

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
router.get('/stats', async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      pendingUsers,
      totalItems,
      activeItems,
      pendingItems,
      flaggedItems,
      totalSwaps,
      completedSwaps,
      pendingSwaps,
      totalPoints,
      pointsStats
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'active' }),
      User.countDocuments({ status: 'pending' }),
      Item.countDocuments(),
      Item.countDocuments({ status: 'active' }),
      Item.countDocuments({ status: 'pending' }),
      Item.countDocuments({ status: 'flagged' }),
      Swap.countDocuments(),
      Swap.countDocuments({ status: 'completed' }),
      Swap.countDocuments({ status: 'pending' }),
      User.aggregate([
        { $group: { _id: null, total: { $sum: '$points' } } }
      ]),
      User.aggregate([
        {
          $group: {
            _id: null,
            totalEarned: { $sum: '$stats.totalPointsEarned' },
            totalSpent: { $sum: '$stats.totalPointsSpent' },
            avgPointsPerUser: { $avg: '$points' },
            maxPoints: { $max: '$points' }
          }
        }
      ])
    ]);

    // Get recent activity
    const recentSwaps = await Swap.find()
      .populate('initiator', 'name')
      .populate('recipient', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentItems = await Item.find()
      .populate('owner', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        stats: {
          users: {
            total: totalUsers,
            active: activeUsers,
            pending: pendingUsers
          },
          items: {
            total: totalItems,
            active: activeItems,
            pending: pendingItems,
            flagged: flaggedItems
          },
          swaps: {
            total: totalSwaps,
            completed: completedSwaps,
            pending: pendingSwaps
          },
          points: {
            total: totalPoints[0]?.total || 0,
            totalEarned: pointsStats[0]?.totalEarned || 0,
            totalSpent: pointsStats[0]?.totalSpent || 0,
            avgPerUser: Math.round(pointsStats[0]?.avgPointsPerUser || 0),
            maxPoints: pointsStats[0]?.maxPoints || 0
          }
        },
        recentActivity: {
          swaps: recentSwaps,
          items: recentItems
        }
      }
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching admin stats'
    });
  }
});

// @desc    Get all users (with filtering)
// @route   GET /api/admin/users
// @access  Private/Admin
router.get('/users', [
  query('status').optional().isIn(['active', 'pending', 'suspended']),
  query('role').optional().isIn(['user', 'admin']),
  query('search').optional().isString(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
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

    const { status, role, search, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

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
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users'
    });
  }
});

// @desc    Update user status
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
router.put('/users/:id/status', [
  body('status')
    .isIn(['active', 'pending', 'suspended'])
    .withMessage('Invalid status')
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

    const { status } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User status updated successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating user status'
    });
  }
});

// @desc    Get all items (with filtering)
// @route   GET /api/admin/items
// @access  Private/Admin
router.get('/items', [
  query('status').optional().isIn(['active', 'pending', 'sold', 'removed', 'flagged']),
  query('category').optional().isIn(['tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 'accessories']),
  query('search').optional().isString(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
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

    const { status, category, search, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const items = await Item.find(filter)
      .populate('owner', 'name email')
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
    console.error('Get items error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching items'
    });
  }
});

// @desc    Approve item
// @route   PUT /api/admin/items/:id/approve
// @access  Private/Admin
router.put('/items/:id/approve', async (req, res) => {
  try {
    const item = await Item.findByIdAndUpdate(
      req.params.id,
      {
        status: 'active',
        approvedBy: req.user._id,
        approvedAt: new Date()
      },
      { new: true }
    ).populate('owner', 'name email');

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    res.json({
      success: true,
      message: 'Item approved successfully',
      data: { item }
    });
  } catch (error) {
    console.error('Approve item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while approving item'
    });
  }
});

// @desc    Reject item
// @route   PUT /api/admin/items/:id/reject
// @access  Private/Admin
router.put('/items/:id/reject', [
  body('reason')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Reason must be between 5 and 500 characters')
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

    const { reason } = req.body;
    const item = await Item.findByIdAndUpdate(
      req.params.id,
      {
        status: 'removed',
        adminNotes: reason,
        approvedBy: req.user._id,
        approvedAt: new Date()
      },
      { new: true }
    ).populate('owner', 'name email');

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    res.json({
      success: true,
      message: 'Item rejected successfully',
      data: { item }
    });
  } catch (error) {
    console.error('Reject item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while rejecting item'
    });
  }
});

// @desc    Feature item
// @route   PUT /api/admin/items/:id/feature
// @access  Private/Admin
router.put('/items/:id/feature', [
  body('featured')
    .isBoolean()
    .withMessage('Featured must be a boolean'),
  body('featuredUntil')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format')
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

    const { featured, featuredUntil } = req.body;
    const updateData = { featured };

    if (featured && featuredUntil) {
      updateData.featuredUntil = new Date(featuredUntil);
    } else if (!featured) {
      updateData.featuredUntil = null;
    }

    const item = await Item.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('owner', 'name email');

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    res.json({
      success: true,
      message: `Item ${featured ? 'featured' : 'unfeatured'} successfully`,
      data: { item }
    });
  } catch (error) {
    console.error('Feature item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while featuring item'
    });
  }
});

// @desc    Get flagged items
// @route   GET /api/admin/items/flagged
// @access  Private/Admin
router.get('/items/flagged', async (req, res) => {
  try {
    const items = await Item.find({ status: 'flagged' })
      .populate('owner', 'name email')
      .populate('reports.user', 'name email')
      .sort({ 'reports.length': -1, createdAt: -1 });

    res.json({
      success: true,
      data: { items }
    });
  } catch (error) {
    console.error('Get flagged items error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching flagged items'
    });
  }
});

// @desc    Resolve item reports
// @route   PUT /api/admin/items/:id/resolve-reports
// @access  Private/Admin
router.put('/items/:id/resolve-reports', [
  body('action')
    .isIn(['approve', 'remove', 'warn'])
    .withMessage('Invalid action'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot be more than 500 characters')
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

    const { action, notes } = req.body;
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    let status = 'active';
    if (action === 'remove') {
      status = 'removed';
    }

    item.status = status;
    item.adminNotes = notes;
    item.reports = []; // Clear reports
    await item.save();

    res.json({
      success: true,
      message: 'Item reports resolved successfully',
      data: { item }
    });
  } catch (error) {
    console.error('Resolve reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while resolving reports'
    });
  }
});

// @desc    Get all swaps (with filtering)
// @route   GET /api/admin/swaps
// @access  Private/Admin
router.get('/swaps', [
  query('status').optional().isIn(['pending', 'accepted', 'rejected', 'completed', 'cancelled']),
  query('type').optional().isIn(['swap', 'redeem']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
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

    const { status, type, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;

    const swaps = await Swap.find(filter)
      .populate('initiator', 'name email')
      .populate('recipient', 'name email')
      .populate('initiatorItem', 'title')
      .populate('recipientItem', 'title')
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
    console.error('Get swaps error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching swaps'
    });
  }
});

// @desc    Get disputes
// @route   GET /api/admin/disputes
// @access  Private/Admin
router.get('/disputes', async (req, res) => {
  try {
    const swaps = await Swap.find({
      'dispute.status': 'open'
    })
    .populate('initiator', 'name email')
    .populate('recipient', 'name email')
    .populate('initiatorItem', 'title')
    .populate('recipientItem', 'title')
    .sort({ 'dispute.createdAt': -1 });

    res.json({
      success: true,
      data: { swaps }
    });
  } catch (error) {
    console.error('Get disputes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching disputes'
    });
  }
});

// @desc    Resolve dispute
// @route   PUT /api/admin/swaps/:id/resolve-dispute
// @access  Private/Admin
router.put('/swaps/:id/resolve-dispute', [
  body('resolution')
    .isIn(['favor-initiator', 'favor-recipient', 'partial-refund', 'cancel'])
    .withMessage('Invalid resolution'),
  body('notes')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Notes must be between 5 and 500 characters')
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

    const { resolution, notes } = req.body;
    const swap = await Swap.findById(req.params.id);

    if (!swap) {
      return res.status(404).json({
        success: false,
        message: 'Swap not found'
      });
    }

    if (swap.dispute.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: 'Dispute is not open'
      });
    }

    // Update dispute
    swap.dispute.status = 'resolved';
    swap.dispute.adminNotes = notes;
    swap.dispute.resolvedBy = req.user._id;
    swap.dispute.resolvedAt = new Date();

    // Handle resolution
    switch (resolution) {
      case 'favor-initiator':
        // Return items to original owners
        await Item.findByIdAndUpdate(swap.recipientItem, { status: 'active' });
        if (swap.initiatorItem) {
          await Item.findByIdAndUpdate(swap.initiatorItem, { status: 'active' });
        }
        swap.status = 'cancelled';
        break;
      case 'favor-recipient':
        // Keep items as exchanged
        swap.status = 'completed';
        break;
      case 'partial-refund':
        // Handle partial refund logic
        if (swap.type === 'redeem') {
          const refundAmount = Math.floor(swap.points * 0.5);
          await User.findByIdAndUpdate(swap.initiator, {
            $inc: { points: refundAmount }
          });
        }
        swap.status = 'completed';
        break;
      case 'cancel':
        // Return items to original owners
        await Item.findByIdAndUpdate(swap.recipientItem, { status: 'active' });
        if (swap.initiatorItem) {
          await Item.findByIdAndUpdate(swap.initiatorItem, { status: 'active' });
        }
        swap.status = 'cancelled';
        break;
    }

    await swap.save();

    res.json({
      success: true,
      message: 'Dispute resolved successfully',
      data: { swap }
    });
  } catch (error) {
    console.error('Resolve dispute error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while resolving dispute'
    });
  }
});

export default router; 