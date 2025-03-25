const { DataTypes } = require('sequelize');
const sequelize = require('../util/database');
const User = require('./user');

const Group = sequelize.define('Group', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    createdBy: { type: DataTypes.INTEGER, allowNull: false, references: { model: User, key: 'id' } }
});

const GroupMember = sequelize.define('GroupMember', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false, references: { model: User, key: 'id' } },
    groupId: { type: DataTypes.INTEGER, allowNull: false, references: { model: Group, key: 'id' } }
});

const Message = sequelize.define('Message', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    groupId: { type: DataTypes.INTEGER, allowNull: false, references: { model: Group, key: 'id' } },
    userId: { type: DataTypes.INTEGER, allowNull: false, references: { model: User, key: 'id' } },
    message: { type: DataTypes.TEXT, allowNull: false },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

module.exports = { Group, GroupMember, Message };
