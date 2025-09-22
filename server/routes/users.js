const express = require('express');
const multer = require('multer');
const User = require('../models/User');
const Review = require('../models/Review');
const cloudinary = require('../config/cloudinary');
const { authenticateToken, authorize } = require('../middleware/auth');
const { validateProfileUpdate, validatePagination, validateObjectId } = require('../utils/validation');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

// @route   GET /api/users/profile
// @desc    Get current user's profile
// @access  Private
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('reviews');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticateToken, validateProfileUpdate, async (req, res) => {
  try {
    const updates = req.body;
    const userId = req.user._id;

    // Remove fields that shouldn't be updated via this route
    delete updates.email;
    delete updates.password;
    delete updates.role;
    delete updates.isEmailVerified;
    delete updates.rating;
    delete updates.earnings;

    const user = await User.findByIdAndUpdate(
      userId,
      { ...updates, lastActive: new Date() },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if profile is now complete
    const isComplete = checkProfileCompleteness(user);
    if (isComplete !== user.isProfileComplete) {
      user.isProfileComplete = isComplete;
      await user.save();
    }

    res.json({ 
      message: 'Profile updated successfully',
      user 
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/upload-avatar
// @desc    Upload user avatar
// @access  Private
router.post('/upload-avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'winnipeg-connect/avatars',
          public_id: `avatar_${req.user._id}`,
          transformation: [
            { width: 200, height: 200, crop: 'fill', gravity: 'face' }
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(req.file.buffer);
    });

    // Update user avatar
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { 
        avatar: {
          url: result.secure_url,
          publicId: result.public_id
        }
      },
      { new: true }
    ).select('-password');

    res.json({
      message: 'Avatar uploaded successfully',
      avatar: user.avatar
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ message: 'Server error during avatar upload' });
  }
});

// @route   POST /api/users/upload-portfolio
// @desc    Upload portfolio images (providers only)
// @access  Private
router.post('/upload-portfolio', 
  authenticateToken, 
  authorize('provider'), 
  upload.array('images', 10), 
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
      }

      const { descriptions, categories } = req.body;
      const uploadedImages = [];

      // Upload each image to Cloudinary
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        
        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              folder: 'winnipeg-connect/portfolio',
              public_id: `portfolio_${req.user._id}_${Date.now()}_${i}`,
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
          description: descriptions ? descriptions[i] : '',
          category: categories ? categories[i] : ''
        });
      }

      // Add to user's portfolio
      const user = await User.findByIdAndUpdate(
        req.user._id,
        { $push: { portfolio: { $each: uploadedImages } } },
        { new: true }
      ).select('-password');

      res.json({
        message: 'Portfolio images uploaded successfully',
        images: uploadedImages,
        portfolio: user.portfolio
      });
    } catch (error) {
      console.error('Portfolio upload error:', error);
      res.status(500).json({ message: 'Server error during portfolio upload' });
    }
  }
);

// @route   DELETE /api/users/portfolio/:imageId
// @desc    Delete portfolio image
// @access  Private
router.delete('/portfolio/:imageId', authenticateToken, authorize('provider'), async (req, res) => {
  try {
    const { imageId } = req.params;
    
    const user = await User.findById(req.user._id);
    const imageIndex = user.portfolio.findIndex(img => img._id.toString() === imageId);
    
    if (imageIndex === -1) {
      return res.status(404).json({ message: 'Portfolio image not found' });
    }

    const image = user.portfolio[imageIndex];
    
    // Delete from Cloudinary
    if (image.publicId) {
      await cloudinary.uploader.destroy(image.publicId);
    }

    // Remove from user portfolio
    user.portfolio.splice(imageIndex, 1);
    await user.save();

    res.json({ message: 'Portfolio image deleted successfully' });
  } catch (error) {
    console.error('Delete portfolio image error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/providers
// @desc    Get all service providers with filtering
// @access  Public
router.get('/providers', validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter query
    const filter = { 
      role: 'provider', 
      isActive: true,
      isProfileComplete: true 
    };

    // Category filter
    if (req.query.category) {
      filter.categories = { $in: [req.query.category] };
    }

    // Rating filter
    if (req.query.minRating) {
      filter['rating.average'] = { $gte: parseFloat(req.query.minRating) };
    }

    // Location filter (if coordinates provided)
    if (req.query.lat && req.query.lng) {
      const lat = parseFloat(req.query.lat);
      const lng = parseFloat(req.query.lng);
      const radius = parseFloat(req.query.radius) || 25; // 25km default

      filter.location = {
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
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      filter.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { bio: searchRegex },
        { categories: { $in: [searchRegex] } },
        { skills: { $in: [searchRegex] } }
      ];
    }

    // Execute query
    const providers = await User.find(filter)
      .select('-password -email')
      .sort(getSortOptions(req.query.sort))
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

    res.json({
      providers,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get providers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/provider/:id
// @desc    Get provider profile by ID
// @access  Public
router.get('/provider/:id', validateObjectId('id'), async (req, res) => {
  try {
    const provider = await User.findOne({
      _id: req.params.id,
      role: 'provider',
      isActive: true
    }).select('-password -email');

    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    // Get recent reviews
    const reviews = await Review.find({
      reviewee: provider._id,
      isVisible: true
    })
    .populate('reviewer', 'firstName lastName avatar')
    .populate('job', 'title category')
    .sort({ createdAt: -1 })
    .limit(10);

    res.json({
      provider,
      reviews
    });
  } catch (error) {
    console.error('Get provider error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/availability
// @desc    Update provider availability
// @access  Private (Provider only)
router.put('/availability', authenticateToken, authorize('provider'), async (req, res) => {
  try {
    const { schedule, unavailableDates } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { 
        'availability.schedule': schedule,
        'availability.unavailableDates': unavailableDates
      },
      { new: true }
    ).select('-password');

    res.json({
      message: 'Availability updated successfully',
      availability: user.availability
    });
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/stats
// @desc    Get user statistics
// @access  Private
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    let stats = {};

    if (userRole === 'provider') {
      // Provider stats
      const Job = require('../models/Job');
      const Quote = require('../models/Quote');
      
      stats = {
        totalQuotes: await Quote.countDocuments({ provider: userId }),
        acceptedQuotes: await Quote.countDocuments({ provider: userId, status: 'accepted' }),
        completedJobs: await Job.countDocuments({ selectedProvider: userId, status: 'completed' }),
        totalEarnings: req.user.earnings.total || 0,
        averageRating: req.user.rating.average || 0,
        totalReviews: req.user.rating.count || 0
      };
    } else {
      // Seeker stats
      const Job = require('../models/Job');
      
      stats = {
        totalJobsPosted: await Job.countDocuments({ postedBy: userId }),
        activeJobs: await Job.countDocuments({ postedBy: userId, status: 'open' }),
        completedJobs: await Job.countDocuments({ postedBy: userId, status: 'completed' }),
        totalSpent: 0 // Calculate from payments if needed
      };
    }

    res.json({ stats });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to check profile completeness
function checkProfileCompleteness(user) {
  if (user.role === 'provider') {
    return !!(
      user.firstName &&
      user.lastName &&
      user.phone &&
      user.bio &&
      user.categories?.length > 0 &&
      user.address?.street &&
      user.address?.postalCode &&
      (user.rates?.hourly || (user.rates?.fixed?.min && user.rates?.fixed?.max))
    );
  } else {
    return !!(
      user.firstName &&
      user.lastName &&
      user.phone &&
      user.address?.street &&
      user.address?.postalCode
    );
  }
}

// Helper function to get sort options
function getSortOptions(sortBy) {
  const sortOptions = {
    'rating': { 'rating.average': -1 },
    'newest': { createdAt: -1 },
    'name': { firstName: 1, lastName: 1 },
    'price_low': { 'rates.hourly': 1 },
    'price_high': { 'rates.hourly': -1 }
  };

  return sortOptions[sortBy] || { 'rating.average': -1 };
}

module.exports = router;
