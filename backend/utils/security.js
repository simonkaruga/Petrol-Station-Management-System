const crypto = require('crypto');
const bcrypt = require('bcryptjs');

/**
 * Security utility functions for the authentication system
 */
class SecurityUtils {
  /**
   * Generate a secure random token
   * @param {number} length - Token length in bytes
   * @returns {string} - Hex-encoded random token
   */
  static generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate a secure random password
   * @param {number} length - Password length
   * @returns {string} - Generated password
   */
  static generateSecurePassword(length = 16) {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, charset.length);
      password += charset[randomIndex];
    }
    
    return password;
  }

  /**
   * Hash sensitive data for storage
   * @param {string} data - Data to hash
   * @returns {Promise<string>} - Hashed data
   */
  static async hashSensitiveData(data) {
    return await bcrypt.hash(data, 12);
  }

  /**
   * Compare sensitive data with hash
   * @param {string} data - Plain text data
   * @param {string} hash - Hashed data
   * @returns {Promise<boolean>} - Comparison result
   */
  static async compareSensitiveData(data, hash) {
    return await bcrypt.compare(data, hash);
  }

  /**
   * Generate device fingerprint
   * @param {object} request - Express request object
   * @returns {string} - Device fingerprint hash
   */
  static generateDeviceFingerprint(req) {
    const components = [
      req.get('User-Agent') || 'unknown',
      req.get('Accept-Language') || 'unknown',
      req.get('Accept-Encoding') || 'unknown',
      req.ip || req.connection.remoteAddress || 'unknown'
    ].join('|');

    return crypto.createHash('sha256').update(components).digest('hex');
  }

  /**
   * Validate JWT token format
   * @param {string} token - JWT token to validate
   * @returns {boolean} - Whether token format is valid
   */
  static validateJWTFormat(token) {
    if (!token || typeof token !== 'string') {
      return false;
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }

    try {
      // Check if each part is valid base64
      parts.forEach(part => {
        Buffer.from(part, 'base64');
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Sanitize user input to prevent XSS
   * @param {string} input - Input to sanitize
   * @returns {string} - Sanitized input
   */
  static sanitizeInput(input) {
    if (typeof input !== 'string') {
      return input;
    }

    return input
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }

  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} - Whether email format is valid
   */
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate username format
   * @param {string} username - Username to validate
   * @returns {boolean} - Whether username format is valid
   */
  static validateUsername(username) {
    const usernameRegex = /^[a-zA-Z0-9_]{3,50}$/;
    return usernameRegex.test(username);
  }

  /**
   * Check if password has been compromised (simplified version)
   * In production, you would integrate with HaveIBeenPwned API
   * @param {string} password - Password to check
   * @returns {Promise<boolean>} - Whether password is compromised
   */
  static async isPasswordCompromised(password) {
    // This is a simplified implementation
    // In production, integrate with HaveIBeenPwned API
    const commonPasswords = [
      'password', '123456', 'password123', 'admin', 'qwerty'
    ];
    
    return commonPasswords.includes(password.toLowerCase());
  }

  /**
   * Generate secure session ID
   * @returns {string} - Secure session ID
   */
  static generateSessionId() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Encrypt sensitive data
   * @param {string} data - Data to encrypt
   * @param {string} key - Encryption key
   * @returns {string} - Encrypted data
   */
  static encryptData(data, key) {
    const algorithm = 'aes-256-gcm';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, key);
    cipher.setAAD(Buffer.from('additional-data', 'utf8'));
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  /**
   * Decrypt sensitive data
   * @param {object} encryptedData - Encrypted data object
   * @param {string} key - Decryption key
   * @returns {string} - Decrypted data
   */
  static decryptData(encryptedData, key) {
    const algorithm = 'aes-256-gcm';
    const decipher = crypto.createDecipher(algorithm, key);
    decipher.setAAD(Buffer.from('additional-data', 'utf8'));
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Rate limiting key generator
   * @param {object} req - Express request object
   * @returns {string} - Rate limiting key
   */
  static generateRateLimitKey(req) {
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || 'unknown';
    const userId = req.user?.id || 'anonymous';
    
    return `${ip}:${userAgent}:${userId}`;
  }

  /**
   * Check if request is from a bot
   * @param {object} req - Express request object
   * @returns {boolean} - Whether request appears to be from a bot
   */
  static isBotRequest(req) {
    const userAgent = req.get('User-Agent') || '';
    const botPatterns = [
      /bot/i, /crawler/i, /spider/i, /scraper/i,
      /curl/i, /wget/i, /python/i, /requests/i
    ];

    return botPatterns.some(pattern => pattern.test(userAgent));
  }

  /**
   * Generate security headers for response
   * @returns {object} - Security headers object
   */
  static getSecurityHeaders() {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
    };
  }

  /**
   * Validate file upload
   * @param {object} file - File object from multer
   * @returns {object} - Validation result
   */
  static validateFileUpload(file) {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain'
    ];
    
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    const result = {
      isValid: true,
      errors: []
    };

    if (!file) {
      result.isValid = false;
      result.errors.push('No file provided');
      return result;
    }

    if (!allowedTypes.includes(file.mimetype)) {
      result.isValid = false;
      result.errors.push('Invalid file type');
    }

    if (file.size > maxSize) {
      result.isValid = false;
      result.errors.push('File too large');
    }

    // Check for dangerous file extensions
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.sh', '.php', '.js'];
    const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
    
    if (dangerousExtensions.includes(fileExtension)) {
      result.isValid = false;
      result.errors.push('Potentially dangerous file type');
    }

    return result;
  }

  /**
   * Generate audit log entry
   * @param {string} action - Action performed
   * @param {string} resource - Resource affected
   * @param {string} userId - User ID
   * @param {object} details - Additional details
   * @returns {object} - Audit log entry
   */
  static generateAuditLog(action, resource, userId, details = {}) {
    return {
      timestamp: new Date().toISOString(),
      action,
      resource,
      userId,
      details: {
        ...details,
        ip: details.ip || 'unknown',
        userAgent: details.userAgent || 'unknown',
        deviceFingerprint: details.deviceFingerprint || 'unknown'
      }
    };
  }

  /**
   * Check if IP is in allowed range (simplified)
   * @param {string} ip - IP address to check
   * @param {array} allowedRanges - Array of allowed IP ranges
   * @returns {boolean} - Whether IP is allowed
   */
  static isIPAllowed(ip, allowedRanges = []) {
    if (allowedRanges.length === 0) {
      return true; // No restrictions
    }

    // Simplified IP checking - in production, use a proper IP range library
    return allowedRanges.some(range => {
      if (range === ip) return true;
      if (range.endsWith('/24')) {
        const baseIP = range.split('/24')[0];
        return ip.startsWith(baseIP);
      }
      return false;
    });
  }
}

module.exports = SecurityUtils;