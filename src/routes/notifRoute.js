const express = require("express");
const router = express.Router();
const {
  likePost,
  commentOnPost,
  getNotifications,
} = require("../controllers/notifController");

// Notification routes
router.post("/posts/:postId/like", likePost);
router.post("/posts/:postId/comment", commentOnPost);
router.get("/notifications/:userId", getNotifications);

module.exports = router;