const express = require('express');
const multer = require('multer');
const Job = require('../models/Job');
const Quote = require('../models/Quote');
const User = require('../models/User');
const cloudinary = require('../config/cloudinary');
const { authenticateToken, authorize, checkOwnership, optionalAuth } = require('../middleware/auth');
const { validateJobCreation, validatePagination, validateObjectId, validateSearch } = require('../utils/validation');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.some(type => file.mimetype.startsWith(type))) {
      cb(null, true);
    } else {
      cb(new Error('Only images and documents are allowed'), false);
    }
  },
});

// @route   GET /api/jobs
// @desc    Get all jobs with filtering and search
// @access  Public (with optional auth for personalization)
router.get('/', optionalAuth, validatePagination, validateSearch, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter query
    const filter = { status: 'open' };

    // Category filter
    if (req.query.category) {
      filter.category = req.query.category;
    }

    // Budget filter
    if (req.query.minBudget || req.query.maxBudget) {
      const budgetFilter = {};
      
      if (req.query.minBudget) {
        budgetFilter.$or = [
          { 'budget.amount': { $gte: parseFloat(req.query.minBudget) } },
          { 'budget.range.min': { $gte: parseFloat(req.query.minBudget) } }
        ];
      }
      
      if (req.query.maxBudget) {
        const maxBudgetFilter = {
          $or: [
            { 'budget.amount': { $lte: parseFloat(req.query.maxBudget) } },
            { 'budget.range.max': { $lte: parseFloat(req.query.maxBudget) } }
          ]
        };
        
        if (budgetFilter.$or) {
          filter.$and = [budgetFilter, maxBudgetFilter];
        } else {
          Object.assign(filter, maxBudgetFilter);
        }
      } else if (budgetFilter.$or) {
        Object.assign(filter, budgetFilter);
      }
    }

    // Location filter
    if (req.query.lat && req.query.lng) {
      const lat = parseFloat(req.query.lat);
      const lng = parseFloat(req.query.lng);
      const radius = parseFloat(req.query.radius) || 25; // 25km default

      filter['location.coordinates'] = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          $maxDistance: radius * 1000 // Convert km to meters
        }
      };
    }

    // Search query
    if (req.query.q) {
      const searchRegex = new RegExp(req.query.q, 'i');
      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { category: searchRegex },
        { subcategories: { $in: [searchRegex] } }
      ];
    }

    // Priority filter
    if (req.query.priority) {
      filter.priority = req.query.priority;
    }

    // Timeline filter
    if (req.query.startDate) {
      filter['timeline.startDate'] = { $gte: new Date(req.query.startDate) };
    }

    // Execute query
    const jobs = await Job.find(filter)
      .populate('postedBy', 'firstName lastName avatar rating')
      .populate('quotes')
      .sort(getSortOptions(req.query.sort))
      .skip(skip)
      .limit(limit);

    const total = await Job.countDocuments(filter);

    // Add distance calculation if location provided
    if (req.query.lat && req.query.lng) {
      const userLat = parseFloat(req.query.lat);
      const userLng = parseFloat(req.query.lng);
      
      jobs.forEach(job => {
        if (job.location.coordinates.coordinates[0] && job.location.coordinates.coordinates[1]) {
          job._doc.distance = job.calculateDistance(userLat, userLng);
        }
      });
    }

    res.json({
      jobs,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      },
      filters: {
        category: req.query.category,
        minBudget: req.query.minBudget,
        maxBudget: req.query.maxBudget,
        location: req.query.lat && req.query.lng ? { lat: req.query.lat, lng: req.query.lng, radius: req.query.radius } : null
      }
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/jobs/my-jobs
// @desc    Get current user's jobs
// @access  Private
router.get('/my-jobs', authenticateToken, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { postedBy: req.user._id };

    // Status filter
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const jobs = await Job.find(filter)
      .populate('selectedProvider', 'firstName lastName avatar rating')
      .populate({
        path: 'quotes',
        populate: {
          path: 'provider',
          select: 'firstName lastName avatar rating'
        }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Job.countDocuments(filter);

    res.json({
      jobs,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get my jobs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/jobs
// @desc    Create a new job
// @access  Private (Seeker only)
router.post('/', authenticateToken, authorize('seeker'), upload.array('images', 5), validateJobCreation, async (req, res) => {
  try {
    const jobData = req.body;
    jobData.postedBy = req.user._id;

    // Handle image uploads
    if (req.files && req.files.length > 0) {
      const uploadedImages = [];

      for (const file of req.files) {
        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              folder: 'winnipeg-connect/jobs',
              resource_type: 'auto'
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(file.buffer);
        });

        uploadedImages.push({
          url: result.secure_url,
          publicId: result.public_id,
          description: file.originalname
        });
      }

      jobData.images = uploadedImages;
    }

    const job = new Job(jobData);
    await job.save();

    // Populate the response
    await job.populate('postedBy', 'firstName lastName avatar');

    res.status(201).json({
      message: 'Job created successfully',
      job
    });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ message: 'Server error during job creation' });
  }
});

// @route   GET /api/jobs/:id
// @desc    Get job by ID
// @access  Public (with optional auth)
router.get('/:id', optionalAuth, validateObjectId('id'), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('postedBy', 'firstName lastName avatar rating location')
      .populate({
        path: 'quotes',
        populate: {
          path: 'provider',
          select: 'firstName lastName avatar rating categories portfolio'
        }
      })
      .populate('selectedProvider', 'firstName lastName avatar rating')
      .populate('review');

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Increment view count if not the job owner
    if (!req.user || req.user._id.toString() !== job.postedBy._id.toString()) {
      job.views += 1;
      await job.save();
    }

    // Check if current user has saved this job
    let isSaved = false;
    if (req.user) {
      isSaved = job.saves.includes(req.user._id);
    }

    // Filter quotes based on user role
    let filteredQuotes = job.quotes;
    if (req.user) {
      if (req.user.role === 'seeker' && req.user._id.toString() === job.postedBy._id.toString()) {
        // Seeker can see all quotes for their job
        filteredQuotes = job.quotes;
      } else if (req.user.role === 'provider') {
        // Provider can only see their own quote
        filteredQuotes = job.quotes.filter(quote => 
          quote.provider._id.toString() === req.user._id.toString()
        );
      } else {
        // Other users can't see quotes
        filteredQuotes = [];
      }
    } else {
      // Anonymous users can't see quotes
      filteredQuotes = [];
    }

    const jobResponse = {
      ...job.toObject(),
      quotes: filteredQuotes,
      isSaved,
      canApply: req.user && 
                req.user.role === 'provider' && 
                job.status === 'open' && 
                !job.quotes.some(q => q.provider._id.toString() === req.user._id.toString())
    };

    res.json({ job: jobResponse });
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/jobs/:id
// @desc    Update job
// @access  Private (Job owner only)
router.put('/:id', authenticateToken, authorize('seeker'), validateObjectId('id'), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check ownership
    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this job' });
    }

    // Prevent updates if job is no longer open
    if (job.status !== 'open') {
      return res.status(400).json({ message: 'Cannot update job that is no longer open' });
    }

    const updates = req.body;
    delete updates._id;
    delete updates.postedBy;
    delete updates.quotes;
    delete updates.selectedProvider;

    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('postedBy', 'firstName lastName avatar');

    res.json({
      message: 'Job updated successfully',
      job: updatedJob
    });
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/jobs/:id
// @desc    Delete/Cancel job
// @access  Private (Job owner only)
router.delete('/:id', authenticateToken, authorize('seeker'), validateObjectId('id'), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check ownership
    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this job' });
    }

    // If job has been started, mark as cancelled instead of deleting
    if (job.selectedProvider) {
      job.status = 'cancelled';
      await job.save();
      
      res.json({ message: 'Job cancelled successfully' });
    } else {
      // Delete associated images from Cloudinary
      if (job.images && job.images.length > 0) {
        for (const image of job.images) {
          if (image.publicId) {
            await cloudinary.uploader.destroy(image.publicId);
          }
        }
      }

      // Delete the job and associated quotes
      await Quote.deleteMany({ job: job._id });
      await Job.findByIdAndDelete(req.params.id);
      
      res.json({ message: 'Job deleted successfully' });
    }
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/jobs/:id/save
// @desc    Save/unsave job
// @access  Private (Provider only)
router.post('/:id/save', authenticateToken, authorize('provider'), validateObjectId('id'), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const userId = req.user._id;
    const isSaved = job.saves.includes(userId);

    if (isSaved) {
      // Unsave
      job.saves.pull(userId);
      await job.save();
      res.json({ message: 'Job removed from saved jobs', isSaved: false });
    } else {
      // Save
      job.saves.push(userId);
      await job.save();
      res.json({ message: 'Job saved successfully', isSaved: true });
    }
  } catch (error) {
    console.error('Save job error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/jobs/:id/saved
// @desc    Get saved jobs for current user
// @access  Private (Provider only)
router.get('/saved/list', authenticateToken, authorize('provider'), validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const jobs = await Job.find({ 
      saves: req.user._id,
      status: 'open'
    })
    .populate('postedBy', 'firstName lastName avatar rating')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    const total = await Job.countDocuments({ 
      saves: req.user._id,
      status: 'open'
    });

    res.json({
      jobs,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get saved jobs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/jobs/:id/status
// @desc    Update job status
// @access  Private (Job owner or selected provider)
router.put('/:id/status', authenticateToken, validateObjectId('id'), async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['open', 'in_progress', 'completed', 'cancelled', 'disputed'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check authorization
    const isJobOwner = job.postedBy.toString() === req.user._id.toString();
    const isSelectedProvider = job.selectedProvider && job.selectedProvider.toString() === req.user._id.toString();

    if (!isJobOwner && !isSelectedProvider) {
      return res.status(403).json({ message: 'Not authorized to update job status' });
    }

    // Status transition rules
    const allowedTransitions = {
      'open': ['cancelled'], // Only seeker can cancel open job
      'in_progress': ['completed', 'disputed'], // Both parties can mark complete or dispute
      'completed': ['disputed'], // Can reopen dispute
      'cancelled': [], // Final state
      'disputed': ['completed', 'cancelled'] // Can resolve or cancel
    };

    if (!allowedTransitions[job.status].includes(status)) {
      return res.status(400).json({ 
        message: `Cannot change status from ${job.status} to ${status}` 
      });
    }

    // Additional rules for specific transitions
    if (status === 'completed') {
      // Both parties should confirm completion (simplified for MVP)
      job.completionDate = new Date();
    }

    job.status = status;
    await job.save();

    res.json({
      message: `Job status updated to ${status}`,
      job
    });
  } catch (error) {
    console.error('Update job status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to get sort options
function getSortOptions(sortBy) {
  const sortOptions = {
    'newest': { createdAt: -1 },
    'oldest': { createdAt: 1 },
    'budget_high': { 'budget.amount': -1, 'budget.range.max': -1 },
    'budget_low': { 'budget.amount': 1, 'budget.range.min': 1 },
    'urgent': { priority: -1, createdAt: -1 },
    'views': { views: -1 }
  };

  return sortOptions[sortBy] || { createdAt: -1 };
}

module.exports = router;
