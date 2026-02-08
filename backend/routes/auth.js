const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const QRCode = require('qrcode');
const speakeasy = require('speakeasy');
const { body, validationResult } = require('express-validator');
const { User } = require('../models');
const { 
  authenticateToken,
  requireAdmin,
  requireRole,
  requirePermission,
  rateLimitOperation
} = require('../middleware/auth');
const { 
  authLimiter, 
  loginLimiter, 
  trackFailedLogin, 
  passwordResetLimiter, 
  twoFactorLimiter,
  handleValidationErrors
} = require('../middleware/security');
const {
  securityHeaders,
  sanitizeInput,
  securityAudit,
  deviceFingerprint,
  securityContext
} = require('../middleware/security');
const AuthService = require('../services/authService');
const ErrorResponse = require('../utils/errorResponse');

const router = express.Router();

// Apply security middleware to all routes
router.use(securityHeaders);
router.use(sanitizeInput);
router.use(securityAudit);
router.use(deviceFingerprint);
router.use(securityContext);

// Validation error handler
const handleAuthValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value
    }));
    
    // Log validation errors
    console.warn('Validation error:', {
      requestId: req.id,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      errors: errorMessages,
      body: req.body
    });
    
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages
    });
  }
  
  next();
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', 
  authLimiter,
  [
    body('username')
      .isLength({ min: 3, max: 50 })
      .withMessage('Username must be between 3 and 50 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores')
      .trim(),
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 8, max: 128 })
      .withMessage('Password must be between 8 and 128 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    body('firstName')
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be between 2 and 50 characters')
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage('First name can only contain letters and spaces'),
    body('lastName')
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be between 2 and 50 characters')
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage('Last name can only contain letters and spaces'),
    body('phoneNumber')
      .optional()
      .isMobilePhone()
      .withMessage('Please provide a valid phone number')
  ],
  handleAuthValidationErrors,
  async (req, res, next) => {
    try {
      const userData = {
        username: req.body.username,
        email: req.body.email,
        password: req.body.password,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        role: req.body.role,
        phoneNumber: req.body.phoneNumber
      };

      const result = await AuthService.register(userData);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: result.id,
            username: result.username,
            email: result.email,
            firstName: result.firstName,
            lastName: result.lastName,
            role: result.role,
            phoneNumber: result.phoneNumber,
            lastLogin: result.lastLogin,
            isTwoFactorEnabled: result.isTwoFactorEnabled
          }
        }
      });

    } catch (error) {
      console.error('Registration error:', error);
      next(error);
    }
  }
);

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', 
  authLimiter,
  loginLimiter,
  trackFailedLogin,
  [
    body('username')
      .notEmpty()
      .withMessage('Username is required'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],
  handleAuthValidationErrors,
  async (req, res, next) => {
    try {
      const { username, password, twoFactorCode } = req.body;

      const result = await AuthService.login(username, password, twoFactorCode);

      // Log successful login with device info
      console.log('Successful login:', {
        requestId: req.id,
        userId: result.user.id,
        username: result.user.username,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        deviceFingerprint: req.deviceFingerprint,
        timestamp: new Date().toISOString()
      });

      res.json({
        success: true,
        message: 'Login successful',
        data: result
      });

    } catch (error) {
      console.error('Login error:', error);
      
      // Log failed login attempt
      console.warn('Failed login attempt:', {
        requestId: req.id,
        username: req.body.username,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        deviceFingerprint: req.deviceFingerprint,
        error: error.message,
        timestamp: new Date().toISOString()
      });

      // Return generic error message to prevent information leakage
      if (error.message.includes('Invalid credentials') || 
          error.message.includes('Account is temporarily locked')) {
        return res.status(401).json({
          success: false,
          message: error.message
        });
      }

      next(error);
    }
  }
);

// @desc    Refresh JWT token
// @route   POST /api/auth/refresh
// @access  Private
router.post('/refresh',
  authLimiter,
  async (req, res, next) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required'
        });
      }

      const result = await AuthService.refreshToken(refreshToken);

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: result
      });

    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }
  }
);

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout',
  authenticateToken,
  async (req, res, next) => {
    try {
      const { authorization } = req.headers;
      const token = authorization && authorization.split(' ')[1];

      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Token is required'
        });
      }

      const result = await AuthService.logout(req.user.id, token);

      res.json({
        success: true,
        message: result.message
      });

    } catch (error) {
      console.error('Logout error:', error);
      next(error);
    }
  }
);

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
router.get('/profile',
  authenticateToken,
  async (req, res, next) => {
    try {
      const user = await User.findById(req.user.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: {
          user: {
            id: user.user_id,
            username: user.username,
            email: user.email,
            firstName: user.first_name || '',
            lastName: user.last_name || '',
            role: user.role,
            phoneNumber: user.phone_number || '',
            isActive: user.is_active,
            lastLogin: user.last_login,
            isTwoFactorEnabled: user.two_fa_enabled
          }
        }
      });

    } catch (error) {
      console.error('Get profile error:', error);
      next(error);
    }
  }
);

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile',
  authenticateToken,
  [
    body('firstName')
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be between 2 and 50 characters')
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage('First name can only contain letters and spaces'),
    
    body('lastName')
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be between 2 and 50 characters')
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage('Last name can only contain letters and spaces'),
    
    body('phoneNumber')
      .optional()
      .isMobilePhone()
      .withMessage('Please provide a valid phone number'),
    
    body('email')
      .optional()
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail()
  ],
  handleAuthValidationErrors,
  async (req, res, next) => {
    try {
      const { firstName, lastName, phoneNumber, email } = req.body;
      const user = await User.findById(req.user.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if email is already taken by another user
      if (email && email !== user.email) {
        const existingUser = await User.findByEmail(email);
        if (existingUser && existingUser.user_id !== user.user_id) {
          return res.status(400).json({
            success: false,
            message: 'Email is already in use'
          });
        }
      }

      // Update user
      const updateData = {};
      if (firstName) updateData.first_name = firstName;
      if (lastName) updateData.last_name = lastName;
      if (phoneNumber) updateData.phone_number = phoneNumber;
      if (email) updateData.email = email;

      const updatedUser = await User.update(user.user_id, updateData);

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: {
            id: updatedUser.user_id,
            username: updatedUser.username,
            email: updatedUser.email,
            firstName: updatedUser.first_name || '',
            lastName: updatedUser.last_name || '',
            role: updatedUser.role,
            phoneNumber: updatedUser.phone_number || '',
            isActive: updatedUser.is_active,
            lastLogin: updatedUser.last_login,
            isTwoFactorEnabled: updatedUser.two_fa_enabled
          }
        }
      });

    } catch (error) {
      console.error('Update profile error:', error);
      next(error);
    }
  }
);

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
router.put('/change-password',
  authenticateToken,
  [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8, max: 128 })
      .withMessage('New password must be between 8 and 128 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    body('confirmNewPassword')
      .custom((value, { req }) => {
        if (value !== req.body.newPassword) {
          throw new Error('New password confirmation does not match new password');
        }
        return true;
      })
  ],
  handleAuthValidationErrors,
  async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body;

      const result = await AuthService.changePassword(req.user.id, currentPassword, newPassword);

      res.json({
        success: true,
        message: result.message
      });

    } catch (error) {
      console.error('Change password error:', error);
      next(error);
    }
  }
);

// @desc    Enable 2FA
// @route   POST /api/auth/2fa/enable
// @access  Private
router.post('/2fa/enable',
  authenticateToken,
  twoFactorLimiter,
  async (req, res, next) => {
    try {
      const result = await AuthService.enable2FA(req.user.id);

      res.json({
        success: true,
        message: '2FA setup initiated',
        data: result
      });

    } catch (error) {
      console.error('Enable 2FA error:', error);
      next(error);
    }
  }
);

// @desc    Verify and enable 2FA
// @route   POST /api/auth/2fa/verify
// @access  Private
router.post('/2fa/verify',
  authenticateToken,
  [
    body('code')
      .isLength({ min: 6, max: 6 })
      .withMessage('2FA code must be 6 digits')
      .isNumeric()
      .withMessage('2FA code must be numeric')
  ],
  handleAuthValidationErrors,
  twoFactorLimiter,
  async (req, res, next) => {
    try {
      const { code } = req.body;

      const result = await AuthService.verify2FA(req.user.id, code);

      res.json({
        success: true,
        message: result.message,
        data: {
          backupCodes: result.backupCodes
        }
      });

    } catch (error) {
      console.error('Verify 2FA error:', error);
      next(error);
    }
  }
);

// @desc    Disable 2FA
// @route   POST /api/auth/2fa/disable
// @access  Private
router.post('/2fa/disable',
  authenticateToken,
  [
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],
  handleAuthValidationErrors,
  async (req, res, next) => {
    try {
      const { password } = req.body;

      const result = await AuthService.disable2FA(req.user.id, password);

      res.json({
        success: true,
        message: result.message
      });

    } catch (error) {
      console.error('Disable 2FA error:', error);
      next(error);
    }
  }
);

// @desc    Use backup code for 2FA
// @route   POST /api/auth/2fa/backup
// @access  Private
router.post('/2fa/backup',
  authenticateToken,
  [
    body('backupCode')
      .notEmpty()
      .withMessage('Backup code is required')
      .isLength({ min: 8, max: 8 })
      .withMessage('Backup code must be 8 characters')
      .isAlphanumeric()
      .withMessage('Backup code must be alphanumeric')
  ],
  handleAuthValidationErrors,
  twoFactorLimiter,
  async (req, res, next) => {
    try {
      const { backupCode } = req.body;
      const user = await User.findById(req.user.userId);

      if (!user || !user.backup_codes || !user.two_fa_enabled) {
        return res.status(400).json({
          success: false,
          message: 'Backup codes are not available'
        });
      }

      // Parse backup codes from JSON
      const backupCodes = JSON.parse(user.backup_codes || '[]');
      
      // Check if backup code is valid
      let isValidBackupCode = false;
      let updatedBackupCodes = [];
      
      for (const code of backupCodes) {
        if (await bcrypt.compare(backupCode.toUpperCase(), code)) {
          isValidBackupCode = true;
        } else {
          updatedBackupCodes.push(code);
        }
      }

      if (!isValidBackupCode) {
        return res.status(400).json({
          success: false,
          message: 'Invalid backup code'
        });
      }

      // Update user with remaining backup codes
      await User.updateBackupCodes(user.user_id, updatedBackupCodes);

      // Log backup code usage
      const logActivity = require('../middleware/logger').logActivity;
      await logActivity(user.user_id, 'backup_code_used', 'users', user.user_id, {
        remainingCodes: updatedBackupCodes.length
      });

      res.json({
        success: true,
        message: 'Backup code verified successfully',
        data: {
          remainingCodes: updatedBackupCodes.length
        }
      });

    } catch (error) {
      console.error('Backup code error:', error);
      next(error);
    }
  }
);

// @desc    Security audit log
// @route   GET /api/auth/security-log
// @access  Private (Admin only)
router.get('/security-log',
  authenticateToken,
  async (req, res, next) => {
    try {
      // Only admins can view security logs
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // This would typically query the ActivityLog model
      // For now, we'll return a placeholder response
      res.json({
        success: true,
        message: 'Security audit log endpoint (implementation pending)'
      });

    } catch (error) {
      console.error('Security log error:', error);
      next(error);
    }
  }
);

module.exports = router;