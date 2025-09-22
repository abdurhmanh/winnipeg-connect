const express = require('express');
const Category = require('../models/Category');
const { authenticateToken, authorize } = require('../middleware/auth');
const { validatePagination } = require('../utils/validation');

const router = express.Router();

// @route   GET /api/categories
// @desc    Get all categories
// @access  Public
router.get('/', validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = { isActive: true };
    
    // Filter by parent category
    if (req.query.parent) {
      if (req.query.parent === 'null' || req.query.parent === 'root') {
        filter.parentCategory = null;
      } else {
        filter.parentCategory = req.query.parent;
      }
    }

    // Search filter
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      filter.$or = [
        { name: searchRegex },
        { description: searchRegex }
      ];
    }

    // Season filter (for Winnipeg-specific categories)
    if (req.query.season) {
      filter[`seasonalAvailability.${req.query.season}`] = true;
    }

    const categories = await Category.find(filter)
      .populate('parentCategory', 'name slug')
      .populate('subcategories', 'name slug description icon')
      .sort({ order: 1, name: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Category.countDocuments(filter);

    res.json({
      categories,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/categories/tree
// @desc    Get categories in tree structure
// @access  Public
router.get('/tree', async (req, res) => {
  try {
    // Get all active categories
    const categories = await Category.find({ isActive: true })
      .sort({ order: 1, name: 1 });

    // Build tree structure
    const categoryMap = {};
    const rootCategories = [];

    // First pass: create map and identify root categories
    categories.forEach(category => {
      categoryMap[category._id] = {
        ...category.toObject(),
        children: []
      };

      if (!category.parentCategory) {
        rootCategories.push(categoryMap[category._id]);
      }
    });

    // Second pass: build parent-child relationships
    categories.forEach(category => {
      if (category.parentCategory) {
        const parent = categoryMap[category.parentCategory];
        if (parent) {
          parent.children.push(categoryMap[category._id]);
        }
      }
    });

    res.json({ categories: rootCategories });
  } catch (error) {
    console.error('Get category tree error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/categories/popular
// @desc    Get popular categories based on usage
// @access  Public
router.get('/popular', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // Aggregate categories by usage in jobs and user profiles
    const Job = require('../models/Job');
    const User = require('../models/User');

    // Get category usage from jobs
    const jobCategories = await Job.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: '$category', jobCount: { $sum: 1 } } },
      { $sort: { jobCount: -1 } },
      { $limit: limit * 2 } // Get more to filter
    ]);

    // Get category usage from providers
    const providerCategories = await User.aggregate([
      { $match: { role: 'provider', isActive: true } },
      { $unwind: '$categories' },
      { $group: { _id: '$categories', providerCount: { $sum: 1 } } },
      { $sort: { providerCount: -1 } },
      { $limit: limit * 2 }
    ]);

    // Combine and score categories
    const categoryScores = {};
    
    jobCategories.forEach(item => {
      categoryScores[item._id] = (categoryScores[item._id] || 0) + item.jobCount * 2;
    });

    providerCategories.forEach(item => {
      categoryScores[item._id] = (categoryScores[item._id] || 0) + item.providerCount;
    });

    // Sort by score and get category details
    const sortedCategories = Object.entries(categoryScores)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit);

    const popularCategoryNames = sortedCategories.map(([name]) => name);
    
    const categories = await Category.find({
      name: { $in: popularCategoryNames },
      isActive: true
    });

    // Sort categories by popularity score
    const sortedCategoryObjects = popularCategoryNames
      .map(name => categories.find(cat => cat.name === name))
      .filter(Boolean);

    res.json({ categories: sortedCategoryObjects });
  } catch (error) {
    console.error('Get popular categories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/categories/search
// @desc    Search categories
// @access  Public
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }

    const searchRegex = new RegExp(q, 'i');
    
    const categories = await Category.find({
      isActive: true,
      $or: [
        { name: searchRegex },
        { description: searchRegex }
      ]
    })
    .select('name slug description icon parentCategory')
    .populate('parentCategory', 'name')
    .sort({ name: 1 })
    .limit(parseInt(limit));

    res.json({ categories });
  } catch (error) {
    console.error('Search categories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/categories/winnipeg-specific
// @desc    Get Winnipeg-specific categories
// @access  Public
router.get('/winnipeg-specific', async (req, res) => {
  try {
    const season = req.query.season;
    
    const filter = {
      isActive: true,
      isWinnipegSpecific: true
    };

    if (season) {
      filter[`seasonalAvailability.${season}`] = true;
    }

    const categories = await Category.find(filter)
      .populate('parentCategory', 'name slug')
      .sort({ order: 1, name: 1 });

    res.json({ categories });
  } catch (error) {
    console.error('Get Winnipeg categories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/categories/:slug
// @desc    Get category by slug
// @access  Public
router.get('/:slug', async (req, res) => {
  try {
    const category = await Category.findOne({ 
      slug: req.params.slug, 
      isActive: true 
    })
    .populate('parentCategory', 'name slug')
    .populate('subcategories', 'name slug description icon');

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Get related statistics
    const Job = require('../models/Job');
    const User = require('../models/User');

    const stats = {
      jobCount: await Job.countDocuments({ 
        category: category.name,
        status: { $ne: 'cancelled' }
      }),
      providerCount: await User.countDocuments({
        role: 'provider',
        categories: category.name,
        isActive: true
      })
    };

    res.json({ category, stats });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin routes (for future admin dashboard)

// @route   POST /api/categories
// @desc    Create new category
// @access  Private (Admin only - for future implementation)
router.post('/', authenticateToken, async (req, res) => {
  try {
    // For MVP, this could be restricted to admin users
    // For now, we'll allow authenticated users to suggest categories
    
    const {
      name,
      description,
      icon,
      parentCategory,
      isWinnipegSpecific,
      seasonalAvailability,
      order
    } = req.body;

    // Check if category already exists
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    const category = new Category({
      name,
      description,
      icon,
      parentCategory: parentCategory || null,
      isWinnipegSpecific: isWinnipegSpecific || false,
      seasonalAvailability: seasonalAvailability || {
        spring: true,
        summer: true,
        fall: true,
        winter: true
      },
      order: order || 0
    });

    await category.save();

    // If this is a subcategory, add to parent's subcategories
    if (parentCategory) {
      await Category.findByIdAndUpdate(
        parentCategory,
        { $push: { subcategories: category._id } }
      );
    }

    res.status(201).json({
      message: 'Category created successfully',
      category
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/categories/:id
// @desc    Update category
// @access  Private (Admin only - for future implementation)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const updates = req.body;
    delete updates._id; // Prevent ID updates

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({
      message: 'Category updated successfully',
      category
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
