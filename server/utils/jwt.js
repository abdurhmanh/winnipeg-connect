const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (userId, role = null) => {
  const payload = { userId };
  if (role) payload.role = role;
  
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '7d', // Token expires in 7 days
  });
};

// Generate refresh token
const generateRefreshToken = (userId) => {
  return jwt.sign({ userId, type: 'refresh' }, process.env.JWT_SECRET, {
    expiresIn: '30d', // Refresh token expires in 30 days
  });
};

// Verify token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Generate email verification token
const generateVerificationToken = (userId, email) => {
  return jwt.sign(
    { userId, email, type: 'email_verification' }, 
    process.env.JWT_SECRET, 
    { expiresIn: '24h' }
  );
};

// Generate password reset token
const generatePasswordResetToken = (userId, email) => {
  return jwt.sign(
    { userId, email, type: 'password_reset' }, 
    process.env.JWT_SECRET, 
    { expiresIn: '1h' }
  );
};

// Verify special tokens (email verification, password reset)
const verifySpecialToken = (token, expectedType) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== expectedType) {
      throw new Error('Invalid token type');
    }
    
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyToken,
  generateVerificationToken,
  generatePasswordResetToken,
  verifySpecialToken
};
