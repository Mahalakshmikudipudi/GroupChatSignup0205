const Chat = require('../models/chatapp');
const sequelize = require('../util/database');
const User = require('../models/user');

const getMessages = async (req, res) => {
    try {
        const chats = await Chat.findAll({ include: User, order: [['createdAt', 'ASC']] });
        res.status(200).json({ success: true, chats });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
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
