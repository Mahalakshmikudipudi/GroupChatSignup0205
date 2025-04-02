const Group = require("../models/group"); 
const GroupMember = require("../models/groupMember");
const Message = require("../models/groupMessages");
const User = require("../models/user");
const { Op } = require("sequelize");
const sequelize = require("../util/database"); 
const S3Services = require("../service/S3services");
const { v4: uuidv4 } = require('uuid');
const ArchivedChat = require("../models/archivedChats");


const createGroup = async (io, socket, { name }) => {
    try {
        const userId = socket.user.id; // Get user ID from token

        console.log("UserId is:", userId);

        //  Create a new group
        const newGroup = await Group.create({ name, createdBy: userId });

        console.log("New Group is:", newGroup.name);

        //  Add creator to the group & mark as admin
        await GroupMember.create({ groupId: newGroup.id, userId, isAdmin: true });

        //  Emit event to notify all users about the new group
        socket.emit("open-chat", {
            groupId: newGroup.id,
            groupname: newGroup.name,
            message: `You created '${newGroup.name}'`,
        });

        socket.broadcast.emit("new-group", { id: newGroup.id, name: newGroup.name });

        const allGroups = await Group.findAll();
        io.emit("all-groups", allGroups);

    } catch (error) {
        console.error("Error creating group:", error);
        socket.emit("error", "Failed to create group");
    }
};

const getAllGroupsForUser = async (io, socket) => {
    try {
        const userId = socket.user?.id; // Get logged-in user's ID
        if (!userId) return socket.emit("error", "User ID is missing");

        // Fetch groups where the user is either the creator OR a member
        const groups = await Group.findAll({
            where: {
                [Op.or]: [
                    { createdBy: userId },  //  User is the creator
                    { id: { 
                        [Op.in]: sequelize.literal(
                            `(SELECT groupId FROM GroupMembers WHERE userId = '${userId}')`
                        ) 
                    }} //  User is a member
                ]
            }
        });

        // Send the groups back to the frontend
        socket.emit("all-groups", groups);

    } catch (error) {
        console.error("Error fetching groups:", error);
        socket.emit("error", "Failed to fetch groups");
    }
};

async function getGroupMembers(io, socket, { groupId }) {
    try {
        if (!groupId) {
            return socket.emit("error", "Group ID is missing.");
        }

        const members = await GroupMember.findAll({
            where: { groupId },
            include: [{ model: User, attributes: ["id", "name", "email"] }],
        });

        //console.log("Members:", members);

        socket.emit("update-group-members",  { groupId, members });
    } catch (error) {
        console.error("Error fetching group members:", error);
        socket.emit("error", "Failed to fetch group members.");
    }
}


//  Search Users by Name, Email, or Phone
const searchUsers = async (io, socket, { query }) => {
    try {
        const users = await User.findAll({
            where: {
                [Op.or]: [
                    { name: { [Op.like]: `%${query}%` } },
                    { email: { [Op.like]: `%${query}%` } },
                    { phonenumber: { [Op.like]: `%${query}%` } }
                ]
            },
            attributes: ["id", "name", "email", "phonenumber"]
        });

        socket.emit("search-results", users);
    } catch (error) {
        console.error(" Error searching users:", error);
        socket.emit("error", "User search failed");
    }
};

const addUserToGroup = async (io, socket, { groupId, userId }) => {
    try {
        const adminId = socket.user.id;

        //  Check if requester is an admin
        const adminCheck = await GroupMember.findOne({ where: { groupId, userId: adminId, isAdmin: true } });
        if (!adminCheck) return socket.emit("error", "You are not an admin!");

        //  Fetch group & user details
        const group = await Group.findByPk(groupId);
        const user = await User.findByPk(userId);
        const admin = await User.findByPk(adminId);

        if (!group || !user) return socket.emit("error", "Invalid group or user!");

        //  Add user to the group
        await GroupMember.create({ groupId, userId });

        // Fetch the updated list of members
        const updatedMembers = await GroupMember.findAll({
            where: { groupId },
            include: [{ model: User, attributes: ["id", "name"] }],
        });

        //console.log("Updated group members after adding:", updatedMembers);

        // Notify all group members
        io.to(groupId).emit("update-group-members", { groupId, members: updatedMembers });

        // Notify all group members (except the new user)
        socket.to(groupId).emit("user-added", {
            userId,
            message: `${user.name} has joined '${group.name}'`,
        });

        console.log("UserId is:", userId);

        //  Notify the newly added user
        io.to(userId).emit("added-to-group", {
            userId,
            groupId,
            groupname: group.name,
            message: `${admin.name} created '${group.name}'\nYou were added`,
        });

    } catch (error) {
        console.error("Error adding user:", error);
        socket.emit("error", "Failed to add user");
    }
};


//  Promote User to Admin
const makeAdmin = async (io, socket, { groupId, userId }) => {
    try {
        const adminId = socket.user.id;

        //  Check if the requester is an admin
        const adminCheck = await GroupMember.findOne({ where: { groupId, userId: adminId, isAdmin: true } });
        if (!adminCheck) return socket.emit("error", "You are not an admin!");

        //  Update user's admin status
        await GroupMember.update({ isAdmin: true }, { where: { groupId, userId } });

        //  Notify group
        io.to(groupId).emit("admin-promoted", { userId, message: "You are now an admin!" });

    } catch (error) {
        console.error(" Error promoting user:", error);
        socket.emit("error", "Failed to promote user");
    }
};

//  Remove User from Group
const removeUserFromGroup = async (io, socket, { groupId, userId }) => {
    try {
        const adminId = socket.user.id;

        //  Check if the requester is an admin
        const adminCheck = await GroupMember.findOne({ where: { groupId, userId: adminId, isAdmin: true } });
        if (!adminCheck) return socket.emit("error", "You are not an admin!");

        //  Remove user from group
        await GroupMember.destroy({
            where: { groupId, userId }
        });

        // Get updated group members list
        const updatedMembers = await GroupMember.findAll({ 
            where: { groupId }, 
            include: [{ model: User, attributes: ["id", "name"] }] 
        });

        console.log("Updated group members after removing:", updatedMembers);


        // Notify all group members
        io.to(groupId).emit("update-group-members", { groupId, members: updatedMembers });

        //  Notify group
        io.to(groupId).emit("user-removed", { userId, message: "A user was removed from the group." });

    } catch (error) {
        console.error(" Error removing user:", error);
        socket.emit("error", "Failed to remove user");
    }
};

const sendMessage = async (io, socket, { groupId, message, fileType = null }) => {
    try {
        const userId = socket.user.id; // Ensure `socket.user` contains user data

        // Determine message type (text or file)
        const messageType = fileType ? "file" : "text";

        // Store message in DB
        const newMessage = await Message.create({
            message,
            userId,
            groupId,
            messageType,  // Store message type (text/file)
            fileType: fileType || null,  // If it's a file, store file type
        });

        // Fetch user details
        const user = await User.findByPk(userId);

        // Emit message to all users in the group
        io.to(groupId).emit("receive-group-message", {
            id: newMessage.id,
            message: newMessage.message,
            fileType: newMessage.fileType, // Send file type
            messageType: newMessage.messageType, // Send message type
            groupId,
            user: { id: user.id, name: user.name },
            createdAt: newMessage.createdAt.toISOString(), // Convert timestamp to string
        });
    } catch (error) {
        console.error("Error sending group message:", error);
        socket.emit("error", "Failed to send message");
    }
};

const getGroupMessages = async (io, socket, { groupId }) => {
    try {
        // Fetch recent messages from Chat table
        const recentMessages = await Message.findAll({
            where: { groupId },
            include: [{ model: User, attributes: ["id", "name"] }],
            order: [["createdAt", "ASC"]],
            limit: 100 // Fetch the latest 100 messages
        });

        // Fetch old messages from ArchivedChats table if needed
        const oldMessages = await ArchivedChat.findAll({
            where: { groupId },
            include: [{ model: User, attributes: ["id", "name"] }],
            order: [["createdAt", "ASC"]],
            limit: 50 // Fetch only 50 old messages for efficiency
        });

        // Send messages back to the requesting client
        socket.emit("load-group-messages", {
            groupId,
            messages: [...oldMessages, ...recentMessages].map(msg => ({
                id: msg.id,
                message: msg.message,
                fileType: msg.fileType || null,  // If it's a file, store file type
                messageType: msg.messageType || "text",  // Default to text
                fileUrl: msg.fileUrl || null,  // Include file URL if applicable
                fileName: msg.fileName || null,  // Include file name if applicable
                user: { id: msg.user.id, name: msg.user.name },
                createdAt: msg.createdAt.toISOString(), // Convert timestamp to string
            })),
        });

    } catch (error) {
        console.error("Error fetching messages:", error);
        socket.emit("error", "Failed to load messages");
    }
};


const handleFileUpload = async (io, socket, data) => {
    try {
        const { fileData, fileName, fileType, groupId, senderId } = data;
        const fileBuffer = Buffer.from(fileData.split(',')[1], 'base64'); // Convert base64 to buffer
        const fileKey = `uploads/${uuidv4()}-${fileName}`;

        // Upload file to S3 (or any cloud storage)
        const fileUrl = await S3Services.uploadToS3(fileBuffer, fileKey, fileType);

        // Store file message in database
        const message = await Message.create({
            groupId,
            userId: senderId,
            message: fileUrl,  // Save the file URL
            fileUrl,
            fileType,
            fileName,
            messageType: "file",
        });

        // Fetch sender details
        const user = await User.findByPk(senderId);

        // Emit file message to group
        io.to(groupId).emit("receive-group-message", {
            id: message.id,
            message: message.fileUrl,
            fileUrl: message.fileUrl,
            fileType: message.fileType,
            fileName: message.fileName,
            messageType: message.messageType, // Send message type as "file"
            user: { id: user.id, name: user.name },
            createdAt: message.createdAt.toISOString(), // Convert timestamp to string
        });

        console.log("File uploaded successfully:", fileUrl);
    } catch (error) {
        console.error("File upload error:", error);
        socket.emit("upload-error", { message: "File upload failed" });
    }
};


module.exports = { createGroup, searchUsers, 
    addUserToGroup, makeAdmin, removeUserFromGroup, getAllGroupsForUser,
     getGroupMembers, sendMessage, getGroupMessages, handleFileUpload };












