'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Expense extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Define associations
      Expense.belongsTo(models.User, { foreignKey: 'userId' });
      Expense.belongsTo(models.Shift, { foreignKey: 'shiftId' });
    }
  }
  
  Expense.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    shiftId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Shifts',
        key: 'id'
      }
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0.01
      }
    },
    category: {
      type: DataTypes.ENUM('utilities', 'maintenance', 'supplies', 'wages', 'rent', 'other'),
      defaultValue: 'other'
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false
    },
    expenseDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    paymentMethod: {
      type: DataTypes.ENUM('cash', 'mpesa', 'card', 'bank_transfer'),
      defaultValue: 'cash'
    },
    receiptNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    approvedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    isApproved: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'Expense',
    tableName: 'expenses'
  });
  return Expense;
};