const rateLimit = require('express-rate-limit');
const { logActivity } = require('./activityLogger');

// Create a cache for failed login attempts
const failedAttempts = new Map();
const accountLockouts = new Map();

// Rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
    retryAfter: 15 * 60 // seconds
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    // Log rate limit exceeded
    logActivity(null, 'rate_limit_exceeded', 'auth', null, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.path
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts, please try again later.',
      retryAfter: 15 * 60
    });
  }
});

// Stricter rate limiter for login attempts
const loginLimiter = (req, res, next) => {
  const identifier = req.body.username || req.ip;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  
  // Clean up old entries
  if (failedAttempts.has(identifier)) {
    const attempts = failedAttempts.get(identifier);
    const validAttempts = attempts.filter(time => now - time < windowMs);
    failedAttempts.set(identifier, validAttempts);
  }
  
  // Check if account is locked
  if (accountLockouts.has(identifier)) {
    const lockoutTime = accountLockouts.get(identifier);
    const lockoutDuration = 30 * 60 * 1000; // 30 minutes
    
    if (now - lockoutTime < lockoutDuration) {
      const remainingTime = Math.ceil((lockoutDuration - (now - lockoutTime)) / 1000);
      return res.status(423).json({
        success: false,
        message: 'Account temporarily locked due to too many failed login attempts.',
        retryAfter: remainingTime
      });
    } else {
      // Unlock account
      accountLockouts.delete(identifier);
      failedAttempts.delete(identifier);
    }
  }
  
  next();
};

// Track failed login attempts
const trackFailedLogin = (req, res, next) => {
  const originalSend = res.send;
  const identifier = req.body.username || req.ip;
  
  res.send = function(body) {
    const response = typeof body === 'string' ? JSON.parse(body) : body;
    
    // Track failed login attempts
    if (res.statusCode === 401 && response.message && 
        (response.message.includes('Invalid credentials') || 
         response.message.includes('Invalid 2FA code'))) {
      
      if (!failedAttempts.has(identifier)) {
        failedAttempts.set(identifier, []);
      }
      
      const attempts = failedAttempts.get(identifier);
      attempts.push(Date.now());
      failedAttempts.set(identifier, attempts);
      
      // Lock account after 5 failed attempts
      if (attempts.length >= 5) {
        accountLockouts.set(identifier, Date.now());
        logActivity(null, 'account_locked', 'auth', null, {
          identifier,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          failedAttempts: attempts.length
        });
      }
    }
    
    originalSend.call(this, body);
  };
  
  next();
};

// Rate limiter for password reset requests
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 password reset requests per hour
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again later.',
    retryAfter: 60 * 60
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiter for 2FA setup/verification
const twoFactorLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 2FA attempts per 15 minutes
  message: {
    success: false,
    message: 'Too many 2FA attempts, please try again later.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  authLimiter,
  loginLimiter,
  trackFailedLogin,
  passwordResetLimiter,
  twoFactorLimiter,
  failedAttempts,
  accountLockouts
};