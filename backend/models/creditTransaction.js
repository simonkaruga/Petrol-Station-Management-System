'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CreditTransaction extends Model {
    static associate(models) {
      CreditTransaction.belongsTo(models.CreditCustomer, { foreignKey: 'customerId' });
      CreditTransaction.belongsTo(models.User, { foreignKey: 'recordedBy', as: 'recorder' });
    }
  }
  
  CreditTransaction.init({
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'credit_customers',
        key: 'id'
      }
    },
    transactionType: {
      type: DataTypes.ENUM('credit_sale', 'payment'),
      allowNull: false
    },
    fuelType: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    liters: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    paymentMethod: {
      type: DataTypes.ENUM('cash', 'mpesa'),
      allowNull: true
    },
    transactionDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    recordedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'CreditTransaction',
    tableName: 'credit_transactions'
  });
  
  return CreditTransaction;
};