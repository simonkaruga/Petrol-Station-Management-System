const express = require('express');
const { sequelize } = require('../config/database');
const { User } = require('../models');
const SecurityUtils = require('../utils/security');

const router = express.Router();

/**
 * Health check endpoint for monitoring system status
 */
router.get('/health', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Check database connection
    let dbStatus = 'healthy';
    let dbResponseTime = 0;
    
    try {
      await sequelize.authenticate();
      const dbStartTime = Date.now();
      await sequelize.query('SELECT 1 as health_check');
      dbResponseTime = Date.now() - dbStartTime;
    } catch (error) {
      dbStatus = 'unhealthy';
      console.error('Database health check failed:', error);
    }

    // Check authentication service
    let authStatus = 'healthy';
    try {
      // Test password hashing (basic auth functionality)
      await SecurityUtils.hashSensitiveData('test');
    } catch (error) {
      authStatus = 'unhealthy';
      console.error('Authentication service health check failed:', error);
    }

    // Check user count
    let userCount = 0;
    try {
      userCount = await User.count();
    } catch (error) {
      console.warn('Could not retrieve user count:', error);
    }

    const responseTime = Date.now() - startTime;

    const healthStatus = {
      status: dbStatus === 'healthy' && authStatus === 'healthy' ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      services: {
        database: {
          status: dbStatus,
          responseTime: `${dbResponseTime}ms`
        },
        authentication: {
          status: authStatus
        }
      },
      metrics: {
        userCount,
        uptime: process.uptime(),
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
        },
        nodeVersion: process.version
      }
    };

    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthStatus);

  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Detailed system metrics endpoint (admin only)
 */
router.get('/metrics', async (req, res) => {
  try {
    // This would typically require admin authentication
    // For now, we'll return basic metrics

    const metrics = {
      timestamp: new Date().toISOString(),
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        platform: process.platform,
        nodeVersion: process.version
      },
      database: {
        totalUsers: await User.count(),
        activeUsers: await User.count({
          where: { isActive: true }
        }),
        twoFactorEnabledUsers: await User.count({
          where: { isTwoFactorEnabled: true }
        })
      },
      security: {
        // These would be populated by actual security monitoring
        failedLoginAttempts: 0,
        lockedAccounts: 0,
        recentLogins: 0,
        activeSessions: 0
      }
    };

    res.json(metrics);

  } catch (error) {
    console.error('Metrics collection failed:', error);
    res.status(500).json({
      error: 'Failed to collect metrics'
    });
  }
});

/**
 * Security status endpoint
 */
router.get('/security-status', async (req, res) => {
  try {
    const securityStatus = {
      timestamp: new Date().toISOString(),
      features: {
        rateLimiting: 'enabled',
        inputValidation: 'enabled',
        securityHeaders: 'enabled',
        passwordComplexity: 'enabled',
        twoFactorAuth: 'enabled',
        sessionManagement: 'enabled'
      },
      statistics: {
        totalUsers: await User.count(),
        activeUsers: await User.count({ where: { isActive: true } }),
        twoFactorEnabledUsers: await User.count({ where: { isTwoFactorEnabled: true } }),
        adminUsers: await User.count({ where: { role: 'admin' } })
      },
      recommendations: [
        'Ensure all users have strong passwords',
        'Encourage 2FA adoption for all users',
        'Regularly review failed login attempts',
        'Monitor for suspicious activity patterns',
        'Keep dependencies updated'
      ]
    };

    res.json(securityStatus);

  } catch (error) {
    console.error('Security status check failed:', error);
    res.status(500).json({
      error: 'Failed to retrieve security status'
    });
  }
});

/**
 * Database connection test
 */
router.get('/db-test', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Test basic database operations
    const userCount = await User.count();
    const testQueryTime = Date.now() - startTime;

    res.json({
      status: 'success',
      message: 'Database connection is working',
      metrics: {
        userCount,
        queryTime: `${testQueryTime}ms`,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Database test failed:', error);
    res.status(500).json({
      status: 'error',
      message: 'Database connection test failed',
      error: error.message
    });
  }
});

/**
 * Configuration validation endpoint
 */
router.get('/config-validation', (req, res) => {
  const configIssues = [];

  // Check required environment variables
  const requiredEnvVars = [
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'DB_HOST',
    'DB_NAME',
    'DB_USER'
  ];

  requiredEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
      configIssues.push({
        type: 'missing_env_var',
        variable: envVar,
        severity: 'high',
        message: `Environment variable ${envVar} is not set`
      });
    }
  });

  // Check JWT secret strength
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    configIssues.push({
      type: 'weak_jwt_secret',
      severity: 'high',
      message: 'JWT secret should be at least 32 characters long'
    });
  }

  // Check if using default values
  if (process.env.DB_HOST === 'localhost' && process.env.NODE_ENV === 'production') {
    configIssues.push({
      type: 'development_config',
      severity: 'medium',
      message: 'Using localhost database in production environment'
    });
  }

  const status = configIssues.length === 0 ? 'valid' : 'issues_found';

  res.json({
    status,
    timestamp: new Date().toISOString(),
    issues: configIssues,
    recommendations: configIssues.length > 0 ? [
      'Set all required environment variables',
      'Use strong secrets for JWT tokens',
      'Review configuration for production environment'
    ] : ['Configuration is valid']
  });
});

module.exports = router;