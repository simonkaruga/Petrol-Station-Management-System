const { body, validationResult, sanitizeQuery, sanitizeParam, sanitizeBody } = require('express-validator');

// Password validation rules
const passwordRules = [
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  body('password')
    .custom((value, { req }) => {
      if (req.body.currentPassword && value === req.body.currentPassword) {
        throw new Error('New password must be different from current password');
      }
      return true;
    })
];

// Username validation rules
const usernameRules = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores')
];

// Email validation rules
const emailRules = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
];

// Name validation rules
const nameRules = [
  body('firstName')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),
  
  body('lastName')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces')
];

// Phone number validation rules
const phoneRules = [
  body('phoneNumber')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number')
];

// 2FA validation rules
const twoFactorRules = [
  body('twoFactorCode')
    .isLength({ min: 6, max: 6 })
    .withMessage('2FA code must be 6 digits')
    .isNumeric()
    .withMessage('2FA code must be numeric')
];

// Login validation rules
const loginRules = [
  body('username')
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ max: 50 })
    .withMessage('Username cannot exceed 50 characters'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ max: 128 })
    .withMessage('Password cannot exceed 128 characters'),
  
  body('twoFactorCode')
    .optional()
    .isLength({ min: 6, max: 6 })
    .withMessage('2FA code must be 6 digits')
    .isNumeric()
    .withMessage('2FA code must be numeric')
];

// Registration validation rules
const registrationRules = [
  ...usernameRules,
  ...emailRules,
  ...passwordRules,
  ...nameRules,
  ...phoneRules,
  
  body('role')
    .optional()
    .isIn(['admin', 'manager', 'attendant', 'accountant'])
    .withMessage('Invalid role specified')
];

// Change password validation rules
const changePasswordRules = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  ...passwordRules
];

// JWT token validation
const tokenValidation = [
  body('token')
    .notEmpty()
    .withMessage('Token is required')
    .isLength({ min: 10 })
    .withMessage('Invalid token format')
];

// Input sanitization
const sanitizeInput = [
  body('username').escape(),
  body('email').escape(),
  body('firstName').escape(),
  body('lastName').escape(),
  body('phoneNumber').escape()
];

// Validation result handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value
    }));
    
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages
    });
  }
  
  next();
};

// Custom validation for password history (would need database integration)
const checkPasswordHistory = (userId) => {
  return async (value, { req }) => {
    // This would check against the user's password history in the database
    // For now, we'll implement a basic version
    const recentPasswords = req.body.recentPasswords || [];
    
    if (recentPasswords.includes(value)) {
      throw new Error('Cannot reuse recent passwords');
    }
    
    return true;
  };
};

// Custom validation for account status
const checkAccountStatus = async (username) => {
  // This would check if the account is active and not locked
  // Implementation would depend on your database structure
  return true;
};

module.exports = {
  passwordRules,
  usernameRules,
  emailRules,
  nameRules,
  phoneRules,
  twoFactorRules,
  loginRules,
  registrationRules,
  changePasswordRules,
  tokenValidation,
  sanitizeInput,
  handleValidationErrors,
  checkPasswordHistory,
  checkAccountStatus,
  sanitizeBody
};
