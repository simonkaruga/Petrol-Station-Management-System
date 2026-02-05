'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PriceHistory extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Define associations
      PriceHistory.belongsTo(models.Product, { foreignKey: 'productId' });
      PriceHistory.belongsTo(models.User, { foreignKey: 'changedById' });
    }
  }
  
  PriceHistory.init({
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Products',
        key: 'id'
      }
    },
    oldPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    newPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    changedById: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    changeDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    reason: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'PriceHistory',
    tableName: 'price_history'
  });
  return PriceHistory;
};