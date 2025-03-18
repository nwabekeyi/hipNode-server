const express = require("express");
const router = express.Router();
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");
const Post = require("../models/postSchema");
const authMiddleware = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware"); // For handling image uploads

// Configure Multer to use Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "hipnode_posts",
    allowed_formats: ["jpg", "png", "jpeg"],
  },
});

const multerUpload = multer({ storage: storage });

// Get all posts
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find().populate("posterId", "username email");
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: "Error fetching posts", error });
  }
});

// Get posts by user ID (returns an array of user's posts)
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const userPosts = await Post.find({ posterId: userId }).populate("posterId", "username email");
    
    if (!userPosts.length) {
      return res.status(404).json({ message: "No posts found for this user" });
    }

    res.status(200).json(userPosts);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user's posts", error });
  }
});

// Create a new post (with image upload and authentication)
router.post("/create", authMiddleware, multerUpload.single("image"), async (req, res) => {
  try {
    const { title, body, tags } = req.body;
    const imageUrl = req.file ? req.file.path : ""; // Cloudinary URL

    const newPost = new Post({
      title,
      body,
      tags: tags ? tags.split(",") : [],
      pictureUrl: imageUrl,
      posterId: req.user.id,
    });

    await newPost.save();
    res.status(201).json({ message: "Post created successfully", post: newPost });
  } catch (error) {
    res.status(500).json({ message: "Error creating post", error: error.message });
  }
});

// Update a post (edit post details)
router.put("/:postId", async (req, res) => {
  try {
    const { postId } = req.params;
    const updatedPost = await Post.findByIdAndUpdate(postId, req.body, { new: true });

    if (!updatedPost) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.status(200).json({ message: "Post updated successfully", post: updatedPost });
  } catch (error) {
    res.status(500).json({ message: "Error updating post", error });
  }
});

// Delete a post
router.delete("/:postId", async (req, res) => {
  try {
    const { postId } = req.params;
    const deletedPost = await Post.findByIdAndDelete(postId);

    if (!deletedPost) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting post", error });
  }
});

// Get a single post by ID
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate("posterId", "username email");
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ message: "Error fetching post", error: error.message });
  }
});

module.exports = router;
