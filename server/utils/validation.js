const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// User validation rules
const validateUserRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('role')
    .isIn(['provider', 'seeker'])
    .withMessage('Role must be either provider or seeker'),
  body('phone')
    .optional()
    .isMobilePhone('en-CA')
    .withMessage('Valid Canadian phone number is required'),
  handleValidationErrors
];

const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

const validateProfileUpdate = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('phone')
    .optional()
    .isMobilePhone('en-CA')
    .withMessage('Valid Canadian phone number is required'),
  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio must be less than 500 characters'),
  body('categories')
    .optional()
    .isArray()
    .withMessage('Categories must be an array'),
  body('rates.hourly')
    .optional()
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Hourly rate must be a positive number'),
  handleValidationErrors
];

// Job validation rules
const validateJobCreation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 20, max: 2000 })
    .withMessage('Description must be between 20 and 2000 characters'),
  body('category')
    .notEmpty()
    .withMessage('Category is required'),
  body('budget.type')
    .isIn(['fixed', 'hourly', 'range'])
    .withMessage('Budget type must be fixed, hourly, or range'),
  body('budget.amount')
    .if(body('budget.type').equals('fixed'))
    .isNumeric()
    .isFloat({ min: 1 })
    .withMessage('Budget amount must be a positive number'),
  body('budget.range.min')
    .if(body('budget.type').equals('range'))
    .isNumeric()
    .isFloat({ min: 1 })
    .withMessage('Minimum budget must be a positive number'),
  body('budget.range.max')
    .if(body('budget.type').equals('range'))
    .isNumeric()
    .isFloat({ min: 1 })
    .withMessage('Maximum budget must be a positive number'),
  body('location.address.postalCode')
    .matches(/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/)
    .withMessage('Valid Canadian postal code is required'),
  handleValidationErrors
];

// Quote validation rules
const validateQuoteCreation = [
  body('price.amount')
    .isNumeric()
    .isFloat({ min: 1 })
    .withMessage('Price must be a positive number'),
  body('price.type')
    .isIn(['fixed', 'hourly'])
    .withMessage('Price type must be fixed or hourly'),
  body('message')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Message must be between 10 and 1000 characters'),
  body('estimatedDuration.value')
    .isNumeric()
    .isFloat({ min: 1 })
    .withMessage('Estimated duration value must be positive'),
  body('estimatedDuration.unit')
    .isIn(['hours', 'days', 'weeks', 'months'])
    .withMessage('Duration unit must be hours, days, weeks, or months'),
  handleValidationErrors
];

// Review validation rules
const validateReviewCreation = [
  body('rating.overall')
    .isInt({ min: 1, max: 5 })
    .withMessage('Overall rating must be between 1 and 5'),
  body('comment')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Comment must be between 10 and 1000 characters'),
  body('wouldRecommend')
    .isBoolean()
    .withMessage('Would recommend must be true or false'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  handleValidationErrors
];

// Message validation rules
const validateMessageCreation = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message content must be between 1 and 2000 characters'),
  body('receiver')
    .isMongoId()
    .withMessage('Valid receiver ID is required'),
  handleValidationErrors
];

// Pagination validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

// MongoDB ObjectId validation
const validateObjectId = (paramName = 'id') => [
  param(paramName)
    .isMongoId()
    .withMessage(`Valid ${paramName} is required`),
  handleValidationErrors
];

// Winnipeg location validation
const validateWinnipegLocation = [
  body('address.city')
    .optional()
    .equals('Winnipeg')
    .withMessage('City must be Winnipeg'),
  body('address.province')
    .optional()
    .equals('Manitoba')
    .withMessage('Province must be Manitoba'),
  body('address.postalCode')
    .matches(/^R\d[A-Za-z][ -]?\d[A-Za-z]\d$/)
    .withMessage('Valid Winnipeg postal code is required (starts with R)'),
  handleValidationErrors
];

// Search validation
const validateSearch = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Search query must be between 2 and 100 characters'),
  query('category')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Category cannot be empty'),
  query('minBudget')
    .optional()
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Minimum budget must be a positive number'),
  query('maxBudget')
    .optional()
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Maximum budget must be a positive number'),
  query('radius')
    .optional()
    .isNumeric()
    .isFloat({ min: 1, max: 100 })
    .withMessage('Radius must be between 1 and 100 km'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateProfileUpdate,
  validateJobCreation,
  validateQuoteCreation,
  validateReviewCreation,
  validateMessageCreation,
  validatePagination,
  validateObjectId,
  validateWinnipegLocation,
  validateSearch
};
