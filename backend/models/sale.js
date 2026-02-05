'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Sale extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Define associations
      Sale.belongsTo(models.User, { foreignKey: 'userId' });
      Sale.belongsTo(models.Product, { foreignKey: 'productId' });
      Sale.belongsTo(models.Shift, { foreignKey: 'shiftId' });
      Sale.belongsTo(models.CreditTransaction, { foreignKey: 'creditTransactionId' });
    }
  }
  
  Sale.init({
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Products',
        key: 'id'
      }
    },
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
    quantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0.01
      }
    },
    unitPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    discount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    paymentMethod: {
      type: DataTypes.ENUM('cash', 'mpesa', 'card', 'credit', 'bank_transfer'),
      defaultValue: 'cash'
    },
    paymentReference: {
      type: DataTypes.STRING,
      allowNull: true
    },
    customerName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    customerPhone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    creditTransactionId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'CreditTransactions',
        key: 'id'
      }
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isCompleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Sale',
    tableName: 'sales',
    hooks: {
      beforeCreate: (sale) => {
        // Calculate total amount
        const subtotal = sale.quantity * sale.unitPrice;
        sale.totalAmount = subtotal - (sale.discount || 0);
        
        if (!sale.completedAt && sale.isCompleted) {
          sale.completedAt = new Date();
        }
      },
      beforeUpdate: (sale) => {
        // Recalculate total amount if unitPrice or quantity changed
        if (sale.changed('unitPrice') || sale.changed('quantity')) {
          const subtotal = sale.quantity * sale.unitPrice;
          sale.totalAmount = subtotal - (sale.discount || 0);
        }
        
        if (!sale.completedAt && sale.isCompleted) {
          sale.completedAt = new Date();
        }
      }
    }
  });
  return Sale;
};