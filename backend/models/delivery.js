'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Delivery extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Define associations
      Delivery.belongsTo(models.Product, { foreignKey: 'productId' });
      Delivery.belongsTo(models.User, { foreignKey: 'receivedById' });
    }
  }
  
  Delivery.init({
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
      validate: {
        min: 0.01
      }
    },
    costPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    supplier: {
      type: DataTypes.STRING,
      allowNull: false
    },
    deliveryDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    receivedById: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    invoiceNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    vehicleRegistration: {
      type: DataTypes.STRING,
      allowNull: true
    },
    driverName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'received', 'cancelled'),
      defaultValue: 'pending'
    }
  }, {
    sequelize,
    modelName: 'Delivery',
    tableName: 'deliveries'
  });
  return Delivery;
};