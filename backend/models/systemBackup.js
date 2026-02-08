'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SystemBackup extends Model {
    static associate(models) {
      // No associations needed
    }
  }
  
  SystemBackup.init({
    backupFilename: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    backupDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    backupSizeMb: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('success', 'failed'),
      defaultValue: 'success'
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'SystemBackup',
    tableName: 'system_backups'
  });
  
  return SystemBackup;
};
