const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/database');

// Cache for user data to reduce database queries
const userCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Token blacklist management
const tokenBlacklist = new Set();

// Enhanced authentication middleware with caching and better error handling
const authenticateToken = async (req, res, next) => {
  try {
    // Get token from header, cookie, or query parameter
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1] || 
                  req.cookies?.token || 
                  req.query.token;

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. No token provided.',
        code: 'NO_TOKEN'
      });
    }

    // Check if token is blacklisted
    if (tokenBlacklist.has(token)) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token has been revoked.',
        code: 'TOKEN_REVOKED'
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          success: false, 
          message: 'Token expired. Please login again.',
          code: 'TOKEN_EXPIRED'
        });
      }
      return res.status(403).json({ 
        success: false, 
        message: 'Invalid token.',
        code: 'INVALID_TOKEN'
      });
    }

    // Check cache first
    const cacheKey = `user:${decoded.userId}`;
    const now = Date.now();
    
    if (userCache.has(cacheKey)) {
      const cachedData = userCache.get(cacheKey);
      
      // Check if cache is still valid
      if (now - cachedData.timestamp < CACHE_TTL) {
        req.user = cachedData.user;
        return next();
      } else {
        // Remove expired cache
        userCache.delete(cacheKey);
      }
    }

    // Fetch user from database with enhanced query
    const result = await db.query(`
      SELECT 
        user_id,
        username,
        email,
        role,
        two_fa_enabled,
        is_active,
        last_login,
        failed_login_attempts,
        account_locked_until,
        password_changed_at,
        token_version
      FROM users 
      WHERE user_id = $1
    `, [decoded.userId]);

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found.',
        code: 'USER_NOT_FOUND'
      });
    }

    const user = result.rows[0];

    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({ 
        success: false, 
        message: 'User account is inactive.',
        code: 'USER_INACTIVE'
      });
    }

    // Check if account is locked
    if (user.account_locked_until && new Date() < user.account_locked_until) {
      return res.status(401).json({ 
        success: false, 
        message: 'Account is temporarily locked.',
        code: 'ACCOUNT_LOCKED'
      });
    }

    // Check token version (for logout all devices functionality)
    if (decoded.tokenVersion !== undefined && user.token_version !== decoded.tokenVersion) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token is no longer valid. Please login again.',
        code: 'TOKEN_VERSION_MISMATCH'
      });
    }

    // Create user object for request
    const userObj = {
      userId: user.user_id,
      username: user.username,
      email: user.email,
      role: user.role,
      twoFaEnabled: user.two_fa_enabled,
      lastLogin: user.last_login,
      passwordChangedAt: user.password_changed_at
    };

    // Cache user data
    userCache.set(cacheKey, {
      user: userObj,
      timestamp: now
    });

    // Attach user to request
    req.user = userObj;
    req.token = token; // Store token for potential blacklisting
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error during authentication.',
      code: 'AUTH_ERROR'
    });
  }
};

// Enhanced role-based authorization middleware
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required.',
        code: 'NOT_AUTHENTICATED'
      });
    }

    // Convert single role to array for consistency
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Access denied. Required roles: ${roles.join(', ')}.`,
        code: 'INSUFFICIENT_PRIVILEGES',
        required: roles,
        current: req.user.role
      });
    }

    next();
  };
};

// Specific role checkers
const requireAdmin = requireRole('admin');
const requireManager = requireRole(['admin', 'manager']);
const requireBookkeeper = requireRole(['admin', 'bookkeeper']);
const requireAttendant = requireRole(['admin', 'manager', 'attendant']);
const requireAccountant = requireRole(['admin', 'accountant']);

// Permission-based authorization
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required.',
        code: 'NOT_AUTHENTICATED'
      });
    }

    // Define permissions based on roles
    const permissions = {
      'admin': ['manage_users', 'manage_products', 'manage_sales', 'view_reports', 'manage_inventory', 'manage_expenses', 'manage_finances'],
      'manager': ['manage_products', 'manage_sales', 'view_reports', 'manage_inventory', 'manage_expenses'],
      'bookkeeper': ['manage_sales', 'view_reports', 'manage_finances'],
      'attendant': ['manage_sales'],
      'accountant': ['view_reports', 'manage_finances']
    };

    const userPermissions = permissions[req.user.role] || [];
    
    if (!userPermissions.includes(permission)) {
      return res.status(403).json({ 
        success: false, 
        message: `Access denied. Permission '${permission}' required.`,
        code: 'INSUFFICIENT_PERMISSIONS',
        required: permission,
        currentRole: req.user.role
      });
    }

    next();
  };
};

// Resource ownership check
const requireOwnership = (resourceIdParam = 'id') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required.',
        code: 'NOT_AUTHENTICATED'
      });
    }

    // Admins can access all resources
    if (req.user.role === 'admin') {
      return next();
    }

    const resourceId = req.params[resourceIdParam];
    const userId = req.user.userId;

    // For user-specific resources, check if the user owns the resource
    if (resourceId && resourceId !== userId.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You can only access your own resources.',
        code: 'RESOURCE_NOT_OWNED'
      });
    }

    next();
  };
};

// Rate limiting for sensitive operations
const rateLimitOperation = (operation, windowMs = 60000, max = 5) => {
  const attempts = new Map();
  
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required.',
        code: 'NOT_AUTHENTICATED'
      });
    }

    const key = `${req.user.userId}:${operation}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old attempts
    if (attempts.has(key)) {
      const userAttempts = attempts.get(key).filter(time => time > windowStart);
      attempts.set(key, userAttempts);
    }

    // Check if limit exceeded
    const currentAttempts = attempts.get(key) || [];
    if (currentAttempts.length >= max) {
      return res.status(429).json({
        success: false,
        message: `Too many ${operation} attempts. Please try again later.`,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }

    // Record this attempt
    currentAttempts.push(now);
    attempts.set(key, currentAttempts);

    next();
  };
};

// Token blacklisting for logout
const blacklistToken = (token) => {
  if (token) {
    tokenBlacklist.add(token);
    
    // Clean up blacklist periodically (optional)
    if (tokenBlacklist.size > 1000) {
      // Simple cleanup - in production, use a more sophisticated approach
      const tokenArray = Array.from(tokenBlacklist);
      tokenBlacklist.clear();
      tokenArray.slice(-500).forEach(t => tokenBlacklist.add(t));
    }
  }
};

// Clear user cache (useful for user updates)
const clearUserCache = (userId) => {
  const cacheKey = `user:${userId}`;
  if (userCache.has(cacheKey)) {
    userCache.delete(cacheKey);
  }
};

// Cache cleanup utility
const cleanupCache = () => {
  const now = Date.now();
  for (const [key, data] of userCache.entries()) {
    if (now - data.timestamp > CACHE_TTL) {
      userCache.delete(key);
    }
  }
};

// Start cache cleanup interval
setInterval(cleanupCache, 60000); // Clean every minute

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireManager,
  requireBookkeeper,
  requireAttendant,
  requireAccountant,
  requirePermission,
  requireOwnership,
  rateLimitOperation,
  blacklistToken,
  clearUserCache,
  cleanupCache
};