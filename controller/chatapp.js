const Chat = require('../models/chatapp');
const sequelize = require('../util/database');
const User = require('../models/user');
const { Op } = require('sequelize'); // Import Op for comparisons


const getMessages = async (req, res) => {
    try {
        const lastMessageId = req.query.lastMessageId || 0;

        const chats = await Chat.findAll({
            where: { id: { [Op.gt]: lastMessageId } }, // Fetch messages after lastMessageId
            include: [{ model: User, attributes: ['name'] }],
            order: [['id', 'ASC']]
        });

        res.json({ success: true, chats });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const addMessages = async (req, res) => {
    try {
        const { message } = req.body;
        const userId = req.user.id;  // Extract user ID from token

        if (!message) {
            return res.status(400).json({ error: 'Message cannot be empty' });
        }

        const chat = await Chat.create({ userId, message });

        res.status(201).json({ success: true, chat });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


module.exports = {
    getMessages,
    addMessages
};
