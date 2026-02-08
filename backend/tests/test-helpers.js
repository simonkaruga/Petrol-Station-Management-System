const { sequelize } = require('../config/database');
const { User } = require('../models');

/**
 * Test helpers for setting up and cleaning up test database
 */
class TestHelpers {
  /**
   * Setup test database
   */
  static async setupDatabase() {
    // Sync database schema
    await sequelize.sync({ force: true });
    
    // Create test users if needed
    await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'TestPass123!',
      firstName: 'Test',
      lastName: 'User',
      role: 'attendant'
    });
  }

  /**
   * Cleanup test database
   */
  static async cleanupDatabase() {
    // Clean up all data
    await User.destroy({ where: {} });
  }

  /**
   * Create test user
   * @param {object} userData - User data
   * @returns {Promise<User>} - Created user
   */
  static async createTestUser(userData = {}) {
    const defaultData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'TestPass123!',
      firstName: 'Test',
      lastName: 'User',
      role: 'attendant'
    };

    return await User.create({ ...defaultData, ...userData });
  }

  /**
   * Generate test JWT token
   * @param {object} payload - Token payload
   * @returns {string} - JWT token
   */
  static generateTestToken(payload = {}) {
    const defaultPayload = {
      userId: 1,
      username: 'testuser',
      role: 'attendant'
    };

    return require('jsonwebtoken').sign(
      { ...defaultPayload, ...payload },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  }

  /**
   * Mock request object for testing
   * @param {object} overrides - Request overrides
   * @returns {object} - Mock request
   */
  static mockRequest(overrides = {}) {
    return {
      body: {},
      params: {},
      query: {},
      headers: {},
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('test-user-agent'),
      user: null,
      ...overrides
    };
  }

  /**
   * Mock response object for testing
   * @returns {object} - Mock response
   */
  static mockResponse() {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis()
    };
    return res;
  }

  /**
   * Mock next function for testing
   * @returns {jest.Mock} - Mock next function
   */
  static mockNext() {
    return jest.fn();
  }

  /**
   * Wait for specified time
   * @param {number} ms - Milliseconds to wait
   * @returns {Promise} - Promise that resolves after waiting
   */
  static wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create multiple test users
   * @param {number} count - Number of users to create
   * @param {object} userData - Base user data
   * @returns {Promise<User[]>} - Array of created users
   */
  static async createMultipleTestUsers(count, userData = {}) {
    const users = [];
    
    for (let i = 0; i < count; i++) {
      const user = await this.createTestUser({
        username: `testuser${i}`,
        email: `test${i}@example.com`,
        ...userData
      });
      users.push(user);
    }
    
    return users;
  }

  /**
   * Reset rate limiting for tests
   */
  static resetRateLimiting() {
    if (global.blacklistedTokens) {
      global.blacklistedTokens.clear();
    }
    
    // Reset any rate limiting caches if implemented
    const rateLimiter = require('../middleware/rateLimiter');
    if (rateLimiter.failedAttempts) {
      rateLimiter.failedAttempts.clear();
    }
    if (rateLimiter.accountLockouts) {
      rateLimiter.accountLockouts.clear();
    }
  }
}

module.exports = TestHelpers;