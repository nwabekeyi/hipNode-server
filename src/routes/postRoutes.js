const express = require("express");
const router = express.Router();
const Post = require("../models/postSchema");
const {authenticateUser} = require("../middlewares/authMiddleware");
const multerUpload = require("../middlewares/multer");
const {
    getAllPosts, 
    getPostByUserId, 
    createPost, 
    updaatePost, 
    deletePost, 
    getPostById,
} = require("../controllers/postController");

// Get all posts
router.get("/", authenticateUser, getAllPosts);

// Get posts by user ID (returns an array of user's posts)
router.get("/:userId", authenticateUser, getPostByUserId);

// Create a new post (with image upload and authentication)
router.post("/create", multerUpload.single("image"), createPost, authenticateUser,);

// Update a post (edit post details)
router.put("/:postId", multerUpload.single("image"), updaatePost, authenticateUser,);

// Delete a post
router.delete("/:postId", deletePost, authenticateUser,);

// Get a single post by ID
router.get("/:id", getPostById, authenticateUser,);

module.exports = router;
