import express from 'express';
import { body, validationResult, query } from 'express-validator';
import Item from '../models/Item.js';
import { protect, optionalAuth } from '../middleware/auth.js';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Swap from '../models/Swap.js';
import User from '../models/User.js';
dotenv.config();


const router = express.Router();

// @desc    Get all items (with optional filtering)
// @route   GET /api/items
// @access  Public
router.get('/', optionalAuth, [
  query('category').optional().isIn(['tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 'accessories']),
  query('size').optional().isIn(['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size', 'Custom']),
  query('condition').optional().isIn(['new', 'like-new', 'good', 'fair', 'poor']),
  query('minPoints').optional().isInt({ min: 0 }),
  query('maxPoints').optional().isInt({ min: 0 }),
  query('search').optional().isString(),
  query('sort').optional().isIn(['newest', 'oldest', 'points-low', 'points-high', 'popular']),
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

    const {
      category,
      size,
      condition,
      minPoints,
      maxPoints,
      search,
      sort = 'newest',
      page = 1,
      limit = 12
    } = req.query;

    // Build filter object
    const filter = { status: 'active' };
    
    if (category) filter.category = category;
    if (size) filter.size = size;
    if (condition) filter.condition = condition;
    if (minPoints || maxPoints) {
      filter.points = {};
      if (minPoints) filter.points.$gte = parseInt(minPoints);
      if (maxPoints) filter.points.$lte = parseInt(maxPoints);
    }

    // Build sort object
    let sortObj = {};
    switch (sort) {
      case 'newest':
        sortObj = { createdAt: -1 };
        break;
      case 'oldest':
        sortObj = { createdAt: 1 };
        break;
      case 'points-low':
        sortObj = { points: 1 };
        break;
      case 'points-high':
        sortObj = { points: -1 };
        break;
      case 'popular':
        sortObj = { views: -1 };
        break;
      default:
        sortObj = { createdAt: -1 };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build query
    let itemsQuery = Item.find(filter).populate('owner', 'name avatar');

    // Add search if provided
    if (search) {
      itemsQuery = Item.searchItems(search, filter);
    }

    // Execute query with pagination
    const items = await itemsQuery
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
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

// @desc    Get featured items
// @route   GET /api/items/featured
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const items = await Item.getFeaturedItems(10);
    
    res.json({
      success: true,
      data: { items }
    });
  } catch (error) {
    console.error('Get featured items error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching featured items'
    });
  }
});

// @desc    Get single item
// @route   GET /api/items/:id
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)
      .populate('owner', 'name avatar bio stats')
      .populate('likes', 'name avatar');

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Increment views if user is authenticated
    if (req.user) {
      await item.incrementViews();
    }

    res.json({
      success: true,
      data: { item }
    });
  } catch (error) {
    console.error('Get item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching item'
    });
  }
});

// @desc    Create new item
// @route   POST /api/items
// @access  Private
router.post('/', protect, [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('category')
    .isIn(['tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 'accessories'])
    .withMessage('Invalid category'),
  body('size')
    .isIn(['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size', 'Custom'])
    .withMessage('Invalid size'),
  body('condition')
    .isIn(['new', 'like-new', 'good', 'fair', 'poor'])
    .withMessage('Invalid condition'),
  body('points')
    .isInt({ min: 1, max: 1000 })
    .withMessage('Points must be between 1 and 1000'),
  body('brand').optional().trim().isLength({ max: 50 }),
  body('material').optional().trim().isLength({ max: 100 }),
  body('tags').optional().isArray({ max: 10 }),
  body('tags.*').optional().trim().isLength({ max: 20 }),
  body('images').isArray({ min: 1, max: 8 }).withMessage('At least one image is required'),
  body('images.*.url').isURL().withMessage('Invalid image URL'),
  body('images.*.publicId').notEmpty().withMessage('Image public ID is required')
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

    const itemData = {
      ...req.body,
      owner: req.user._id
    };

    const item = await Item.create(itemData);

    // Award points for listing an item (encourage participation)
    const listingBonus = 10; // Base points for listing
    
    // Check if this is the user's first item
    const userItemCount = await Item.countDocuments({ owner: req.user._id });
    const firstItemBonus = userItemCount === 1 ? 25 : 0; // Bonus for first item
    
    const totalBonus = listingBonus + firstItemBonus;
    
    await req.user.updateOne({
      $inc: { 
        'stats.itemsListed': 1,
        points: totalBonus,
        'stats.totalPointsEarned': totalBonus
      }
    });

    // Check for milestones
    await req.user.checkMilestones();

    res.status(201).json({
      success: true,
      message: 'Item created successfully',
      data: { item }
    });
  } catch (error) {
    console.error('Create item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating item'
    });
  }
});

// @desc    Update item
// @route   PUT /api/items/:id
// @access  Private
router.put('/:id', protect, [
  body('title').optional().trim().isLength({ min: 3, max: 100 }),
  body('description').optional().trim().isLength({ min: 10, max: 1000 }),
  body('category').optional().isIn(['tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 'accessories']),
  body('size').optional().isIn(['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size', 'Custom']),
  body('condition').optional().isIn(['new', 'like-new', 'good', 'fair', 'poor']),
  body('points').optional().isInt({ min: 1, max: 1000 }),
  body('brand').optional().trim().isLength({ max: 50 }),
  body('material').optional().trim().isLength({ max: 100 }),
  body('tags').optional().isArray({ max: 10 }),
  body('tags.*').optional().trim().isLength({ max: 20 })
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

    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Check ownership
    if (item.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this item'
      });
    }

    // Only allow updates if item is not sold
    if (item.status === 'sold') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update sold item'
      });
    }

    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('owner', 'name avatar');

    res.json({
      success: true,
      message: 'Item updated successfully',
      data: { item: updatedItem }
    });
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating item'
    });
  }
});

// @desc    Delete item
// @route   DELETE /api/items/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Check ownership
    if (item.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this item'
      });
    }

    // Check if item has active swaps
    // TODO: Add check for active swaps

    await Item.findByIdAndDelete(req.params.id);

    // Update user stats
    await req.user.updateOne({
      $inc: { 'stats.itemsListed': -1 }
    });

    res.json({
      success: true,
      message: 'Item deleted successfully'
    });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting item'
    });
  }
});

// @desc    Toggle like on item
// @route   POST /api/items/:id/like
// @access  Private
router.post('/:id/like', protect, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    await item.toggleLike(req.user._id);

    res.json({
      success: true,
      message: 'Like toggled successfully',
      data: {
        isLiked: item.likes.includes(req.user._id),
        likesCount: item.likesCount
      }
    });
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while toggling like'
    });
  }
});

// @desc    Report item
// @route   POST /api/items/:id/report
// @access  Private
router.post('/:id/report', protect, [
  body('reason')
    .isIn(['inappropriate', 'spam', 'fake', 'damaged', 'other'])
    .withMessage('Invalid report reason'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters')
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

    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Cannot report your own item
    if (item.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot report your own item'
      });
    }

    await item.addReport(req.user._id, req.body.reason, req.body.description);

    res.json({
      success: true,
      message: 'Item reported successfully'
    });
  } catch (error) {
    console.error('Report item error:', error);
    if (error.message === 'User has already reported this item') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while reporting item'
    });
  }
});

// @desc    Buy item with points
// @route   POST /api/items/:id/buy
// @access  Private
router.post('/:id/buy', protect, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).populate('owner', 'name email');

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Check if item is available for purchase
    if (item.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Item is not available for purchase'
      });
    }

    // Check if item is redeemable
    if (!item.isRedeemable) {
      return res.status(400).json({
        success: false,
        message: 'This item cannot be purchased with points'
      });
    }

    // Check if user is trying to buy their own item
    if (item.owner._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot buy your own item'
      });
    }

    // Check if user has enough points
    if (req.user.points < item.points) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient points for this purchase',
        data: {
          required: item.points,
          available: req.user.points,
          shortfall: item.points - req.user.points
        }
      });
    }

    // Start a transaction to ensure data consistency
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Deduct points from buyer
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { 
          points: -item.points,
          'stats.totalPointsSpent': item.points
        }
      }, { session });

      // Add points to seller
      await User.findByIdAndUpdate(item.owner._id, {
        $inc: { 
          points: item.points,
          'stats.totalPointsEarned': item.points
        }
      }, { session });

      // Mark item as sold
      await Item.findByIdAndUpdate(item._id, { 
        status: 'sold' 
      }, { session });

      // Create a purchase record (using swap model for consistency)
      const purchase = new Swap({
        initiator: req.user._id,
        recipient: item.owner._id,
        recipientItem: item._id,
        type: 'redeem',
        status: 'completed', // Direct purchase is immediately completed
        points: item.points,
        message: 'Direct purchase with points',
        timeline: [{
          action: 'created',
          user: req.user._id,
          details: 'Direct purchase with points'
        }, {
          action: 'completed',
          user: req.user._id,
          details: 'Purchase completed'
        }]
      });

      await purchase.save({ session });

      // Award completion bonus points to buyer
      const completionBonus = 10; // Points for successful purchase
      
      // Check if this is the user's first purchase
      const purchaseCount = await Swap.countDocuments({ 
        initiator: req.user._id,
        type: 'redeem',
        status: 'completed'
      }, { session });
      
      const firstPurchaseBonus = 25; // Bonus for first purchase
      
      if (purchaseCount === 1) {
        await User.findByIdAndUpdate(req.user._id, {
          $inc: { 
            points: firstPurchaseBonus,
            'stats.totalPointsEarned': firstPurchaseBonus
          }
        }, { session });
      }

      await session.commitTransaction();

      // Populate the purchase for response
      const populatePaths = [
        { path: 'initiator', select: 'name avatar' },
        { path: 'recipient', select: 'name avatar' },
        { path: 'recipientItem', select: 'title images points' }
      ];
      
      // Only populate initiatorItem if it exists (for swap type)
      if (purchase.initiatorItem) {
        populatePaths.push({ path: 'initiatorItem', select: 'title images points' });
      }
      
      await purchase.populate(populatePaths);

      res.json({
        success: true,
        message: 'Purchase completed successfully',
        data: { 
          purchase,
          pointsSpent: item.points,
          bonusEarned: purchaseCount === 1 ? firstPurchaseBonus : 0
        }
      });

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

  } catch (error) {
    console.error('Buy item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while processing purchase'
    });
  }
});

// @desc    Get user's items
// @route   GET /api/items/user/:userId
// @access  Public
router.get('/user/:userId', optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const items = await Item.find({
      owner: req.params.userId,
      status: 'active'
    })
    .populate('owner', 'name avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    const total = await Item.countDocuments({
      owner: req.params.userId,
      status: 'active'
    });

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

export default router; 