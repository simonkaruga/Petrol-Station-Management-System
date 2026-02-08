'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('system_backups', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      backupFilename: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      backupDate: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      backupSizeMb: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('success', 'failed'),
        defaultValue: 'success'
      },
      errorMessage: {
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

    await queryInterface.addIndex('system_backups', ['backupDate']);
    await queryInterface.addIndex('system_backups', ['status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('system_backups');
  }
};
