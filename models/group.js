const { DataTypes } = require('sequelize');
const sequelize = require('../util/database');
const User = require('../models/user');

const Group = sequelize.define('Group', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    createdBy: { type: DataTypes.INTEGER, allowNull: false, references: { model: User, key: 'id' } }
});


module.exports = Group;
