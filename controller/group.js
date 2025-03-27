const Group = require('../models/group');
const GroupMember = require('../models/groupMember');
const Message = require('../models/groupMessages')
const User = require('../models/user');
const { Op } = require("sequelize");

// Create a new group
const createGroup = async (req, res) => {
    try {
        const { name } = req.body;
        const createdBy = req.user.id;


        if (!name) {
            return res.status(400).json({ error: "Group name is required" });
        }

        const existingGroup = await Group.findOne({
            where: { name, createdBy }
        });

        if (existingGroup) {
            return res.status(400).json({ error: "Group already exists!" });
        }

        const group = await Group.create({ name, createdBy });

        console.log("Group id is:", group.id);

        // Automatically add the creator as a member
        await GroupMember.create({ userId: createdBy, groupId: group.id });

        res.status(201).json({ success: true, message: "Group created successfully", group });
    } catch (error) {
        console.error("Error creating group:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

const getGroups = async(req, res) => {
    try {
        const userId = req.user.id;
        //console.log("User id is: ", userId);

        const groups = await Group.findAll({
            include: {
                model: GroupMember,
                where: { userId: userId },
                attributes: []
            },
            attributes: ['id', 'name']
        });


        
        //console.log("Fetched Groups:", JSON.stringify(groups, null, 2));

        res.status(200).json({ success: true, groups });
    } catch (error) {
        console.error('Error fetching groups:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Invite a user to a group
const inviteUser = async (req, res) => {
    try {
        const { groupId, userId } = req.body;

        //console.log("Group and User IDS", groupId, userId);
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

const addUserToGroup = async (req, res) => {
    try {
        const { groupId, userId } = req.body;
        const adminId = req.user.id;

        // Check if requester is an admin
        const admin = await GroupMember.findOne({ where: { groupId, userId: adminId, isAdmin: true } });
        if (!admin) return res.status(403).json({ error: "Only admins can add users" });

        // Add user to the group
        await GroupMember.create({ groupId, userId, isAdmin: false });

        res.status(201).json({ success: true, message: "User added" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

const makeAdmin = async (req, res) => {
    try {
        const { groupId, userId } = req.body;
        const adminId = req.user.id;

        const admin = await GroupMember.findOne({ where: { groupId, userId: adminId, isAdmin: true } });
        if (!admin) return res.status(403).json({ error: "Only admins can promote members" });

        await GroupMember.update({ isAdmin: true }, { where: { groupId, userId } });

        res.status(200).json({ success: true, message: "User promoted to admin" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

const getGroupMembers = async (req, res) => {
    try {
        const { groupId } = req.query;
        const userId = req.user.id; // Extracted from authentication middleware

        // Check if the group exists
        const group = await Group.findByPk(groupId);
        if (!group) {
            return res.status(404).json({ error: "Group not found" });
        }

        // Check if the requesting user is an admin of this group
        const requestingUser = await GroupMember.findOne({
            where: { groupId, userId, isAdmin: true }
        });

        const isAdmin = !!requestingUser; // Convert to boolean

        // Fetch all group members with their admin status
        const members = await GroupMember.findAll({
            where: { groupId },
            include: [{ model: User, attributes: ["id", "name", "email"] }]
        });

        // Format response
        const formattedMembers = members.map(member => ({
            id: member.user.id,
            name: member.user.name,
            email: member.user.email,
            isAdmin: member.isAdmin
        }));

        res.status(200).json({ success: true, members: formattedMembers, isAdmin });

    } catch (error) {
        console.error("Error fetching group members:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

const searchUsers = async (req, res) => {
    try {
        const { query } = req.query;

        if (!query) {
            return res.status(400).json({ error: "Search query is required" });
        }

        // Find users matching the query
        const users = await User.findAll({
            where: {
                [Op.or]: [
                    { name: { [Op.like]: `%${query}%` } },
                    { email: { [Op.like]: `%${query}%` } },
                    { phone: { [Op.like]: `%${query}%` } }
                ]
            },
            attributes: ["id", "name", "email", "phone"] // Return necessary fields
        });

        res.status(200).json({ success: true, users });
    } catch (error) {
        console.error("Error searching users:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};


const removeUserFromGroup = async (req, res) => {
    try {
        const { groupId, userId } = req.body;
        const adminId = req.user.id;

        const admin = await GroupMember.findOne({ where: { groupId, userId: adminId, isAdmin: true } });
        if (!admin) return res.status(403).json({ error: "Only admins can remove users" });

        await GroupMember.destroy({ where: { groupId, userId } });

        res.status(200).json({ success: true, message: "User removed" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};



// Send a message in a group
const sendMessage = async (req, res) => {
    try {
        const { groupId, message } = req.body;
        const userId = req.user.id;

        // console.log("GroupId is:", groupId);
        // console.log("Message is:", message);
        // console.log("UserId is:", userId);

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
        const { groupId }  = req.query;

        console.log("Group ID is:", groupId);
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
    getGroups,
    inviteUser,
    addUserToGroup,
    searchUsers,
    makeAdmin,
    removeUserFromGroup,
    sendMessage,
    getGroupMessages
}