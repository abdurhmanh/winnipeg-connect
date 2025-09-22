const express = require('express');
const Message = require('../models/Message');
const Job = require('../models/Job');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const { validateMessageCreation, validatePagination, validateObjectId } = require('../utils/validation');

const router = express.Router();

// @route   POST /api/messages
// @desc    Send a new message
// @access  Private
router.post('/', authenticateToken, validateMessageCreation, async (req, res) => {
  try {
    const { receiver, content, job: jobId, quote: quoteId } = req.body;

    // Verify receiver exists
    const receiverUser = await User.findById(receiver);
    if (!receiverUser) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    // Generate chat ID
    const chatId = Message.generateChatId(req.user._id, receiver, jobId);

    // Create message
    const message = new Message({
      chatId,
      sender: req.user._id,
      receiver,
      content: content.trim(),
      job: jobId || null,
      quote: quoteId || null
    });

    await message.save();

    // Populate message for response
    await message.populate([
      { path: 'sender', select: 'firstName lastName avatar' },
      { path: 'receiver', select: 'firstName lastName avatar' }
    ]);

    // Emit real-time message via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.to(chatId).emit('receive_message', {
        message,
        chatId
      });
    }

    res.status(201).json({
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error during message sending' });
  }
});

// @route   GET /api/messages/chats
// @desc    Get user's chat list
// @access  Private
router.get('/chats', authenticateToken, validatePagination, async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Get latest message for each chat
    const chats = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: userId },
            { receiver: userId }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: '$chatId',
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                { 
                  $and: [
                    { $eq: ['$receiver', userId] },
                    { $eq: ['$isRead', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      },
      {
        $skip: skip
      },
      {
        $limit: limit
      }
    ]);

    // Populate user details and job info
    for (let chat of chats) {
      const lastMessage = chat.lastMessage;
      
      // Determine the other participant
      const otherUserId = lastMessage.sender.toString() === userId.toString() 
        ? lastMessage.receiver 
        : lastMessage.sender;

      const otherUser = await User.findById(otherUserId)
        .select('firstName lastName avatar isActive lastActive');

      const job = lastMessage.job ? await Job.findById(lastMessage.job)
        .select('title category status') : null;

      chat.participant = otherUser;
      chat.job = job;
      chat.lastMessageTime = lastMessage.createdAt;
      chat.lastMessageContent = lastMessage.content;
      chat.lastMessageType = lastMessage.messageType;
    }

    const totalChats = await Message.distinct('chatId', {
      $or: [
        { sender: userId },
        { receiver: userId }
      ]
    }).then(chatIds => chatIds.length);

    res.json({
      chats,
      pagination: {
        current: page,
        pages: Math.ceil(totalChats / limit),
        total: totalChats,
        hasNext: page * limit < totalChats,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/messages/chat/:chatId
// @desc    Get messages for a specific chat
// @access  Private
router.get('/chat/:chatId', authenticateToken, validatePagination, async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Verify user is part of this chat
    const chatExists = await Message.findOne({
      chatId,
      $or: [
        { sender: userId },
        { receiver: userId }
      ]
    });

    if (!chatExists) {
      return res.status(404).json({ message: 'Chat not found or access denied' });
    }

    // Get messages
    const messages = await Message.find({
      chatId,
      isDeleted: false
    })
    .populate('sender', 'firstName lastName avatar')
    .populate('receiver', 'firstName lastName avatar')
    .populate('job', 'title category')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    const total = await Message.countDocuments({
      chatId,
      isDeleted: false
    });

    // Mark messages as read
    await Message.updateMany(
      {
        chatId,
        receiver: userId,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    // Get chat participant info
    const otherMessage = messages.find(msg => 
      msg.sender._id.toString() !== userId.toString() || 
      msg.receiver._id.toString() !== userId.toString()
    );

    let participant = null;
    if (otherMessage) {
      const otherUserId = otherMessage.sender._id.toString() === userId.toString() 
        ? otherMessage.receiver._id 
        : otherMessage.sender._id;
      
      participant = await User.findById(otherUserId)
        .select('firstName lastName avatar isActive lastActive');
    }

    res.json({
      messages: messages.reverse(), // Reverse to show oldest first
      participant,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get chat messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/messages/:id/read
// @desc    Mark message as read
// @access  Private
router.put('/:id/read', authenticateToken, validateObjectId('id'), async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Only receiver can mark as read
    if (message.receiver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to mark this message as read' });
    }

    if (!message.isRead) {
      message.isRead = true;
      message.readAt = new Date();
      await message.save();
    }

    res.json({ message: 'Message marked as read' });
  } catch (error) {
    console.error('Mark message as read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/messages/:id
// @desc    Delete a message
// @access  Private (Sender only)
router.delete('/:id', authenticateToken, validateObjectId('id'), async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Only sender can delete their message
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    // Check if message is recent enough to delete (10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    if (message.createdAt < tenMinutesAgo) {
      return res.status(400).json({ message: 'Messages can only be deleted within 10 minutes of sending' });
    }

    // Soft delete
    message.isDeleted = true;
    message.deletedBy = req.user._id;
    message.deletedAt = new Date();
    await message.save();

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/messages/unread-count
// @desc    Get unread message count
// @access  Private
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      receiver: req.user._id,
      isRead: false,
      isDeleted: false
    });

    res.json({ count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/messages/start-chat
// @desc    Start a chat with another user (for a job)
// @access  Private
router.post('/start-chat', authenticateToken, async (req, res) => {
  try {
    const { userId, jobId, initialMessage } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Verify other user exists
    const otherUser = await User.findById(userId);
    if (!otherUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify job if provided
    let job = null;
    if (jobId) {
      job = await Job.findById(jobId);
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }
    }

    const chatId = Message.generateChatId(req.user._id, userId, jobId);

    // Check if chat already exists
    const existingMessage = await Message.findOne({ chatId });
    
    if (existingMessage) {
      return res.json({
        message: 'Chat already exists',
        chatId,
        existing: true
      });
    }

    // Create initial message if provided
    if (initialMessage && initialMessage.trim()) {
      const message = new Message({
        chatId,
        sender: req.user._id,
        receiver: userId,
        content: initialMessage.trim(),
        job: jobId || null
      });

      await message.save();

      // Emit real-time message
      const io = req.app.get('io');
      if (io) {
        io.to(chatId).emit('receive_message', {
          message,
          chatId
        });
      }
    }

    res.json({
      message: 'Chat started successfully',
      chatId,
      job: job ? { _id: job._id, title: job.title, category: job.category } : null,
      participant: {
        _id: otherUser._id,
        firstName: otherUser.firstName,
        lastName: otherUser.lastName,
        avatar: otherUser.avatar
      }
    });
  } catch (error) {
    console.error('Start chat error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/messages/report/:id
// @desc    Report a message
// @access  Private
router.post('/report/:id', authenticateToken, validateObjectId('id'), async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ message: 'Report reason is required' });
    }

    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // User must be part of the conversation
    const isParticipant = message.sender.toString() === req.user._id.toString() ||
                         message.receiver.toString() === req.user._id.toString();

    if (!isParticipant) {
      return res.status(403).json({ message: 'Not authorized to report this message' });
    }

    // Check if already reported by this user
    const existingReport = message.reports.find(
      report => report.reporter.toString() === req.user._id.toString()
    );

    if (existingReport) {
      return res.status(400).json({ message: 'You have already reported this message' });
    }

    message.reports.push({
      reporter: req.user._id,
      reason: reason.trim()
    });

    message.isReported = true;
    await message.save();

    res.json({ message: 'Message reported successfully' });
  } catch (error) {
    console.error('Report message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/messages/search
// @desc    Search messages in user's chats
// @access  Private
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { q, chatId, limit = 20 } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }

    const filter = {
      $or: [
        { sender: req.user._id },
        { receiver: req.user._id }
      ],
      content: new RegExp(q, 'i'),
      isDeleted: false
    };

    // Filter by specific chat if provided
    if (chatId) {
      filter.chatId = chatId;
    }

    const messages = await Message.find(filter)
      .populate('sender', 'firstName lastName avatar')
      .populate('receiver', 'firstName lastName avatar')
      .populate('job', 'title category')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({ messages });
  } catch (error) {
    console.error('Search messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
