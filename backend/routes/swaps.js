import express from 'express';
import { body, validationResult, query } from 'express-validator';
import Swap from '../models/Swap.js';
import Item from '../models/Item.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import dotenv from 'dotenv';
dotenv.config();


const router = express.Router();

// @desc    Get user's swaps
// @route   GET /api/swaps
// @access  Private
router.get('/', protect, [
  query('status').optional().isIn(['pending', 'accepted', 'rejected', 'completed', 'cancelled']),
  query('type').optional().isIn(['swap', 'redeem']),
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

    const { status, type, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build query
    const query = {
      $or: [{ initiator: req.user._id }, { recipient: req.user._id }]
    };

    if (status) query.status = status;
    if (type) query.type = type;

    const swaps = await Swap.find(query)
      .populate('initiator', 'name avatar')
      .populate('recipient', 'name avatar')
      .populate('initiatorItem', 'title images points')
      .populate('recipientItem', 'title images points')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Swap.countDocuments(query);

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

// @desc    Get pending swaps for user
// @route   GET /api/swaps/pending
// @access  Private
router.get('/pending', protect, async (req, res) => {
  try {
    const swaps = await Swap.getPendingSwaps(req.user._id);

    res.json({
      success: true,
      data: { swaps }
    });
  } catch (error) {
    console.error('Get pending swaps error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching pending swaps'
    });
  }
});

// @desc    Get single swap
// @route   GET /api/swaps/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const swap = await Swap.findById(req.params.id)
      .populate('initiator', 'name avatar email')
      .populate('recipient', 'name avatar email')
      .populate('initiatorItem', 'title images points description')
      .populate('recipientItem', 'title images points description');

    if (!swap) {
      return res.status(404).json({
        success: false,
        message: 'Swap not found'
      });
    }

    // Check if user is part of this swap
    if (swap.initiator._id.toString() !== req.user._id.toString() && 
        swap.recipient._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this swap'
      });
    }

    res.json({
      success: true,
      data: { swap }
    });
  } catch (error) {
    console.error('Get swap error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching swap'
    });
  }
});

// @desc    Create swap request
// @route   POST /api/swaps
// @access  Private
router.post('/', protect, [
  body('recipientItem')
    .isMongoId()
    .withMessage('Valid recipient item ID is required'),
  body('type')
    .isIn(['swap', 'redeem'])
    .withMessage('Type must be either swap or redeem'),
  body('message')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Message cannot be more than 500 characters'),
  body('initiatorItem')
    .optional()
    .isMongoId()
    .withMessage('Valid initiator item ID is required for swaps')
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

    const { recipientItem, type, message, initiatorItem } = req.body;

    // Get recipient item
    const recipientItemDoc = await Item.findById(recipientItem);
    if (!recipientItemDoc) {
      return res.status(404).json({
        success: false,
        message: 'Recipient item not found'
      });
    }

    // Check if recipient item is available
    if (recipientItemDoc.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Recipient item is not available'
      });
    }

    // Check if user is trying to swap with themselves
    if (recipientItemDoc.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot swap with your own item'
      });
    }

    let initiatorItemDoc = null;

    if (type === 'swap') {
      // For swaps, initiator item is required
      if (!initiatorItem) {
        return res.status(400).json({
          success: false,
          message: 'Initiator item is required for swaps'
        });
      }

      initiatorItemDoc = await Item.findById(initiatorItem);
      if (!initiatorItemDoc) {
        return res.status(404).json({
          success: false,
          message: 'Initiator item not found'
        });
      }

      // Check if initiator item belongs to user
      if (initiatorItemDoc.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to use this item'
        });
      }

      // Check if initiator item is available
      if (initiatorItemDoc.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: 'Initiator item is not available'
        });
      }
    } else {
      // For redeems, check if user has enough points
      if (req.user.points < recipientItemDoc.points) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient points for this item'
        });
      }
    }

    // Check if there's already a pending swap for this item
    const existingSwap = await Swap.findOne({
      recipientItem: recipientItem,
      status: 'pending',
      expiresAt: { $gt: new Date() }
    });

    if (existingSwap) {
      return res.status(400).json({
        success: false,
        message: 'This item already has a pending swap request'
      });
    }

    // Create swap
    const swapData = {
      initiator: req.user._id,
      recipient: recipientItemDoc.owner,
      recipientItem: recipientItem,
      type,
      message,
      points: type === 'redeem' ? recipientItemDoc.points : 0
    };

    if (type === 'swap') {
      swapData.initiatorItem = initiatorItem;
    }

    const swap = await Swap.create(swapData);

    // Populate the swap for response
    await swap.populate([
      { path: 'initiator', select: 'name avatar' },
      { path: 'recipient', select: 'name avatar' },
      { path: 'initiatorItem', select: 'title images points' },
      { path: 'recipientItem', select: 'title images points' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Swap request created successfully',
      data: { swap }
    });
  } catch (error) {
    console.error('Create swap error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating swap'
    });
  }
});

// @desc    Accept swap
// @route   PUT /api/swaps/:id/accept
// @access  Private
router.put('/:id/accept', protect, async (req, res) => {
  try {
    const swap = await Swap.findById(req.params.id);

    if (!swap) {
      return res.status(404).json({
        success: false,
        message: 'Swap not found'
      });
    }

    // Check if user is the recipient
    if (swap.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to accept this swap'
      });
    }

    await swap.accept(req.user._id);

    // Update item statuses
    await Item.findByIdAndUpdate(swap.recipientItem, { status: 'sold' });
    if (swap.initiatorItem) {
      await Item.findByIdAndUpdate(swap.initiatorItem, { status: 'sold' });
    }

    // Handle points for redeem
    if (swap.type === 'redeem') {
      // Deduct points from initiator
      await User.findByIdAndUpdate(swap.initiator, {
        $inc: { 
          points: -swap.points,
          'stats.totalPointsSpent': swap.points
        }
      });

      // Add points to recipient
      await User.findByIdAndUpdate(swap.recipient, {
        $inc: { 
          points: swap.points,
          'stats.totalPointsEarned': swap.points
        }
      });
    }

    res.json({
      success: true,
      message: 'Swap accepted successfully',
      data: { swap }
    });
  } catch (error) {
    console.error('Accept swap error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while accepting swap'
    });
  }
});

// @desc    Reject swap
// @route   PUT /api/swaps/:id/reject
// @access  Private
router.put('/:id/reject', protect, async (req, res) => {
  try {
    const swap = await Swap.findById(req.params.id);

    if (!swap) {
      return res.status(404).json({
        success: false,
        message: 'Swap not found'
      });
    }

    // Check if user is the recipient
    if (swap.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to reject this swap'
      });
    }

    await swap.reject(req.user._id);

    res.json({
      success: true,
      message: 'Swap rejected successfully',
      data: { swap }
    });
  } catch (error) {
    console.error('Reject swap error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while rejecting swap'
    });
  }
});

// @desc    Mark item as shipped
// @route   PUT /api/swaps/:id/ship
// @access  Private
router.put('/:id/ship', protect, [
  body('trackingNumber')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Tracking number cannot be more than 100 characters')
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

    const { trackingNumber } = req.body;
    const swap = await Swap.findById(req.params.id);

    if (!swap) {
      return res.status(404).json({
        success: false,
        message: 'Swap not found'
      });
    }

    // Check if user is part of this swap
    if (swap.initiator.toString() !== req.user._id.toString() && 
        swap.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this swap'
      });
    }

    await swap.markShipped(req.user._id, trackingNumber);

    res.json({
      success: true,
      message: 'Item marked as shipped successfully',
      data: { swap }
    });
  } catch (error) {
    console.error('Mark shipped error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while marking as shipped'
    });
  }
});

// @desc    Mark item as received
// @route   PUT /api/swaps/:id/receive
// @access  Private
router.put('/:id/receive', protect, async (req, res) => {
  try {
    const swap = await Swap.findById(req.params.id);

    if (!swap) {
      return res.status(404).json({
        success: false,
        message: 'Swap not found'
      });
    }

    // Check if user is part of this swap
    if (swap.initiator.toString() !== req.user._id.toString() && 
        swap.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this swap'
      });
    }

    await swap.markReceived(req.user._id);

    // Update user stats if swap is completed
    if (swap.status === 'completed') {
      await User.findByIdAndUpdate(swap.initiator, {
        $inc: { 'stats.swapsCompleted': 1 }
      });
      await User.findByIdAndUpdate(swap.recipient, {
        $inc: { 'stats.swapsCompleted': 1 }
      });
    }

    res.json({
      success: true,
      message: 'Item marked as received successfully',
      data: { swap }
    });
  } catch (error) {
    console.error('Mark received error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while marking as received'
    });
  }
});

// @desc    Rate swap
// @route   POST /api/swaps/:id/rate
// @access  Private
router.post('/:id/rate', protect, [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Comment cannot be more than 200 characters')
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

    const { rating, comment } = req.body;
    const swap = await Swap.findById(req.params.id);

    if (!swap) {
      return res.status(404).json({
        success: false,
        message: 'Swap not found'
      });
    }

    // Check if user is part of this swap
    if (swap.initiator.toString() !== req.user._id.toString() && 
        swap.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to rate this swap'
      });
    }

    await swap.addRating(req.user._id, rating, comment);

    res.json({
      success: true,
      message: 'Swap rated successfully',
      data: { swap }
    });
  } catch (error) {
    console.error('Rate swap error:', error);
    if (error.message.includes('already rated')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while rating swap'
    });
  }
});

// @desc    Raise dispute
// @route   POST /api/swaps/:id/dispute
// @access  Private
router.post('/:id/dispute', protect, [
  body('reason')
    .isIn(['item-not-as-described', 'damaged', 'not-received', 'other'])
    .withMessage('Invalid dispute reason'),
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

    const { reason, description } = req.body;
    const swap = await Swap.findById(req.params.id);

    if (!swap) {
      return res.status(404).json({
        success: false,
        message: 'Swap not found'
      });
    }

    // Check if user is part of this swap
    if (swap.initiator.toString() !== req.user._id.toString() && 
        swap.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to dispute this swap'
      });
    }

    await swap.raiseDispute(req.user._id, reason, description);

    res.json({
      success: true,
      message: 'Dispute raised successfully',
      data: { swap }
    });
  } catch (error) {
    console.error('Raise dispute error:', error);
    if (error.message.includes('already exists')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while raising dispute'
    });
  }
});

export default router; 