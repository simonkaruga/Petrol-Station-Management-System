'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Inventory extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Define associations
      Inventory.belongsTo(models.Product, { foreignKey: 'productId' });
      Inventory.belongsTo(models.User, { foreignKey: 'updatedById' });
    }
  }
  
  Inventory.init({
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Products',
        key: 'id'
      }
    },
    quantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    costPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: 0
      }
    },
    sellingPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    minLevel: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    maxLevel: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 999999
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true
    },
    batchNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    expiryDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    updatedById: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    lastUpdated: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'Inventory',
    tableName: 'inventory',
    hooks: {
      beforeCreate: (inventory) => {
        inventory.lastUpdated = new Date();
      },
      beforeUpdate: (inventory) => {
        inventory.lastUpdated = new Date();
      }
    }
  });
  return Inventory;
};