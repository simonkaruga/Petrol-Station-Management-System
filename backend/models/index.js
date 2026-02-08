'use strict';

const Sequelize = require('sequelize');
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
const db = {};

let sequelize = new Sequelize(config.database, config.username, config.password, config);

// User model uses raw SQL
db.User = require('./user');

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;