const express = require('express');
const router = express.Router();
const groupController = require('../controller/group');
const authMiddleware = require('../middleware/auth'); // Token verification middleware

// Create a group
router.post('/creategroup', authMiddleware.authenticate, groupController.createGroup);

router.get('/allgroups', authMiddleware.authenticate, groupController.getGroups);

// Invite a user to a group
router.post('/inviteUser', authMiddleware.authenticate, groupController.inviteUser);


// Send a message to a group
router.post('/sendMessage', authMiddleware.authenticate, groupController.sendMessage);

// Fetch messages for a group
router.get('/getMessages', authMiddleware.authenticate, groupController.getGroupMessages);

// Get all members of a group
router.get("/members", authMiddleware.authenticate, groupController.getGroupMembers);

// Add a user to a group
router.get("/search", authMiddleware.authenticate, groupController.searchUsers);

// Make a user an admin in the group
router.post("/makeAdmin", authMiddleware.authenticate, groupController.makeAdmin);

// Add a user to a group
router.post("/addUser", authMiddleware.authenticate, groupController.addUserToGroup);

// Remove a user from a group
router.delete("/removeUser", authMiddleware.authenticate, groupController.removeUserFromGroup);


module.exports = router;
