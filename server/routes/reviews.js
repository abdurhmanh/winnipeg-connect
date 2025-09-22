const express = require('express');
const Review = require('../models/Review');
const Job = require('../models/Job');
const User = require('../models/User');
const { authenticateToken, authorize } = require('../middleware/auth');
const { validateReviewCreation, validatePagination, validateObjectId } = require('../utils/validation');

const router = express.Router();

// @route   POST /api/reviews
// @desc    Create a new review
// @access  Private
router.post('/', authenticateToken, validateReviewCreation, async (req, res) => {
  try {
    const {
      job: jobId,
      reviewee: revieweeId,
      rating,
      title,
      comment,
      wouldRecommend,
      wouldHireAgain,
      tags
    } = req.body;

    // Check if job exists and is completed
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.status !== 'completed') {
      return res.status(400).json({ message: 'Job must be completed before reviewing' });
    }

    // Check if user is authorized to review (either job owner or selected provider)
    const isJobOwner = job.postedBy.toString() === req.user._id.toString();
    const isSelectedProvider = job.selectedProvider && job.selectedProvider.toString() === req.user._id.toString();

    if (!isJobOwner && !isSelectedProvider) {
      return res.status(403).json({ message: 'Not authorized to review this job' });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({
      job: jobId,
      reviewer: req.user._id,
      reviewee: revieweeId
    });

    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this job' });
    }

    // Determine reviewer type
    const reviewerType = req.user.role;

    // Create review
    const review = new Review({
      job: jobId,
      reviewer: req.user._id,
      reviewee: revieweeId,
      reviewerType,
      rating,
      title,
      comment,
      wouldRecommend,
      wouldHireAgain,
      tags: tags || []
    });

    await review.save();

    // Update reviewee's rating
    const reviewee = await User.findById(revieweeId);
    if (reviewee) {
      reviewee.updateRating(rating.overall);
      await reviewee.save();
    }

    // Update job with review reference if it's the first review
    if (!job.review) {
      job.review = review._id;
      await job.save();
    }

    // Populate review for response
    await review.populate([
      { path: 'reviewer', select: 'firstName lastName avatar' },
      { path: 'reviewee', select: 'firstName lastName avatar' },
      { path: 'job', select: 'title category' }
    ]);

    res.status(201).json({
      message: 'Review created successfully',
      review
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ message: 'Server error during review creation' });
  }
});

// @route   GET /api/reviews/user/:userId
// @desc    Get reviews for a specific user
// @access  Public
router.get('/user/:userId', validateObjectId('userId'), validatePagination, async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const filter = { 
      reviewee: userId, 
      isVisible: true 
    };

    // Filter by rating
    if (req.query.rating) {
      filter['rating.overall'] = parseInt(req.query.rating);
    }

    // Filter by reviewer type
    if (req.query.reviewerType) {
      filter.reviewerType = req.query.reviewerType;
    }

    const reviews = await Review.find(filter)
      .populate('reviewer', 'firstName lastName avatar')
      .populate('job', 'title category createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments(filter);

    // Calculate rating distribution
    const ratingDistribution = await Review.aggregate([
      { $match: { reviewee: mongoose.Types.ObjectId(userId), isVisible: true } },
      { $group: { 
          _id: '$rating.overall', 
          count: { $sum: 1 } 
        } 
      },
      { $sort: { _id: -1 } }
    ]);

    // Calculate average ratings by category
    const categoryRatings = await Review.aggregate([
      { $match: { reviewee: mongoose.Types.ObjectId(userId), isVisible: true, reviewerType: 'seeker' } },
      { $group: {
          _id: null,
          avgQuality: { $avg: '$rating.quality' },
          avgCommunication: { $avg: '$rating.communication' },
          avgPunctuality: { $avg: '$rating.punctuality' },
          avgProfessionalism: { $avg: '$rating.professionalism' }
        }
      }
    ]);

    res.json({
      reviews,
      stats: {
        total,
        averageRating: user.rating.average,
        ratingDistribution,
        categoryRatings: categoryRatings[0] || {}
      },
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reviews/my-reviews
// @desc    Get current user's reviews (given and received)
// @access  Private
router.get('/my-reviews', authenticateToken, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const type = req.query.type || 'received'; // 'received' or 'given'

    const filter = type === 'received' 
      ? { reviewee: req.user._id }
      : { reviewer: req.user._id };

    const reviews = await Review.find(filter)
      .populate('reviewer', 'firstName lastName avatar')
      .populate('reviewee', 'firstName lastName avatar')
      .populate('job', 'title category createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments(filter);

    res.json({
      reviews,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get my reviews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reviews/:id
// @desc    Get review by ID
// @access  Public
router.get('/:id', validateObjectId('id'), async (req, res) => {
  try {
    const review = await Review.findOne({ 
      _id: req.params.id, 
      isVisible: true 
    })
    .populate('reviewer', 'firstName lastName avatar')
    .populate('reviewee', 'firstName lastName avatar')
    .populate('job', 'title category description');

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.json({ review });
  } catch (error) {
    console.error('Get review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/reviews/:id/response
// @desc    Add response to review
// @access  Private (Reviewee only)
router.put('/:id/response', authenticateToken, validateObjectId('id'), async (req, res) => {
  try {
    const { comment } = req.body;

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({ message: 'Response comment is required' });
    }

    if (comment.length > 500) {
      return res.status(400).json({ message: 'Response comment must be less than 500 characters' });
    }

    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if user is the reviewee
    if (review.reviewee.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to respond to this review' });
    }

    // Check if response already exists
    if (review.response && review.response.comment) {
      return res.status(400).json({ message: 'Response already exists for this review' });
    }

    review.response = {
      comment: comment.trim(),
      createdAt: new Date()
    };

    await review.save();

    res.json({
      message: 'Response added successfully',
      review
    });
  } catch (error) {
    console.error('Add review response error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/reviews/:id/helpful
// @desc    Mark review as helpful
// @access  Private
router.post('/:id/helpful', authenticateToken, validateObjectId('id'), async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if user can vote (not their own review)
    if (review.reviewer.toString() === req.user._id.toString() || 
        review.reviewee.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot vote on your own review' });
    }

    const added = review.addHelpfulVote(req.user._id);

    if (!added) {
      return res.status(400).json({ message: 'You have already marked this review as helpful' });
    }

    await review.save();

    res.json({
      message: 'Review marked as helpful',
      helpfulCount: review.helpfulCount
    });
  } catch (error) {
    console.error('Mark helpful error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/reviews/:id/helpful
// @desc    Remove helpful vote
// @access  Private
router.delete('/:id/helpful', authenticateToken, validateObjectId('id'), async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const removed = review.removeHelpfulVote(req.user._id);

    if (!removed) {
      return res.status(400).json({ message: 'You have not marked this review as helpful' });
    }

    await review.save();

    res.json({
      message: 'Helpful vote removed',
      helpfulCount: review.helpfulCount
    });
  } catch (error) {
    console.error('Remove helpful vote error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/reviews/:id/report
// @desc    Report a review
// @access  Private
router.post('/:id/report', authenticateToken, validateObjectId('id'), async (req, res) => {
  try {
    const { reason, details } = req.body;

    const validReasons = ['inappropriate', 'fake', 'spam', 'harassment', 'other'];
    if (!reason || !validReasons.includes(reason)) {
      return res.status(400).json({ message: 'Valid reason is required' });
    }

    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if user already reported this review
    const existingReport = review.reports.find(
      report => report.reporter.toString() === req.user._id.toString()
    );

    if (existingReport) {
      return res.status(400).json({ message: 'You have already reported this review' });
    }

    review.reports.push({
      reporter: req.user._id,
      reason,
      details: details || ''
    });

    review.isReported = true;
    await review.save();

    res.json({ message: 'Review reported successfully' });
  } catch (error) {
    console.error('Report review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reviews/stats/overview
// @desc    Get review statistics
// @access  Public
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = {
      totalReviews: await Review.countDocuments({ isVisible: true }),
      averageRating: 0,
      ratingDistribution: await Review.aggregate([
        { $match: { isVisible: true } },
        { $group: { 
            _id: '$rating.overall', 
            count: { $sum: 1 } 
          } 
        },
        { $sort: { _id: -1 } }
      ]),
      topTags: await Review.aggregate([
        { $match: { isVisible: true } },
        { $unwind: '$tags' },
        { $group: { 
            _id: '$tags', 
            count: { $sum: 1 } 
          } 
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    };

    // Calculate overall average rating
    const avgResult = await Review.aggregate([
      { $match: { isVisible: true } },
      { $group: { 
          _id: null, 
          avgRating: { $avg: '$rating.overall' } 
        } 
      }
    ]);

    if (avgResult.length > 0) {
      stats.averageRating = Math.round(avgResult[0].avgRating * 10) / 10;
    }

    res.json({ stats });
  } catch (error) {
    console.error('Get review stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/reviews/:id
// @desc    Delete/Hide review (admin function or self-delete)
// @access  Private
router.delete('/:id', authenticateToken, validateObjectId('id'), async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Only reviewer can delete their own review (within time limit)
    if (review.reviewer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this review' });
    }

    // Check if review is recent enough to delete (24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    if (review.createdAt < twentyFourHoursAgo) {
      return res.status(400).json({ message: 'Reviews can only be deleted within 24 hours of creation' });
    }

    // Hide the review instead of deleting to preserve data integrity
    review.isVisible = false;
    await review.save();

    // Recalculate reviewee's rating
    const reviewee = await User.findById(review.reviewee);
    if (reviewee) {
      const visibleReviews = await Review.find({ 
        reviewee: review.reviewee, 
        isVisible: true 
      });
      
      if (visibleReviews.length > 0) {
        const totalRating = visibleReviews.reduce((sum, r) => sum + r.rating.overall, 0);
        reviewee.rating.average = totalRating / visibleReviews.length;
        reviewee.rating.count = visibleReviews.length;
      } else {
        reviewee.rating.average = 0;
        reviewee.rating.count = 0;
      }
      
      await reviewee.save();
    }

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
