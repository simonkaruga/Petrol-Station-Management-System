const request = require('supertest');
const express = require('express');
const { User } = require('../models');

// Create test app
const app = express();
app.use(express.json());

// Simple test to verify the system works
describe('Authentication System Basic Test', () => {
  it('should be able to import User model', () => {
    expect(User).toBeDefined();
    expect(typeof User.findById).toBe('function');
    expect(typeof User.findByUsername).toBe('function');
    expect(typeof User.findByEmail).toBe('function');
  });

  it('should be able to import auth routes', () => {
    const authRoutes = require('../routes/auth');
    expect(authRoutes).toBeDefined();
  });

  it('should be able to import auth service', () => {
    const AuthService = require('../services/authService');
    expect(AuthService).toBeDefined();
    expect(typeof AuthService.register).toBe('function');
    expect(typeof AuthService.login).toBe('function');
  });

  it('should be able to import middleware', () => {
    const { authenticate } = require('../middleware/auth');
    expect(authenticate).toBeDefined();
    expect(typeof authenticate).toBe('function');
  });
});