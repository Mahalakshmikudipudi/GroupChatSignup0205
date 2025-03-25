const express = require('express');
const router = express.Router();
const groupController = require('../controller/group');
const authMiddleware = require('../middleware/auth'); // Token verification middleware

// Create a group
router.post('/create', authMiddleware.authenticate, groupController.createGroup);

// Invite a user to a group
router.post('/invite', authMiddleware.authenticate, groupController.inviteUser);

// Fetch user's groups
router.get('/mygroups', authMiddleware.authenticate, groupController.getUserGroups);

// Send a message to a group
router.post('/send', authMiddleware.authenticate, groupController.sendMessage);

// Fetch messages for a group
router.get('/messages/:groupId', authMiddleware.authenticate, groupController.getGroupMessages);

module.exports = router;
