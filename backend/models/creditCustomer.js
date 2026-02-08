'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CreditCustomer extends Model {
    static associate(models) {
      CreditCustomer.hasMany(models.CreditTransaction, { foreignKey: 'customerId' });
    }
  }
  
  CreditCustomer.init({
    customerName: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    phoneNumber: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    vehicleRegistration: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    totalDebt: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    creditLimit: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'CreditCustomer',
    tableName: 'credit_customers'
  });
  
  return CreditCustomer;
};
