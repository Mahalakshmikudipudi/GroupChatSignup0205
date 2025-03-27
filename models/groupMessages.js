const { DataTypes } = require("sequelize");
const sequelize = require("../util/database");
const User = require("../models/user");
const Group = require("../models/group");

const Message = sequelize.define("Message", {
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
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
});



module.exports = Message;
