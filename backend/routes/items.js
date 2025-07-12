import express from 'express';
import { body, validationResult, query } from 'express-validator';
import Item from '../models/Item.js';
import { protect, optionalAuth } from '../middleware/auth.js';
import dotenv from 'dotenv';
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

    // Update user stats
    await req.user.updateOne({
      $inc: { 'stats.itemsListed': 1 }
    });

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