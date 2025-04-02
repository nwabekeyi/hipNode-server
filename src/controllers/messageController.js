// controllers/messageController.js
const Message = require("../models/Message");

// Fetch messages between two users
const getMessages = async (req, res) => {
  try {
    const { fromUserId, toUserId } = req.params;

    const messages = await Message.find({
      $or: [
        { fromUserId, toUserId }, // Messages sent by fromUserId to toUserId
        { fromUserId: toUserId, toUserId: fromUserId }, // Messages sent by toUserId to fromUserId
      ],
    }).sort({ timestamp: 1 }); // Sort by timestamp in ascending order

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { getMessages };