'use strict';
const {
  Model
} = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Define associations
      User.hasMany(models.Shift, { foreignKey: 'userId' });
      User.hasMany(models.Sale, { foreignKey: 'userId' });
      User.hasMany(models.Expense, { foreignKey: 'userId' });
      User.hasMany(models.Delivery, { foreignKey: 'receivedById' });
      User.hasMany(models.CreditTransaction, { foreignKey: 'userId' });
    }

    // Instance method to check password
    async isValidPassword(password) {
      return await bcrypt.compare(password, this.password);
    }

    // Instance method to generate JWT
    generateAuthToken() {
      const jwt = require('jsonwebtoken');
      return jwt.sign(
        { 
          id: this.id, 
          username: this.username, 
          role: this.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );
    }
  }
  
  User.init({
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [3, 50]
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [6, 100]
      }
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('admin', 'manager', 'attendant', 'accountant'),
      defaultValue: 'attendant'
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    lastLogin: {
      type: DataTypes.DATE
    },
    twoFactorSecret: {
      type: DataTypes.STRING,
      allowNull: true
    },
    isTwoFactorEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'User',
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      }
    }
  });
  return User;
};