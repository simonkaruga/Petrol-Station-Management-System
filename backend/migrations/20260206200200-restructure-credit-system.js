'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('credit_customers', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      customerName: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      phoneNumber: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      vehicleRegistration: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      totalDebt: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0
      },
      creditLimit: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Rename old credit_transactions table
    await queryInterface.renameTable('credit_transactions', 'credit_transactions_old');

    // Create new credit_transactions table
    await queryInterface.createTable('credit_transactions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      customerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'credit_customers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      transactionType: {
        type: Sequelize.ENUM('credit_sale', 'payment'),
        allowNull: false
      },
      fuelType: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      liters: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      paymentMethod: {
        type: Sequelize.ENUM('cash', 'mpesa'),
        allowNull: true
      },
      transactionDate: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      recordedBy: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    await queryInterface.addIndex('credit_transactions', ['customerId']);
    await queryInterface.addIndex('credit_transactions', ['transactionType']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('credit_transactions');
    await queryInterface.renameTable('credit_transactions_old', 'credit_transactions');
    await queryInterface.dropTable('credit_customers');
  }
};
