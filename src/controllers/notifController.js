const Post = require("../models/postSchema");
const Notification = require("../models/notifSchema"); // Ensure this matches your file
const { onlineUsers } = require("../utils/websocketUtils");

// Send notification to a specific user
const sendNotification = (toUserId, notification) => {
  const recipientWs = onlineUsers.get(toUserId);
  if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
    recipientWs.send(JSON.stringify(notification));
    console.log(`Notification sent to ${toUserId}:`, notification);
  } else {
    console.log(`User ${toUserId} is offline, notification stored in DB.`);
  }
};

// Centralized function to create and send notifications
const createAndSendNotification = async ({ toUserId, fromUserId, message, action, postId }) => {
  try {
    const notification = new Notification({
      toUserId,
      fromUserId,
      message,
      action,
      postId: postId || undefined, // Optional field
    });
    await notification.save();
    sendNotification(toUserId, notification);
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error; // Let the caller handle the error
  }
};

// Like a post
const likePost = async (req, res) => {
  const { postId } = req.params;
  const { userId } = req.body;

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const postOwnerId = post.posterId.toString();

    if (!post.likes.includes(userId)) {
      post.likes.push(userId);
      await post.save();
    }

    const notification = await createAndSendNotification({
      toUserId: postOwnerId,
      fromUserId: userId,
      message: `User ${userId} liked your post.`,
      action: "like",
      postId,
    });

    res.json({ success: true, notification });
  } catch (error) {
    console.error("Error handling like:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Comment on a post
const commentOnPost = async (req, res) => {
  const { postId } = req.params;
  const { userId, content } = req.body;

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const postOwnerId = post.posterId.toString();

    post.comments.push({ userId, text: content });
    await post.save();

    const notification = await createAndSendNotification({
      toUserId: postOwnerId,
      fromUserId: userId,
      message: `User ${userId} commented on your post: "${content.slice(0, 20)}..."`,
      action: "comment",
      postId,
    });

    res.json({ success: true, notification });
  } catch (error) {
    console.error("Error handling comment:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Fetch notifications for a user
const getNotifications = async (req, res) => {
  const { userId } = req.params;
  try {
    const userNotifications = await Notification.find({ toUserId: userId }).sort({ timestamp: -1 });
    res.json(userNotifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { likePost, commentOnPost, getNotifications, createAndSendNotification };