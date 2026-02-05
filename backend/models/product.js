'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Define associations
      Product.hasMany(models.Inventory, { foreignKey: 'productId' });
      Product.hasMany(models.Sale, { foreignKey: 'productId' });
      Product.hasMany(models.Delivery, { foreignKey: 'productId' });
      Product.hasMany(models.PriceHistory, { foreignKey: 'productId' });
    }
  }
  
  Product.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    category: {
      type: DataTypes.ENUM('fuel', 'lubricant', 'accessory', 'service'),
      defaultValue: 'fuel'
    },
    unit: {
      type: DataTypes.ENUM('liters', 'gallons', 'units', 'hours'),
      defaultValue: 'liters'
    },
    sku: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true
    },
    reorderLevel: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    taxRate: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0.16 // 16% VAT default
    },
    supplier: {
      type: DataTypes.STRING,
      allowNull: true
    },
    minStockLevel: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    maxStockLevel: {
      type: DataTypes.INTEGER,
      defaultValue: 999999
    }
  }, {
    sequelize,
    modelName: 'Product',
    tableName: 'products'
  });
  return Product;
};