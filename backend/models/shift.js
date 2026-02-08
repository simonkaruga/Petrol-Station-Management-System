'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Shift extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Define associations
      Shift.belongsTo(models.User, { foreignKey: 'userId' });
      Shift.hasMany(models.Sale, { foreignKey: 'shiftId' });
      Shift.hasMany(models.Expense, { foreignKey: 'shiftId' });
    }
  }
  
  Shift.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    attendantName: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // Fuel meter readings
    petrolOpening: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    petrolClosing: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    dieselOpening: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    dieselClosing: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    keroseneOpening: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    keroseneClosing: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    // Fuel payments
    fuelCashCollected: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    fuelMpesaCollected: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    // Car wash
    carWashesCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    carWashCash: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    // Parking
    parkingFeesCollected: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    // Gas cylinders
    gas6kgSold: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    gas13kgSold: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    gasCashCollected: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    gasMpesaCollected: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    openingCash: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    closingCash: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    expectedCash: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    cashDifference: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('active', 'closed', 'cancelled'),
      defaultValue: 'active'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    totalSales: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    totalExpenses: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    }
  }, {
    sequelize,
    modelName: 'Shift',
    tableName: 'shifts',
    hooks: {
      beforeCreate: (shift) => {
        if (!shift.startTime) {
          shift.startTime = new Date();
        }
      }
    }
  });
  return Shift;
};