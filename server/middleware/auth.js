const jwt = require('jsonwebtoken');
const admin = require('../config/firebase');
const User = require('../models/User');

// JWT Authentication
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    // Try JWT first
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      req.user = user;
      return next();
    } catch (jwtError) {
      // If JWT fails, try Firebase token (if available)
      if (admin) {
        try {
          const decodedToken = await admin.auth().verifyIdToken(token);
          const user = await User.findOne({ firebaseUid: decodedToken.uid }).select('-password');
          
          if (!user) {
            return res.status(401).json({ message: 'User not found' });
          }

          req.user = user;
          return next();
        } catch (firebaseError) {
          return res.status(401).json({ message: 'Invalid token' });
        }
      } else {
        return res.status(401).json({ message: 'Invalid token' });
      }
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: 'Authentication error' });
  }
};

// Firebase Authentication
const authenticateFirebase = async (req, res, next) => {
  try {
    if (!admin) {
      return res.status(501).json({ message: 'Firebase authentication not configured' });
    }

    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Firebase token required' });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.firebaseUser = decodedToken;
    
    // Try to find existing user
    const user = await User.findOne({ firebaseUid: decodedToken.uid }).select('-password');
    if (user) {
      req.user = user;
    }

    next();
  } catch (error) {
    console.error('Firebase auth error:', error);
    return res.status(401).json({ message: 'Invalid Firebase token' });
  }
};

// Role-based authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. Required role: ${roles.join(' or ')}` 
      });
    }

    next();
  };
};

// Check if user profile is complete
const requireCompleteProfile = (req, res, next) => {
  if (!req.user.isProfileComplete) {
    return res.status(400).json({ 
      message: 'Profile completion required',
      redirectTo: '/profile/complete'
    });
  }
  next();
};

// Check if email is verified
const requireVerifiedEmail = (req, res, next) => {
  if (!req.user.isEmailVerified) {
    return res.status(400).json({ 
      message: 'Email verification required',
      redirectTo: '/verify-email'
    });
  }
  next();
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        if (user) {
          req.user = user;
        }
      } catch (error) {
        // Ignore token errors for optional auth
      }
    }

    next();
  } catch (error) {
    next();
  }
};

// Check if user owns resource
const checkOwnership = (resourceModel, resourceIdParam = 'id', ownerField = 'postedBy') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[resourceIdParam];
      const resource = await resourceModel.findById(resourceId);

      if (!resource) {
        return res.status(404).json({ message: 'Resource not found' });
      }

      const ownerId = resource[ownerField];
      if (ownerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied. You do not own this resource.' });
      }

      req.resource = resource;
      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      return res.status(500).json({ message: 'Error checking resource ownership' });
    }
  };
};

module.exports = {
  authenticateToken,
  authenticateFirebase,
  authorize,
  requireCompleteProfile,
  requireVerifiedEmail,
  optionalAuth,
  checkOwnership
};
