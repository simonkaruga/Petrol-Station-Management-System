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
    startTime: {
      type: DataTypes.DATE,
      allowNull: false
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true
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