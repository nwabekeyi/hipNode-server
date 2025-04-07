const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  toUserId: { type: String, required: true },
  fromUserId: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  action: { type: String, enum: ["like", "comment", "follow"], required: true },
  postId: { type: String, required: false },
  read: { type: Boolean, default: false },
});

module.exports = mongoose.model("Notification", notificationSchema);