const express = require('express');
const Quote = require('../models/Quote');
const Job = require('../models/Job');
const Message = require('../models/Message');
const { authenticateToken, authorize } = require('../middleware/auth');
const { validateQuoteCreation, validatePagination, validateObjectId } = require('../utils/validation');

const router = express.Router();

// @route   POST /api/quotes
// @desc    Create a new quote
// @access  Private (Provider only)
router.post('/', authenticateToken, authorize('provider'), validateQuoteCreation, async (req, res) => {
  try {
    const {
      job: jobId,
      price,
      estimatedDuration,
      startDate,
      completionDate,
      message,
      includesSupplies,
      supplyDetails,
      warranty,
      availability,
      terms,
      paymentTerms
    } = req.body;

    // Check if job exists and is open
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.status !== 'open') {
      return res.status(400).json({ message: 'Job is no longer accepting quotes' });
    }

    // Check if provider already submitted a quote
    const existingQuote = await Quote.findOne({
      job: jobId,
      provider: req.user._id
    });

    if (existingQuote) {
      return res.status(400).json({ message: 'You have already submitted a quote for this job' });
    }

    // Create quote
    const quote = new Quote({
      job: jobId,
      provider: req.user._id,
      seeker: job.postedBy,
      price,
      estimatedDuration,
      startDate,
      completionDate,
      message,
      includesSupplies: includesSupplies || false,
      supplyDetails,
      warranty: warranty || { offered: false },
      availability,
      terms,
      paymentTerms
    });

    await quote.save();

    // Add quote to job
    job.quotes.push(quote._id);
    await job.save();

    // Populate quote for response
    await quote.populate([
      { path: 'provider', select: 'firstName lastName avatar rating categories' },
      { path: 'job', select: 'title category' }
    ]);

    // Create system message for chat
    const chatId = Message.generateChatId(req.user._id, job.postedBy, jobId);
    await Message.createSystemMessage(
      chatId,
      req.user._id,
      job.postedBy,
      'quote_sent',
      { quoteId: quote._id, amount: price.amount },
      jobId
    );

    res.status(201).json({
      message: 'Quote submitted successfully',
      quote
    });
  } catch (error) {
    console.error('Create quote error:', error);
    res.status(500).json({ message: 'Server error during quote creation' });
  }
});

// @route   GET /api/quotes/my-quotes
// @desc    Get current user's quotes
// @access  Private (Provider only)
router.get('/my-quotes', authenticateToken, authorize('provider'), validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { provider: req.user._id };

    // Status filter
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const quotes = await Quote.find(filter)
      .populate('job', 'title category status budget location createdAt')
      .populate('seeker', 'firstName lastName avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Quote.countDocuments(filter);

    // Calculate statistics
    const stats = {
      total: await Quote.countDocuments({ provider: req.user._id }),
      pending: await Quote.countDocuments({ provider: req.user._id, status: 'pending' }),
      accepted: await Quote.countDocuments({ provider: req.user._id, status: 'accepted' }),
      rejected: await Quote.countDocuments({ provider: req.user._id, status: 'rejected' })
    };

    res.json({
      quotes,
      stats,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get my quotes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/quotes/job/:jobId
// @desc    Get quotes for a specific job
// @access  Private (Job owner only)
router.get('/job/:jobId', authenticateToken, authorize('seeker'), validateObjectId('jobId'), async (req, res) => {
  try {
    const { jobId } = req.params;

    // Check if user owns the job
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view quotes for this job' });
    }

    const quotes = await Quote.find({ job: jobId })
      .populate('provider', 'firstName lastName avatar rating categories portfolio location')
      .sort({ createdAt: -1 });

    // Mark quotes as viewed
    await Quote.updateMany(
      { job: jobId, viewedBySeeker: false },
      { viewedBySeeker: true, viewedAt: new Date() }
    );

    res.json({ quotes });
  } catch (error) {
    console.error('Get job quotes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/quotes/:id
// @desc    Get quote by ID
// @access  Private (Quote owner, job owner, or selected provider)
router.get('/:id', authenticateToken, validateObjectId('id'), async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id)
      .populate('provider', 'firstName lastName avatar rating categories portfolio')
      .populate('seeker', 'firstName lastName avatar')
      .populate('job', 'title description category budget location status');

    if (!quote) {
      return res.status(404).json({ message: 'Quote not found' });
    }

    // Check authorization
    const isProvider = quote.provider._id.toString() === req.user._id.toString();
    const isSeeker = quote.seeker._id.toString() === req.user._id.toString();

    if (!isProvider && !isSeeker) {
      return res.status(403).json({ message: 'Not authorized to view this quote' });
    }

    // Mark as viewed if seeker is viewing
    if (isSeeker && !quote.viewedBySeeker) {
      quote.viewedBySeeker = true;
      quote.viewedAt = new Date();
      await quote.save();
    }

    res.json({ quote });
  } catch (error) {
    console.error('Get quote error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/quotes/:id
// @desc    Update quote (provider only, before acceptance)
// @access  Private (Quote owner only)
router.put('/:id', authenticateToken, authorize('provider'), validateObjectId('id'), async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id);

    if (!quote) {
      return res.status(404).json({ message: 'Quote not found' });
    }

    // Check ownership
    if (quote.provider.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this quote' });
    }

    // Can only update pending quotes
    if (quote.status !== 'pending') {
      return res.status(400).json({ message: 'Cannot update quote that is no longer pending' });
    }

    // Check if quote is still valid (not expired)
    if (!quote.isValid()) {
      return res.status(400).json({ message: 'Quote has expired and cannot be updated' });
    }

    const updates = req.body;
    delete updates._id;
    delete updates.provider;
    delete updates.seeker;
    delete updates.job;
    delete updates.status;

    const updatedQuote = await Quote.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('provider', 'firstName lastName avatar rating');

    res.json({
      message: 'Quote updated successfully',
      quote: updatedQuote
    });
  } catch (error) {
    console.error('Update quote error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/quotes/:id/accept
// @desc    Accept a quote
// @access  Private (Job owner only)
router.put('/:id/accept', authenticateToken, authorize('seeker'), validateObjectId('id'), async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id)
      .populate('provider', 'firstName lastName')
      .populate('job');

    if (!quote) {
      return res.status(404).json({ message: 'Quote not found' });
    }

    // Check if user owns the job
    if (quote.seeker.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to accept this quote' });
    }

    // Check if quote is still valid
    if (quote.status !== 'pending') {
      return res.status(400).json({ message: 'Quote is no longer pending' });
    }

    if (!quote.isValid()) {
      return res.status(400).json({ message: 'Quote has expired' });
    }

    // Check if job is still open
    const job = await Job.findById(quote.job._id);
    if (job.status !== 'open') {
      return res.status(400).json({ message: 'Job is no longer accepting quotes' });
    }

    // Accept the quote
    quote.status = 'accepted';
    quote.respondedAt = new Date();
    await quote.save();

    // Update job
    job.selectedProvider = quote.provider._id;
    job.selectedQuote = quote._id;
    job.status = 'in_progress';
    await job.save();

    // Reject all other quotes for this job
    await Quote.updateMany(
      { job: job._id, _id: { $ne: quote._id } },
      { 
        status: 'rejected', 
        respondedAt: new Date() 
      }
    );

    // Create system message
    const chatId = Message.generateChatId(req.user._id, quote.provider._id, job._id);
    await Message.createSystemMessage(
      chatId,
      req.user._id,
      quote.provider._id,
      'quote_accepted',
      { quoteId: quote._id, amount: quote.price.amount },
      job._id
    );

    res.json({
      message: 'Quote accepted successfully',
      quote,
      job
    });
  } catch (error) {
    console.error('Accept quote error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/quotes/:id/reject
// @desc    Reject a quote
// @access  Private (Job owner only)
router.put('/:id/reject', authenticateToken, authorize('seeker'), validateObjectId('id'), async (req, res) => {
  try {
    const { reason } = req.body;

    const quote = await Quote.findById(req.params.id);

    if (!quote) {
      return res.status(404).json({ message: 'Quote not found' });
    }

    // Check if user owns the job
    if (quote.seeker.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to reject this quote' });
    }

    // Check if quote is still pending
    if (quote.status !== 'pending') {
      return res.status(400).json({ message: 'Quote is no longer pending' });
    }

    quote.status = 'rejected';
    quote.respondedAt = new Date();
    if (reason) {
      quote.rejectionReason = reason;
    }
    await quote.save();

    // Create system message
    const job = await Job.findById(quote.job);
    const chatId = Message.generateChatId(req.user._id, quote.provider, job._id);
    await Message.createSystemMessage(
      chatId,
      req.user._id,
      quote.provider,
      'quote_rejected',
      { quoteId: quote._id, reason },
      job._id
    );

    res.json({
      message: 'Quote rejected',
      quote
    });
  } catch (error) {
    console.error('Reject quote error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/quotes/:id
// @desc    Withdraw a quote
// @access  Private (Quote owner only)
router.delete('/:id', authenticateToken, authorize('provider'), validateObjectId('id'), async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id);

    if (!quote) {
      return res.status(404).json({ message: 'Quote not found' });
    }

    // Check ownership
    if (quote.provider.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to withdraw this quote' });
    }

    // Can only withdraw pending quotes
    if (quote.status !== 'pending') {
      return res.status(400).json({ message: 'Cannot withdraw quote that is no longer pending' });
    }

    quote.status = 'withdrawn';
    await quote.save();

    // Remove from job's quotes array
    await Job.findByIdAndUpdate(
      quote.job,
      { $pull: { quotes: quote._id } }
    );

    res.json({ message: 'Quote withdrawn successfully' });
  } catch (error) {
    console.error('Withdraw quote error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/quotes/stats
// @desc    Get quote statistics for provider
// @access  Private (Provider only)
router.get('/stats/overview', authenticateToken, authorize('provider'), async (req, res) => {
  try {
    const providerId = req.user._id;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const stats = {
      total: await Quote.countDocuments({ provider: providerId }),
      pending: await Quote.countDocuments({ provider: providerId, status: 'pending' }),
      accepted: await Quote.countDocuments({ provider: providerId, status: 'accepted' }),
      rejected: await Quote.countDocuments({ provider: providerId, status: 'rejected' }),
      last30Days: await Quote.countDocuments({ 
        provider: providerId, 
        createdAt: { $gte: thirtyDaysAgo } 
      }),
      acceptanceRate: 0,
      averageQuoteValue: 0
    };

    // Calculate acceptance rate
    if (stats.total > 0) {
      stats.acceptanceRate = ((stats.accepted / (stats.accepted + stats.rejected)) * 100).toFixed(1);
    }

    // Calculate average quote value
    const quotes = await Quote.find({ provider: providerId });
    if (quotes.length > 0) {
      const totalValue = quotes.reduce((sum, quote) => sum + quote.price.amount, 0);
      stats.averageQuoteValue = (totalValue / quotes.length).toFixed(2);
    }

    res.json({ stats });
  } catch (error) {
    console.error('Get quote stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
