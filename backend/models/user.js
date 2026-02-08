// User model for direct SQL queries
// This file provides a simplified interface for user operations
// using the existing database schema with direct SQL queries

const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  /**
   * Find user by ID
   */
  static async findById(userId) {
    try {
      const result = await db.query(
        `SELECT user_id, username, email, password_hash, role, two_fa_enabled, 
                two_fa_secret, last_login, is_active, created_at
         FROM users WHERE user_id = $1 AND is_active = true`,
        [userId]
      );
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find user by username or email
   */
  static async findByUsernameOrEmail(identifier) {
    try {
      const result = await db.query(
        `SELECT user_id, username, email, password_hash, role, two_fa_enabled, 
                two_fa_secret, last_login, is_active, created_at
         FROM users WHERE (username = $1 OR email = $1) AND is_active = true`,
        [identifier]
      );
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find user by username
   */
  static async findByUsername(username) {
    try {
      const result = await db.query(
        `SELECT user_id, username, email, password_hash, role, two_fa_enabled, 
                two_fa_secret, last_login, is_active, created_at
         FROM users WHERE username = $1 AND is_active = true`,
        [username]
      );
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find user by email
   */
  static async findByEmail(email) {
    try {
      const result = await db.query(
        `SELECT user_id, username, email, password_hash, role, two_fa_enabled, 
                two_fa_secret, last_login, is_active, created_at
         FROM users WHERE email = $1 AND is_active = true`,
        [email]
      );
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create a new user
   */
  static async create(userData) {
    try {
      const { username, email, password, role = 'bookkeeper' } = userData;
      
      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      const result = await db.query(
        `INSERT INTO users (username, email, password_hash, role, two_fa_enabled, created_at)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
         RETURNING user_id, username, email, role, is_active, created_at`,
        [username, email, passwordHash, role, false]
      );

      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update user
   */
  static async update(userId, updateData) {
    try {
      const fields = [];
      const values = [];
      let paramCount = 1;

      Object.keys(updateData).forEach(key => {
        fields.push(`${key} = $${paramCount}`);
        values.push(updateData[key]);
        paramCount++;
      });

      if (fields.length === 0) {
        throw new Error('No fields to update');
      }

      fields.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(userId);

      const query = `
        UPDATE users 
        SET ${fields.join(', ')}
        WHERE user_id = $${paramCount}
        RETURNING user_id, username, email, role, is_active, updated_at
      `;

      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update last login
   */
  static async updateLastLogin(userId) {
    try {
      await db.query(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1',
        [userId]
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   * Enable 2FA
   */
  static async enable2FA(userId, secret) {
    try {
      await db.query(
        'UPDATE users SET two_fa_enabled = true, two_fa_secret = $1 WHERE user_id = $2',
        [secret, userId]
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   * Disable 2FA
   */
  static async disable2FA(userId) {
    try {
      await db.query(
        'UPDATE users SET two_fa_enabled = false, two_fa_secret = NULL, backup_codes = NULL WHERE user_id = $1',
        [userId]
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update backup codes
   */
  static async updateBackupCodes(userId, backupCodes) {
    try {
      await db.query(
        'UPDATE users SET backup_codes = $1 WHERE user_id = $2',
        [JSON.stringify(backupCodes), userId]
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update password
   */
  static async updatePassword(userId, newPassword) {
    try {
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(newPassword, saltRounds);

      await db.query(
        'UPDATE users SET password_hash = $1 WHERE user_id = $2',
        [passwordHash, userId]
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if username exists
   */
  static async usernameExists(username) {
    try {
      const result = await db.query(
        'SELECT COUNT(*) as count FROM users WHERE username = $1',
        [username]
      );
      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if email exists
   */
  static async emailExists(email) {
    try {
      const result = await db.query(
        'SELECT COUNT(*) as count FROM users WHERE email = $1',
        [email]
      );
      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all users
   */
  static async getAll() {
    try {
      const result = await db.query(
        `SELECT user_id, username, email, role, two_fa_enabled, 
                last_login, is_active, created_at
         FROM users WHERE is_active = true
         ORDER BY created_at DESC`
      );
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Deactivate user (soft delete)
   */
  static async deactivate(userId) {
    try {
      await db.query(
        'UPDATE users SET is_active = false WHERE user_id = $1',
        [userId]
      );
    } catch (error) {
      throw error;
    }
  }
}

module.exports = User;
