const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');

// Security headers configuration
const securityHeaders = (req, res, next) => {
  // Remove X-Powered-By header
  res.removeHeader('X-Powered-By');
  
  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data:; " +
    "font-src 'self'; " +
    "connect-src 'self'; " +
    "frame-ancestors 'none';"
  );
  
  next();
};

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    
    // Remove potentially dangerous characters
    return str
      .replace(/[<>]/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  };

  // Sanitize query parameters
  if (req.query) {
    for (const key in req.query) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitizeString(req.query[key]);
      }
    }
  }

  // Sanitize body parameters
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeString(req.body[key]);
      } else if (typeof req.body[key] === 'object' && req.body[key] !== null) {
        // Recursively sanitize nested objects
        req.body[key] = JSON.parse(JSON.stringify(req.body[key], (k, v) => 
          typeof v === 'string' ? sanitizeString(v) : v
        ));
      }
    }
  }

  next();
};

// Device fingerprinting middleware
const deviceFingerprint = (req, res, next) => {
  const userAgent = req.get('User-Agent') || '';
  const acceptLanguage = req.get('Accept-Language') || '';
  const acceptEncoding = req.get('Accept-Encoding') || '';
  const ip = req.ip || req.connection.remoteAddress;
  
  // Create a simple fingerprint
  const fingerprintData = `${userAgent}|${acceptLanguage}|${acceptEncoding}|${ip}`;
  const fingerprint = crypto.createHash('sha256').update(fingerprintData).digest('hex');
  
  req.deviceFingerprint = fingerprint;
  req.clientInfo = {
    userAgent,
    ip,
    fingerprint
  };
  
  next();
};

// Security audit logging middleware
const securityAudit = (req, res, next) => {
  const startTime = Date.now();
  
  // Log request details
  const logData = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    deviceFingerprint: req.deviceFingerprint,
    requestId: req.id || crypto.randomUUID()
  };

  // Log sensitive operations
  const sensitiveOperations = ['/login', '/register', '/logout', '/change-password', '/2fa'];
  const isSensitive = sensitiveOperations.some(op => req.originalUrl.includes(op));
  
  if (isSensitive) {
    console.log('Security Audit:', {
      ...logData,
      body: req.method === 'POST' ? req.body : undefined,
      query: req.query
    });
  }

  // Override res.json to log responses
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    const responseTime = Date.now() - startTime;
    
    // Log errors and security events
    if (res.statusCode >= 400 || body.success === false) {
      console.warn('Security Event:', {
        ...logData,
        statusCode: res.statusCode,
        responseTime,
        error: body.message,
        success: body.success
      });
    }
    
    return originalJson(body);
  };
  
  next();
};

// Security context middleware
const securityContext = (req, res, next) => {
  // Add security context to request
  req.security = {
    timestamp: Date.now(),
    requestId: req.id || crypto.randomUUID(),
    clientInfo: req.clientInfo,
    isSecure: req.secure || req.headers['x-forwarded-proto'] === 'https'
  };
  
  next();
};

// Enhanced rate limiting configurations
const createRateLimiter = (windowMs, max, message, skipSuccessfulRequests = false) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message,
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    handler: (req, res) => {
      console.warn('Rate limit exceeded:', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.originalUrl,
        method: req.method
      });
      
      res.status(429).json({
        success: false,
        message,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  });
};

// General API rate limiter
const apiLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  100, // limit each IP to 100 requests per windowMs
  'Too many requests from this IP, please try again later.'
);

// Strict rate limiter for authentication endpoints
const authLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // limit each IP to 5 requests per windowMs
  'Too many authentication attempts, please try again later.'
);

// Login rate limiter with progressive delays
const loginLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  3, // limit each IP to 3 login attempts per windowMs
  'Too many login attempts, please try again later.'
);

// Password reset rate limiter
const passwordResetLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  3, // limit each IP to 3 password reset requests per hour
  'Too many password reset attempts, please try again later.'
);

// 2FA rate limiter
const twoFactorLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  10, // limit each IP to 10 2FA attempts per windowMs
  'Too many 2FA attempts, please try again later.'
);

// Account lockout tracking
const accountLockouts = new Map();
const failedAttempts = new Map();

const trackFailedLogin = (req, res, next) => {
  const username = req.body?.username;
  
  if (!username) {
    return next();
  }

  // Check if account is already locked
  if (accountLockouts.has(username)) {
    const lockoutTime = accountLockouts.get(username);
    const lockoutDuration = 30 * 60 * 1000; // 30 minutes
    
    if (Date.now() - lockoutTime < lockoutDuration) {
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked due to too many failed login attempts.',
        code: 'ACCOUNT_LOCKED',
        retryAfter: Math.ceil((lockoutTime + lockoutDuration - Date.now()) / 1000)
      });
    } else {
      // Unlock account
      accountLockouts.delete(username);
      failedAttempts.delete(username);
    }
  }

  // Store original res.json to intercept responses
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    // Track failed login attempts
    if (body && body.success === false && body.message && 
        (body.message.includes('Invalid') || body.message.includes('not found'))) {
      
      if (!failedAttempts.has(username)) {
        failedAttempts.set(username, []);
      }
      
      const attempts = failedAttempts.get(username);
      attempts.push(Date.now());
      
      // Remove attempts older than 15 minutes
      const windowStart = Date.now() - (15 * 60 * 1000);
      const recentAttempts = attempts.filter(time => time > windowStart);
      failedAttempts.set(username, recentAttempts);
      
      // Lock account after 5 failed attempts
      if (recentAttempts.length >= 5) {
        accountLockouts.set(username, Date.now());
        failedAttempts.delete(username);
        
        console.warn('Account locked due to failed login attempts:', {
          username,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      }
    }
    
    return originalJson(body);
  };
  
  next();
};

// Password validation rules
const passwordValidationRules = [
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    })
];

// Email validation rules
const emailValidationRules = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email address too long')
];

// Username validation rules
const usernameValidationRules = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores')
    .trim()
];

// Common validation rules
const commonValidationRules = [
  body('firstName')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces')
    .trim(),
  
  body('lastName')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces')
    .trim(),
  
  body('phoneNumber')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number')
    .trim()
];

// Enhanced validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value,
      location: error.location
    }));
    
    // Log validation errors for security monitoring
    console.warn('Validation error:', {
      requestId: req.security?.requestId,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl,
      method: req.method,
      errors: errorMessages,
      body: req.body
    });
    
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors: errorMessages,
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',') 
      : ['http://localhost:3000', 'http://localhost:3001'];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Security middleware stack
const securityMiddleware = [
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }),
  cors(corsOptions),
  compression(),
  securityHeaders,
  sanitizeInput,
  deviceFingerprint,
  securityAudit,
  securityContext
];

module.exports = {
  securityHeaders,
  sanitizeInput,
  deviceFingerprint,
  securityAudit,
  securityContext,
  apiLimiter,
  authLimiter,
  loginLimiter,
  passwordResetLimiter,
  twoFactorLimiter,
  trackFailedLogin,
  accountLockouts,
  failedAttempts,
  passwordValidationRules,
  emailValidationRules,
  usernameValidationRules,
  commonValidationRules,
  handleValidationErrors,
  securityMiddleware,
  createRateLimiter
};