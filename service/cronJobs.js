const cron = require("node-cron");
const { Op } = require("sequelize");
const Chat = require("../models/groupMessages");
const ArchivedChat = require("../models/archivedChats");

// Run every night at 2 AM (Server time)
cron.schedule("0 2 * * *", async () => {
    try {
        console.log("Running chat archiving job...");

        // Get messages older than 1 day
        const oldMessages = await Message.findAll({
            where: { createdAt: { [Op.lt]: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
        });

        if (oldMessages.length === 0) {
            console.log("No messages to archive.");
            return;
        }

        // Move old messages to ArchivedChats
        await ArchivedChat.bulkCreate(oldMessages.map(msg => msg.toJSON()));

        // Delete old messages from Chat table
        await Message.destroy({
            where: { createdAt: { [Op.lt]: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
        });

        console.log(`Archived ${oldMessages.length} messages and cleared old chats.`);

    } catch (error) {
        console.error("Error archiving chats:", error);
    }
});
