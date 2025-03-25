const { Group, GroupMember, Message } = require('../models/group');
const User = require('../models/user');
const { Op } = require('sequelize');

// Create a new group
const createGroup = async (req, res) => {
    try {
        const { name } = req.body;
        const createdBy = req.user.id;

        if (!name) {
            return res.status(400).json({ error: "Group name is required" });
        }

        const group = await Group.create({ name, createdBy });

        // Automatically add the creator as a member
        await GroupMember.create({ userId: createdBy, groupId: group.id });

        res.status(201).json({ success: true, message: "Group created successfully", group });
    } catch (error) {
        console.error("Error creating group:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Invite a user to a group
const inviteUser = async (req, res) => {
    try {
        const { groupId, userId } = req.body;

        // Check if the user is already in the group
        const existingMember = await GroupMember.findOne({ where: { groupId, userId } });
        if (existingMember) {
            return res.status(400).json({ error: "User is already in the group" });
        }

        await GroupMember.create({ groupId, userId });
        res.status(200).json({ success: true, message: "User invited successfully" });
    } catch (error) {
        console.error("Error inviting user:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Fetch groups for a user
const getUserGroups = async (req, res) => {
    try {
        const userId = req.user.id;

        const groups = await Group.findAll({
            include: [{ model: User, through: { where: { userId } } }]
        });

        res.status(200).json({ success: true, groups });
    } catch (error) {
        console.error("Error fetching user groups:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Send a message in a group
const sendMessage = async (req, res) => {
    try {
        const { groupId, message } = req.body;
        const userId = req.user.id;

        // Check if the user is part of the group
        const isMember = await GroupMember.findOne({ where: { groupId, userId } });
        if (!isMember) {
            return res.status(403).json({ error: "You are not a member of this group" });
        }

        const chatMessage = await Message.create({ groupId, userId, message });

        res.status(201).json({ success: true, chatMessage });
    } catch (error) {
        console.error("Error sending message:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Fetch messages for a group
const getGroupMessages = async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user.id;

        // Check if the user is part of the group
        const isMember = await GroupMember.findOne({ where: { groupId, userId } });
        if (!isMember) {
            return res.status(403).json({ error: "You are not a member of this group" });
        }

        const messages = await Message.findAll({
            where: { groupId },
            include: [{ model: User, attributes: ['name'] }],
            order: [['createdAt', 'ASC']],
            limit: 50 // Load only the last 50 messages
        });

        res.status(200).json({ success: true, messages });
    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = {
    createGroup,
    inviteUser,
    getUserGroups,
    sendMessage,
    getGroupMessages
}