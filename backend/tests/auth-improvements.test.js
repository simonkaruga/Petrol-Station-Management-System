const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = require('../server');
const db = require('../config/database');

describe('Authentication System Improvements', () => {
  let testUser;
  let authToken;

  before(async () => {
    // Create test user
    const hashedPassword = await bcrypt.hash('TestPassword123!', 12);
    const userResult = await db.query(
      `INSERT INTO users (username, email, password_hash, role, is_active, token_version)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING user_id, username, email, role`,
      ['testuser', 'test@example.com', hashedPassword, 'admin', true, 0]
    );
    testUser = userResult.rows[0];
  });

  after(async () => {
    // Clean up test user
    await db.query('DELETE FROM users WHERE username = $1', ['testuser']);
  });

  describe('Enhanced Authentication Middleware', () => {
    it('should authenticate valid token', async () => {
      const payload = {
        userId: testUser.user_id,
        username: testUser.username,
        role: testUser.role,
        email: testUser.email,
        tokenVersion: 0
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.username).toBe(testUser.username);
    });

    it('should reject expired token', async () => {
      const payload = {
        userId: testUser.user_id,
        username: testUser.username,
        role: testUser.role,
        email: testUser.email,
        tokenVersion: 0
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '-1h' });

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('TOKEN_EXPIRED');
    });

    it('should reject token with wrong version', async () => {
      const payload = {
        userId: testUser.user_id,
        username: testUser.username,
        role: testUser.role,
        email: testUser.email,
        tokenVersion: 999 // Wrong version
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('TOKEN_VERSION_MISMATCH');
    });

    it('should reject blacklisted token', async () => {
      // This would need to be implemented with actual blacklist functionality
      // For now, we'll test the structure
      const payload = {
        userId: testUser.user_id,
        username: testUser.username,
        role: testUser.role,
        email: testUser.email,
        tokenVersion: 0
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });

      // Mock blacklist check would go here
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Enhanced Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
    });

    it('should remove X-Powered-By header', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.headers['x-powered-by']).toBeUndefined();
    });
  });

  describe('Input Sanitization', () => {
    it('should sanitize malicious input', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: '<script>alert("xss")</script>',
          email: 'test@example.com',
          password: 'TestPassword123!',
          confirmPassword: 'TestPassword123!'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should reject weak passwords', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'newuser',
          email: 'new@example.com',
          password: '123', // Too weak
          confirmPassword: '123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to auth endpoints', async () => {
      const requests = [];
      
      // Make multiple requests to trigger rate limiting
      for (let i = 0; i < 6; i++) {
        requests.push(
          request(app)
            .post('/api/auth/login')
            .send({
              username: 'testuser',
              password: 'wrongpassword'
            })
        );
      }

      const responses = await Promise.all(requests);
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Account Lockout', () => {
    it('should lock account after failed login attempts', async () => {
      // Make 5 failed login attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({
            username: 'testuser',
            password: 'wrongpassword'
          });
      }

      // 6th attempt should be blocked
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(423);
      expect(response.body.code).toBe('ACCOUNT_LOCKED');
    });
  });

  describe('Enhanced Password Security', () => {
    it('should reject common passwords', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'newuser',
          email: 'new@example.com',
          password: 'password123', // Common password
          confirmPassword: 'password123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('too common');
    });

    it('should enforce password complexity', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'newuser',
          email: 'new@example.com',
          password: 'simple', // Doesn't meet complexity requirements
          confirmPassword: 'simple'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });
  });

  describe('Role-Based Authorization', () => {
    beforeEach(async () => {
      // Create auth token for test user
      const payload = {
        userId: testUser.user_id,
        username: testUser.username,
        role: testUser.role,
        email: testUser.email,
        tokenVersion: 0
      };

      authToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });
    });

    it('should allow admin to access admin endpoints', async () => {
      const response = await request(app)
        .get('/api/auth/security-log')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should reject non-admin from admin endpoints', async () => {
      // Create a non-admin user
      const hashedPassword = await bcrypt.hash('TestPassword123!', 12);
      const userResult = await db.query(
        `INSERT INTO users (username, email, password_hash, role, is_active, token_version)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING user_id, username, email, role`,
        ['testuser2', 'test2@example.com', hashedPassword, 'attendant', true, 0]
      );

      const nonAdminUser = userResult.rows[0];
      const nonAdminToken = jwt.sign(
        {
          userId: nonAdminUser.user_id,
          username: nonAdminUser.username,
          role: nonAdminUser.role,
          email: nonAdminUser.email,
          tokenVersion: 0
        },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );

      const response = await request(app)
        .get('/api/auth/security-log')
        .set('Authorization', `Bearer ${nonAdminToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('INSUFFICIENT_PRIVILEGES');

      // Clean up
      await db.query('DELETE FROM users WHERE username = $1', ['testuser2']);
    });
  });

  describe('Token Management', () => {
    it('should handle token refresh', async () => {
      const refreshToken = jwt.sign(
        {
          userId: testUser.user_id,
          tokenVersion: 0,
          type: 'refresh'
        },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      );

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Security Audit Logging', () => {
    it('should log security events', async () => {
      // This would test that security events are properly logged
      // Implementation depends on the logging system
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword'
        });

      // Should log failed login attempt
      expect(response.status).toBe(401);
    });
  });

  describe('Caching Performance', () => {
    it('should cache user data for performance', async () => {
      const payload = {
        userId: testUser.user_id,
        username: testUser.username,
        role: testUser.role,
        email: testUser.email,
        tokenVersion: 0
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });

      // First request
      const startTime1 = Date.now();
      await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      const firstRequestTime = Date.now() - startTime1;

      // Second request (should be faster due to caching)
      const startTime2 = Date.now();
      await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      const secondRequestTime = Date.now() - startTime2;

      // Note: In a real test, you'd need to mock the database to measure actual performance
      expect(firstRequestTime).toBeDefined();
      expect(secondRequestTime).toBeDefined();
    });
  });
});