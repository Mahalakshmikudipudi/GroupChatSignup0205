const { DataTypes } = require("sequelize");
const sequelize = require("../util/database");
const User = require("../models/user");
const Group = require("../models/group");
const GroupMember = require("../models/groupMember");

const ArchivedChat = sequelize.define("ArchivedChat", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: User, key: "id" },
        onDelete: "CASCADE",
    },
    groupId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: Group, key: "id" },
        onDelete: "CASCADE",
    },
    fileUrl: {
        type: DataTypes.STRING,
        allowNull: true // Can be null for text messages
    },
    fileType: {
        type: DataTypes.STRING,
        allowNull: true
    },
    fileName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    messageType: {
        type: DataTypes.ENUM("text", "file"),
        allowNull: false,
        defaultValue: "text"
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
});

module.exports = ArchivedChat;
