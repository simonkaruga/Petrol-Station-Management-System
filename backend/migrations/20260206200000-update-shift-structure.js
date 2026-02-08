'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('shifts', 'attendantName', {
      type: Sequelize.STRING(100),
      allowNull: true
    });

    // Fuel meter readings
    await queryInterface.addColumn('shifts', 'petrolOpening', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true
    });
    await queryInterface.addColumn('shifts', 'petrolClosing', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true
    });
    await queryInterface.addColumn('shifts', 'dieselOpening', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true
    });
    await queryInterface.addColumn('shifts', 'dieselClosing', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true
    });
    await queryInterface.addColumn('shifts', 'keroseneOpening', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true
    });
    await queryInterface.addColumn('shifts', 'keroseneClosing', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true
    });

    // Fuel payments
    await queryInterface.addColumn('shifts', 'fuelCashCollected', {
      type: Sequelize.DECIMAL(10, 2),
      defaultValue: 0
    });
    await queryInterface.addColumn('shifts', 'fuelMpesaCollected', {
      type: Sequelize.DECIMAL(10, 2),
      defaultValue: 0
    });

    // Car wash
    await queryInterface.addColumn('shifts', 'carWashesCount', {
      type: Sequelize.INTEGER,
      defaultValue: 0
    });
    await queryInterface.addColumn('shifts', 'carWashCash', {
      type: Sequelize.DECIMAL(10, 2),
      defaultValue: 0
    });

    // Parking
    await queryInterface.addColumn('shifts', 'parkingFeesCollected', {
      type: Sequelize.DECIMAL(10, 2),
      defaultValue: 0
    });

    // Gas cylinders
    await queryInterface.addColumn('shifts', 'gas6kgSold', {
      type: Sequelize.INTEGER,
      defaultValue: 0
    });
    await queryInterface.addColumn('shifts', 'gas13kgSold', {
      type: Sequelize.INTEGER,
      defaultValue: 0
    });
    await queryInterface.addColumn('shifts', 'gasCashCollected', {
      type: Sequelize.DECIMAL(10, 2),
      defaultValue: 0
    });
    await queryInterface.addColumn('shifts', 'gasMpesaCollected', {
      type: Sequelize.DECIMAL(10, 2),
      defaultValue: 0
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('shifts', 'attendantName');
    await queryInterface.removeColumn('shifts', 'petrolOpening');
    await queryInterface.removeColumn('shifts', 'petrolClosing');
    await queryInterface.removeColumn('shifts', 'dieselOpening');
    await queryInterface.removeColumn('shifts', 'dieselClosing');
    await queryInterface.removeColumn('shifts', 'keroseneOpening');
    await queryInterface.removeColumn('shifts', 'keroseneClosing');
    await queryInterface.removeColumn('shifts', 'fuelCashCollected');
    await queryInterface.removeColumn('shifts', 'fuelMpesaCollected');
    await queryInterface.removeColumn('shifts', 'carWashesCount');
    await queryInterface.removeColumn('shifts', 'carWashCash');
    await queryInterface.removeColumn('shifts', 'parkingFeesCollected');
    await queryInterface.removeColumn('shifts', 'gas6kgSold');
    await queryInterface.removeColumn('shifts', 'gas13kgSold');
    await queryInterface.removeColumn('shifts', 'gasCashCollected');
    await queryInterface.removeColumn('shifts', 'gasMpesaCollected');
  }
};
