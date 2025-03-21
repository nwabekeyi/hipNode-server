// routes/messageRoute.js
const express = require("express");
const { getMessages } = require("../controllers/messageController");
const router = express.Router();

// Fetch messages between two users
router.get("/messages/:fromUserId/:toUserId", getMessages);

module.exports = router;