const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const db = require('../config/database');
const { logActivity } = require('../middleware/activityLogger');
const { 
  authenticateToken,
  blacklistToken,
  clearUserCache,
  requireRole
} = require('../middleware/auth');
const ErrorResponse = require('../utils/errorResponse');

// JWT token management with enhanced security
const tokenManager = {
  generateTokens: (user) => {
    const payload = {
      userId: user.user_id,
      username: user.username,
      role: user.role,
      email: user.email,
      tokenVersion: user.token_version || 0,
      iat: Math.floor(Date.now() / 1000),
      iss: 'wakaruku-petrol-station',
      aud: 'wakaruku-api'
    };

    const accessToken = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { 
        expiresIn: process.env.JWT_EXPIRES_IN || '15m'
      }
    );

    const refreshToken = jwt.sign(
      { 
        userId: user.user_id, 
        tokenVersion: user.token_version || 0,
        type: 'refresh'
      },
      process.env.JWT_REFRESH_SECRET,
      { 
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
      }
    );

    return { accessToken, refreshToken };
  },

  verifyToken: (token, isRefreshToken = false) => {
    try {
      const secret = isRefreshToken ? process.env.JWT_REFRESH_SECRET : process.env.JWT_SECRET;
      const decoded = jwt.verify(token, secret);
      
      // Additional validation for refresh tokens
      if (isRefreshToken && decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }
      
      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token expired');
      }
      throw new Error('Invalid token');
    }
  },

  blacklistToken: (token) => {
    blacklistToken(token);
  },

  isTokenBlacklisted: (token) => {
    // This would check against a blacklist in production (Redis/database)
    // For now, using the middleware's blacklist
    return false;
  }
};

// Password management with enhanced security
const passwordManager = {
  hashPassword: async (password) => {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  },

  comparePassword: async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
  },

  generatePasswordResetToken: () => {
    return crypto.randomBytes(32).toString('hex');
  },

  validatePasswordComplexity: (password) => {
    const minLength = 8;
    const maxLength = 128;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const hasNoCommonPatterns = !/(password|123456|qwerty)/i.test(password);

    const errors = [];
    
    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters long`);
    }
    
    if (password.length > maxLength) {
      errors.push(`Password must not exceed ${maxLength} characters`);
    }
    
    if (!hasUpperCase) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!hasLowerCase) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!hasNumbers) {
      errors.push('Password must contain at least one number');
    }
    
    if (!hasSpecialChar) {
      errors.push('Password must contain at least one special character');
    }

    if (!hasNoCommonPatterns) {
      errors.push('Password cannot contain common patterns');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Check if password has been compromised in data breaches (basic implementation)
  checkPasswordSecurity: async (password) => {
    // In production, you would integrate with HaveIBeenPwned API
    // For now, just check against common passwords
    const commonPasswords = [
      'password', '123456', 'password123', 'admin', 'qwerty'
    ];
    
    if (commonPasswords.includes(password.toLowerCase())) {
      return {
        isSecure: false,
        message: 'This password is too common and not secure'
      };
    }
    
    return { isSecure: true };
  }
};

// 2FA management with enhanced security
const twoFactorManager = {
  generateSecret: (username) => {
    return speakeasy.generateSecret({
      name: `Wakaruku Petrol Station (${username})`,
      issuer: 'Wakaruku Petrol Station',
      length: 32
    });
  },

  generateQRCode: async (secret) => {
    return await QRCode.toDataURL(secret.otpauth_url);
  },

  verifyToken: (secret, token, window = 2) => {
    return speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: window
    });
  },

  generateBackupCodes: () => {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  },

  hashBackupCode: async (code) => {
    return await bcrypt.hash(code, 10);
  },

  verifyBackupCode: async (code, hashedCodes) => {
    for (const hashedCode of hashedCodes) {
      if (await bcrypt.compare(code.toUpperCase(), hashedCode)) {
        return true;
      }
    }
    return false;
  }
};

// Authentication service with enhanced security
class AuthService {
  static async register(userData) {
    const { username, email, password, firstName, lastName, role, phoneNumber } = userData;

    try {
      // Check if user already exists
      const existingUserResult = await db.query(
        'SELECT user_id FROM users WHERE username = $1 OR email = $2',
        [username, email]
      );

      if (existingUserResult.rows.length > 0) {
        throw new ErrorResponse('User with this username or email already exists', 409);
      }

      // Validate password complexity
      const passwordValidation = passwordManager.validatePasswordComplexity(password);
      if (!passwordValidation.isValid) {
        throw new ErrorResponse(passwordValidation.errors.join(', '), 400);
      }

      // Check password security
      const securityCheck = await passwordManager.checkPasswordSecurity(password);
      if (!securityCheck.isSecure) {
        throw new ErrorResponse(securityCheck.message, 400);
      }

      // Hash password
      const hashedPassword = await passwordManager.hashPassword(password);

      // Create user with enhanced security fields
      const result = await db.query(
        `INSERT INTO users (
          username, email, password_hash, role, two_fa_enabled, 
          created_at, password_changed_at, token_version
        ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0)
         RETURNING user_id, username, email, role, created_at`,
        [username, email, hashedPassword, role || 'bookkeeper', false]
      );

      const user = result.rows[0];

      // Log registration with enhanced details
      await logActivity(user.user_id, 'user_registered', 'users', user.user_id, {
        username: user.username,
        email: user.email,
        role: user.role,
        registrationMethod: 'api'
      });

      return {
        id: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.created_at
      };
    } catch (error) {
      throw error;
    }
  }

  static async login(username, password, twoFactorCode = null, clientInfo = {}) {
    try {
      // Check for account lockout
      const lockoutCheck = await this.checkAccountLockout(username);
      if (lockoutCheck.isLocked) {
        throw new ErrorResponse(lockoutCheck.message, 423);
      }

      // Find user with enhanced security fields
      const userResult = await db.query(
        `SELECT user_id, username, email, password_hash, role, two_fa_enabled, 
                two_fa_secret, last_login, is_active, failed_login_attempts, 
                account_locked_until, password_changed_at, token_version
         FROM users WHERE (username = $1 OR email = $1) AND is_active = true`,
        [username]
      );

      if (userResult.rows.length === 0) {
        await this.handleFailedLogin(username, 'user_not_found', clientInfo);
        throw new ErrorResponse('Invalid credentials', 401);
      }

      const user = userResult.rows[0];

      // Verify password
      const isPasswordValid = await passwordManager.comparePassword(password, user.password_hash);
      if (!isPasswordValid) {
        await this.handleFailedLogin(username, 'invalid_password', clientInfo);
        throw new ErrorResponse('Invalid credentials', 401);
      }

      // Check if account is locked (additional check)
      if (user.account_locked_until && new Date() < user.account_locked_until) {
        throw new ErrorResponse('Account is temporarily locked', 423);
      }

      // Check 2FA if enabled
      if (user.two_fa_enabled) {
        if (!twoFactorCode) {
          throw new ErrorResponse('Two-factor authentication required', 400);
        }

        const verified = twoFactorManager.verifyToken(user.two_fa_secret, twoFactorCode);
        if (!verified) {
          await this.handleFailedLogin(username, 'invalid_2fa', clientInfo);
          throw new ErrorResponse('Invalid 2FA code', 400);
        }
      }

      // Reset failed attempts on successful login
      await this.resetFailedAttempts(username);

      // Update last login and token version
      const newTokenVersion = (user.token_version || 0) + 1;
      await db.query(
        `UPDATE users SET last_login = CURRENT_TIMESTAMP, 
                        token_version = $1, 
                        failed_login_attempts = 0,
                        account_locked_until = NULL
         WHERE user_id = $2`,
        [newTokenVersion, user.user_id]
      );

      // Clear user cache to force fresh data
      clearUserCache(user.user_id);

      // Generate tokens
      const tokens = tokenManager.generateTokens({
        ...user,
        token_version: newTokenVersion
      });

      // Log successful login with enhanced details
      await logActivity(user.user_id, 'login_success', 'users', user.user_id, {
        username: user.username,
        loginMethod: 'api',
        clientInfo: clientInfo
      });

      return {
        user: {
          id: user.user_id,
          username: user.username,
          email: user.email,
          role: user.role,
          lastLogin: new Date(),
          isTwoFactorEnabled: user.two_fa_enabled,
          passwordChangedAt: user.password_changed_at
        },
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken
        }
      };
    } catch (error) {
      throw error;
    }
  }

  static async logout(userId, token, clientInfo = {}) {
    try {
      // Blacklist the token
      tokenManager.blacklistToken(token);

      // Log logout
      await logActivity(userId, 'logout', 'users', userId, {
        logoutMethod: 'api',
        clientInfo: clientInfo
      });

      return { message: 'Logged out successfully' };
    } catch (error) {
      throw error;
    }
  }

  static async logoutAllDevices(userId, currentToken, clientInfo = {}) {
    try {
      // Update token version to invalidate all existing tokens
      await db.query(
        'UPDATE users SET token_version = token_version + 1 WHERE user_id = $1',
        [userId]
      );

      // Blacklist current token
      tokenManager.blacklistToken(currentToken);

      // Clear user cache
      clearUserCache(userId);

      // Log logout all devices
      await logActivity(userId, 'logout_all_devices', 'users', userId, {
        logoutMethod: 'api_all_devices',
        clientInfo: clientInfo
      });

      return { message: 'Logged out from all devices successfully' };
    } catch (error) {
      throw error;
    }
  }

  static async refreshToken(refreshToken, clientInfo = {}) {
    try {
      // Verify refresh token
      const decoded = tokenManager.verifyToken(refreshToken, true);
      
      // Check if user still exists and is active
      const userResult = await db.query(
        `SELECT user_id, username, email, role, is_active, token_version
         FROM users WHERE user_id = $1 AND is_active = true`,
        [decoded.userId]
      );

      if (userResult.rows.length === 0) {
        throw new ErrorResponse('Invalid user', 401);
      }

      const user = userResult.rows[0];

      // Verify token version
      if (decoded.tokenVersion !== user.token_version) {
        throw new ErrorResponse('Token version mismatch', 401);
      }

      // Generate new tokens
      const tokens = tokenManager.generateTokens(user);

      // Log token refresh
      await logActivity(user.user_id, 'token_refreshed', 'users', user.user_id, {
        refreshMethod: 'api',
        clientInfo: clientInfo
      });

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      };
    } catch (error) {
      throw error;
    }
  }

  static async enable2FA(userId) {
    try {
      // Generate 2FA secret
      const secret = twoFactorManager.generateSecret(userId.toString());
      const qrCodeUrl = await twoFactorManager.generateQRCode(secret);

      // Save secret (but don't enable yet)
      await db.query(
        'UPDATE users SET two_fa_secret = $1 WHERE user_id = $2',
        [secret.base32, userId]
      );

      return {
        secret: secret.base32,
        qrCode: qrCodeUrl,
        manualEntryKey: secret.base32
      };
    } catch (error) {
      throw error;
    }
  }

  static async verify2FA(userId, code, clientInfo = {}) {
    try {
      // Get user's secret
      const userResult = await db.query(
        'SELECT two_fa_secret FROM users WHERE user_id = $1',
        [userId]
      );

      if (userResult.rows.length === 0 || !userResult.rows[0].two_fa_secret) {
        throw new ErrorResponse('2FA not set up', 400);
      }

      const secret = userResult.rows[0].two_fa_secret;

      const verified = twoFactorManager.verifyToken(secret, code);
      if (!verified) {
        throw new ErrorResponse('Invalid 2FA code', 400);
      }

      // Enable 2FA
      await db.query(
        'UPDATE users SET two_fa_enabled = true WHERE user_id = $1',
        [userId]
      );

      // Generate backup codes
      const backupCodes = twoFactorManager.generateBackupCodes();
      const hashedBackupCodes = await Promise.all(
        backupCodes.map(code => twoFactorManager.hashBackupCode(code))
      );

      await db.query(
        'UPDATE users SET backup_codes = $1 WHERE user_id = $2',
        [JSON.stringify(hashedBackupCodes), userId]
      );

      // Clear user cache
      clearUserCache(userId);

      // Log 2FA enablement
      await logActivity(userId, '2fa_enabled', 'users', userId, {
        enableMethod: 'api',
        clientInfo: clientInfo
      });

      return {
        message: '2FA enabled successfully',
        backupCodes
      };
    } catch (error) {
      throw error;
    }
  }

  static async disable2FA(userId, password, clientInfo = {}) {
    try {
      // Get user and verify password
      const userResult = await db.query(
        'SELECT user_id, password_hash FROM users WHERE user_id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        throw new ErrorResponse('User not found', 404);
      }

      const user = userResult.rows[0];
      const isPasswordValid = await passwordManager.comparePassword(password, user.password_hash);
      
      if (!isPasswordValid) {
        throw new ErrorResponse('Invalid password', 400);
      }

      // Disable 2FA
      await db.query(
        'UPDATE users SET two_fa_enabled = false, two_fa_secret = NULL, backup_codes = NULL WHERE user_id = $1',
        [userId]
      );

      // Clear user cache
      clearUserCache(userId);

      // Log 2FA disablement
      await logActivity(userId, '2fa_disabled', 'users', userId, {
        disableMethod: 'api',
        clientInfo: clientInfo
      });

      return { message: '2FA disabled successfully' };
    } catch (error) {
      throw error;
    }
  }

  static async changePassword(userId, currentPassword, newPassword, clientInfo = {}) {
    try {
      // Get user and verify current password
      const userResult = await db.query(
        'SELECT user_id, password_hash FROM users WHERE user_id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        throw new ErrorResponse('User not found', 404);
      }

      const user = userResult.rows[0];
      const isCurrentPasswordValid = await passwordManager.comparePassword(currentPassword, user.password_hash);
      
      if (!isCurrentPasswordValid) {
        throw new ErrorResponse('Current password is incorrect', 400);
      }

      // Validate new password
      const passwordValidation = passwordManager.validatePasswordComplexity(newPassword);
      if (!passwordValidation.isValid) {
        throw new ErrorResponse(passwordValidation.errors.join(', '), 400);
      }

      // Check password security
      const securityCheck = await passwordManager.checkPasswordSecurity(newPassword);
      if (!securityCheck.isSecure) {
        throw new ErrorResponse(securityCheck.message, 400);
      }

      // Hash new password
      const hashedPassword = await passwordManager.hashPassword(newPassword);

      // Update password and increment token version
      await db.query(
        `UPDATE users SET password_hash = $1, 
                        password_changed_at = CURRENT_TIMESTAMP,
                        token_version = token_version + 1
         WHERE user_id = $2`,
        [hashedPassword, userId]
      );

      // Clear user cache
      clearUserCache(userId);

      // Log password change
      await logActivity(userId, 'password_changed', 'users', userId, {
        changeMethod: 'api',
        clientInfo: clientInfo
      });

      return { message: 'Password changed successfully' };
    } catch (error) {
      throw error;
    }
  }

  // Helper methods for account lockout management
  static async checkAccountLockout(username) {
    const lockoutCheckResult = await db.query(
      `SELECT account_locked_until, failed_login_attempts 
       FROM users WHERE username = $1`,
      [username]
    );

    if (lockoutCheckResult.rows.length > 0) {
      const user = lockoutCheckResult.rows[0];
      
      if (user.account_locked_until && new Date() < user.account_locked_until) {
        const remainingTime = Math.ceil((user.account_locked_until - new Date()) / 60000);
        return {
          isLocked: true,
          message: `Account is locked. Try again in ${remainingTime} minutes.`
        };
      }
    }

    return { isLocked: false };
  }

  static async handleFailedLogin(username, reason, clientInfo) {
    // Update failed login attempts in database
    await db.query(`
      UPDATE users 
      SET failed_login_attempts = COALESCE(failed_login_attempts, 0) + 1,
          last_failed_login = CURRENT_TIMESTAMP
      WHERE username = $1
    `, [username]);

    // Check if account should be locked
    const userResult = await db.query(
      `SELECT failed_login_attempts FROM users WHERE username = $1`,
      [username]
    );

    if (userResult.rows.length > 0) {
      const attempts = userResult.rows[0].failed_login_attempts;
      
      if (attempts >= 5) {
        // Lock account for 30 minutes
        await db.query(
          `UPDATE users 
           SET account_locked_until = CURRENT_TIMESTAMP + INTERVAL '30 minutes',
               failed_login_attempts = 0
           WHERE username = $1`,
          [username]
        );

        console.warn('Account locked due to failed login attempts:', {
          username,
          reason,
          clientInfo
        });
      }
    }
  }

  static async resetFailedAttempts(username) {
    await db.query(
      `UPDATE users 
       SET failed_login_attempts = 0, 
           account_locked_until = NULL
       WHERE username = $1`,
      [username]
    );
  }

  // Method to validate user permissions
  static async checkUserPermissions(userId, requiredPermissions) {
    const userResult = await db.query(
      'SELECT role FROM users WHERE user_id = $1 AND is_active = true',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return false;
    }

    const userRole = userResult.rows[0].role;
    
    // Define permissions based on roles
    const permissions = {
      'admin': ['manage_users', 'manage_products', 'manage_sales', 'view_reports', 'manage_inventory', 'manage_expenses', 'manage_finances'],
      'manager': ['manage_products', 'manage_sales', 'view_reports', 'manage_inventory', 'manage_expenses'],
      'bookkeeper': ['manage_sales', 'view_reports', 'manage_finances'],
      'attendant': ['manage_sales'],
      'accountant': ['view_reports', 'manage_finances']
    };

    const userPermissions = permissions[userRole] || [];
    
    // Check if user has all required permissions
    return requiredPermissions.every(permission => userPermissions.includes(permission));
  }
}

module.exports = AuthService;