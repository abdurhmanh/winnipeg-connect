const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Payment = require('../models/Payment');
const Job = require('../models/Job');
const Quote = require('../models/Quote');
const User = require('../models/User');
const Message = require('../models/Message');
const { authenticateToken, authorize } = require('../middleware/auth');
const { validateObjectId, validatePagination } = require('../utils/validation');

const router = express.Router();

// @route   POST /api/payments/create-payment-intent
// @desc    Create Stripe payment intent for escrow
// @access  Private (Seeker only)
router.post('/create-payment-intent', authenticateToken, authorize('seeker'), async (req, res) => {
  try {
    const { quoteId, paymentType = 'deposit' } = req.body;

    // Get quote and job details
    const quote = await Quote.findById(quoteId)
      .populate('job')
      .populate('provider');

    if (!quote) {
      return res.status(404).json({ message: 'Quote not found' });
    }

    if (quote.status !== 'accepted') {
      return res.status(400).json({ message: 'Quote must be accepted before payment' });
    }

    // Check if user owns the job
    if (quote.seeker.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to pay for this quote' });
    }

    // Check if payment already exists
    const existingPayment = await Payment.findOne({
      quote: quoteId,
      paymentType,
      status: { $in: ['pending', 'authorized', 'captured'] }
    });

    if (existingPayment) {
      return res.status(400).json({ message: 'Payment already exists for this quote' });
    }

    // Calculate payment amounts
    const subtotal = paymentType === 'deposit' 
      ? Math.round(quote.price.amount * 0.5 * 100) / 100 // 50% deposit
      : quote.price.amount;

    const platformFee = Payment.calculatePlatformFee(subtotal);
    const stripeFee = Payment.calculateStripeFee(subtotal + platformFee);
    const total = subtotal + platformFee + stripeFee;

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100), // Convert to cents
      currency: 'cad',
      payment_method_types: ['card'],
      capture_method: 'manual', // For escrow - capture later
      metadata: {
        quoteId: quote._id.toString(),
        jobId: quote.job._id.toString(),
        providerId: quote.provider._id.toString(),
        seekerId: req.user._id.toString(),
        paymentType
      }
    });

    // Create payment record
    const payment = new Payment({
      job: quote.job._id,
      quote: quote._id,
      payer: req.user._id,
      payee: quote.provider._id,
      amount: {
        subtotal,
        platformFee,
        stripeFee,
        total
      },
      paymentType,
      stripePaymentIntentId: paymentIntent.id,
      holdUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Hold for 7 days
    });

    await payment.save();

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentId: payment._id,
      amount: total
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({ message: 'Server error during payment creation' });
  }
});

// @route   POST /api/payments/confirm-payment
// @desc    Confirm payment after successful card charge
// @access  Private
router.post('/confirm-payment', authenticateToken, async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    // Get payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'requires_capture') {
      return res.status(400).json({ message: 'Payment intent not ready for capture' });
    }

    // Find payment record
    const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntentId });

    if (!payment) {
      return res.status(404).json({ message: 'Payment record not found' });
    }

    // Verify user authorization
    if (payment.payer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized for this payment' });
    }

    // Capture the payment (move to escrow)
    await stripe.paymentIntents.capture(paymentIntentId);

    // Update payment status
    payment.status = 'captured';
    payment.escrowStatus = 'held';
    await payment.save();

    res.json({
      message: 'Payment confirmed and funds held in escrow',
      payment
    });
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ message: 'Server error during payment confirmation' });
  }
});

// @route   GET /api/payments/my-payments
// @desc    Get current user's payments
// @access  Private
router.get('/my-payments', authenticateToken, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter based on user role
    const filter = req.user.role === 'seeker' 
      ? { payer: req.user._id }
      : { payee: req.user._id };

    // Status filter
    if (req.query.status) {
      filter.status = req.query.status;
    }

    // Escrow status filter
    if (req.query.escrowStatus) {
      filter.escrowStatus = req.query.escrowStatus;
    }

    const payments = await Payment.find(filter)
      .populate('job', 'title category')
      .populate('quote', 'price message')
      .populate('payer', 'firstName lastName')
      .populate('payee', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Payment.countDocuments(filter);

    res.json({
      payments,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get my payments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/payments/:id
// @desc    Get payment by ID
// @access  Private (Payment parties only)
router.get('/:id', authenticateToken, validateObjectId('id'), async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('job', 'title category status')
      .populate('quote', 'price message estimatedDuration')
      .populate('payer', 'firstName lastName email')
      .populate('payee', 'firstName lastName email');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Check authorization
    const isPayer = payment.payer._id.toString() === req.user._id.toString();
    const isPayee = payment.payee._id.toString() === req.user._id.toString();

    if (!isPayer && !isPayee) {
      return res.status(403).json({ message: 'Not authorized to view this payment' });
    }

    res.json({ payment });
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/payments/:id/approve-release
// @desc    Approve payment release
// @access  Private (Payment parties only)
router.post('/:id/approve-release', authenticateToken, validateObjectId('id'), async (req, res) => {
  try {
    const { notes } = req.body;

    const payment = await Payment.findById(req.params.id)
      .populate('job')
      .populate('payee');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (payment.escrowStatus !== 'held') {
      return res.status(400).json({ message: 'Payment is not held in escrow' });
    }

    // Check authorization
    const isPayer = payment.payer.toString() === req.user._id.toString();
    const isPayee = payment.payee.toString() === req.user._id.toString();

    if (!isPayer && !isPayee) {
      return res.status(403).json({ message: 'Not authorized to approve this payment' });
    }

    const userType = isPayer ? 'seeker' : 'provider';

    // Add approval
    const approvalAdded = payment.addApproval(req.user._id, userType, notes);

    if (!approvalAdded) {
      return res.status(400).json({ message: 'You have already approved this payment' });
    }

    await payment.save();

    // Check if payment can be released
    if (payment.canBeReleased) {
      await releasePayment(payment);
    }

    res.json({
      message: 'Payment approval recorded',
      canBeReleased: payment.canBeReleased,
      payment
    });
  } catch (error) {
    console.error('Approve payment release error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/payments/:id/release
// @desc    Release payment from escrow (admin or automatic)
// @access  Private
router.post('/:id/release', authenticateToken, validateObjectId('id'), async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Check authorization (both parties must approve or admin override)
    const isPayer = payment.payer.toString() === req.user._id.toString();
    const isPayee = payment.payee.toString() === req.user._id.toString();

    if (!isPayer && !isPayee && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to release this payment' });
    }

    if (!payment.canBeReleased && !req.user.isAdmin) {
      return res.status(400).json({ message: 'Payment cannot be released yet - missing approvals' });
    }

    await releasePayment(payment);

    res.json({
      message: 'Payment released successfully',
      payment
    });
  } catch (error) {
    console.error('Release payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/payments/:id/refund
// @desc    Refund payment
// @access  Private (Payer only or admin)
router.post('/:id/refund', authenticateToken, validateObjectId('id'), async (req, res) => {
  try {
    const { reason, amount } = req.body;

    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Check authorization
    const isPayer = payment.payer.toString() === req.user._id.toString();

    if (!isPayer && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to refund this payment' });
    }

    if (!payment.canBeRefunded()) {
      return res.status(400).json({ message: 'Payment cannot be refunded' });
    }

    const refundAmount = amount || payment.amount.total;

    // Create Stripe refund
    const refund = await stripe.refunds.create({
      payment_intent: payment.stripePaymentIntentId,
      amount: Math.round(refundAmount * 100), // Convert to cents
      reason: 'requested_by_customer'
    });

    // Update payment record
    payment.status = 'refunded';
    payment.escrowStatus = 'refunded';
    payment.refundedAt = new Date();
    payment.refundReason = reason;
    payment.refundAmount = refundAmount;
    payment.stripeRefundId = refund.id;

    await payment.save();

    res.json({
      message: 'Payment refunded successfully',
      payment
    });
  } catch (error) {
    console.error('Refund payment error:', error);
    res.status(500).json({ message: 'Server error during refund' });
  }
});

// @route   POST /api/payments/:id/dispute
// @desc    Dispute a payment
// @access  Private (Payment parties only)
router.post('/:id/dispute', authenticateToken, validateObjectId('id'), async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ message: 'Dispute reason is required' });
    }

    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Check authorization
    const isPayer = payment.payer.toString() === req.user._id.toString();
    const isPayee = payment.payee.toString() === req.user._id.toString();

    if (!isPayer && !isPayee) {
      return res.status(403).json({ message: 'Not authorized to dispute this payment' });
    }

    if (payment.dispute.isDisputed) {
      return res.status(400).json({ message: 'Payment is already disputed' });
    }

    // Create dispute
    payment.dispute = {
      isDisputed: true,
      disputedAt: new Date(),
      disputedBy: req.user._id,
      reason: reason.trim(),
      status: 'open'
    };

    payment.status = 'disputed';

    await payment.save();

    res.json({
      message: 'Payment dispute created successfully',
      payment
    });
  } catch (error) {
    console.error('Dispute payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/payments/stats/overview
// @desc    Get payment statistics
// @access  Private
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    let stats = {};

    if (userRole === 'provider') {
      // Provider payment stats
      stats = {
        totalEarnings: await Payment.aggregate([
          { $match: { payee: userId, status: 'released' } },
          { $group: { _id: null, total: { $sum: '$amount.subtotal' } } }
        ]).then(result => result[0]?.total || 0),
        
        pendingPayments: await Payment.countDocuments({
          payee: userId,
          escrowStatus: 'held'
        }),
        
        completedPayments: await Payment.countDocuments({
          payee: userId,
          status: 'released'
        }),
        
        disputedPayments: await Payment.countDocuments({
          payee: userId,
          status: 'disputed'
        })
      };
    } else {
      // Seeker payment stats
      stats = {
        totalSpent: await Payment.aggregate([
          { $match: { payer: userId, status: { $in: ['captured', 'released'] } } },
          { $group: { _id: null, total: { $sum: '$amount.total' } } }
        ]).then(result => result[0]?.total || 0),
        
        activeEscrows: await Payment.countDocuments({
          payer: userId,
          escrowStatus: 'held'
        }),
        
        completedPayments: await Payment.countDocuments({
          payer: userId,
          status: 'released'
        }),
        
        refundedPayments: await Payment.countDocuments({
          payer: userId,
          status: 'refunded'
        })
      };
    }

    res.json({ stats });
  } catch (error) {
    console.error('Get payment stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to release payment
async function releasePayment(payment) {
  try {
    // Calculate net amount to provider (subtract platform fee)
    const netAmount = payment.amount.subtotal - payment.amount.platformFee;

    // In a real implementation, you would transfer to provider's Stripe account
    // For MVP, we'll just update the payment status
    payment.status = 'released';
    payment.escrowStatus = 'released';
    payment.releasedAt = new Date();
    payment.releasedBy = {
      reason: 'job_completed'
    };

    await payment.save();

    // Update provider earnings
    const provider = await User.findById(payment.payee);
    if (provider) {
      provider.earnings.total += netAmount;
      provider.earnings.pending -= netAmount;
      provider.earnings.available += netAmount;
      await provider.save();
    }

    // Create system message
    const job = await Job.findById(payment.job);
    const chatId = Message.generateChatId(payment.payer, payment.payee, job._id);
    await Message.createSystemMessage(
      chatId,
      payment.payer,
      payment.payee,
      'payment_released',
      { amount: netAmount },
      job._id
    );

    return payment;
  } catch (error) {
    console.error('Release payment helper error:', error);
    throw error;
  }
}

module.exports = router;
