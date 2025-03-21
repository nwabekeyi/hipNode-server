const MessageModel = require("../models/Message");

module.exports = (ws, data,onlineUsers) => {
    try {
        if (!data.fromUserId || !data.toUserId || !data.message) {
            console.error("Invalid message format:", data);
            return;
        }

        // Save the message to the database
        const newMessage = new MessageModel({
            fromUserId: data.fromUserId,
            toUserId: data.toUserId,
            message: data.message,
            timestamp: new Date(),
        });

        newMessage.save()
            .then(() => console.log("Message saved successfully"))
            .catch((err) => console.error("Error saving message:", err));

        // If the recipient is online, send them the message in real-time
        const recipientSocket = onlineUsers.get(data.toUserId);
        if (recipientSocket) {
            recipientSocket.send(JSON.stringify({
                type: "message",
                fromUserId: data.fromUserId,
                message: data.message,
                timestamp: new Date(),
            }));
        }
    } catch (error) {
        console.error("Error processing message:", error);
    }
};
