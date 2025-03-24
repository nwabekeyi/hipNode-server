const Post = require("../models/postSchema");
const mongoose = require("mongoose");

// Get all posts
const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find().populate("posterId", "username email");
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: "Error fetching posts", error });
  }
};


const getPostByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate if userId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Fetch all posts by the user
    const userPosts = await Post.find({ posterId: userId })
      .populate("posterId", "username email") // Populate poster details
      .sort({ createdAt: -1 }) // Sort by newest first
      .lean(); // Improve performance by returning plain objects

    if (userPosts.length === 0) {
      return res.status(404).json({ message: "No posts found for this user" });
    }

    res.status(200).json(userPosts);
  } catch (error) {
    console.error("Error fetching user's posts:", error);
    res.status(500).json({ message: "Error fetching user's posts", error: error.message });
  }
};



// Create a new post (with image upload and authentication)
const createPost = async (req, res) => {
    try {
      const { title, body, tags, posterId } = req.body;
  
      // ✅ Use Cloudinary URL from Multer storage
      const imageUrl = req.file ? req.file.path : null;
  
      // Debugging: Check if the image URL is present
      if (!imageUrl) {
        return res.status(400).json({ message: "Image upload failed" });
      }
  
      const newPost = new Post({
        title,
        body,
        tags: tags ? tags.split(",") : [],
        imageUrl, // ✅ Correct field name
        posterId,
      });
  
      await newPost.save();
      res.status(201).json({ message: "Post created successfully", post: newPost });
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ message: "Error creating post", error: error.message });
    }
  };
  
// Update a post (edit post details)
const updaatePost = async (req, res) => {
    try {
      const { postId } = req.params;
      const { title, body, tags } = req.body;
  
      // Find the post
      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
  
      // Handle image update (if a new image is uploaded)
      let imageUrl = post.imageUrl; // Keep existing image by default
      if (req.file) {
        // Upload new image to Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path);
        imageUrl = result.secure_url;
      }
  
      // Update post fields
      post.title = title || post.title;
      post.body = body || post.body;
      post.tags = tags ? tags.split(",") : post.tags;
      post.imageUrl = imageUrl;
  
      // Save updated post
      const updatedPost = await post.save();
  
      res.status(200).json({ message: "Post updated successfully", post: updatedPost });
    } catch (error) {
      console.error("Error updating post:", error);
      res.status(500).json({ message: "Error updating post", error: error.message });
    }
  };
  

// Delete a post
const deletePost = async (req, res) => {
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
};

// Get a single post by ID
const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate("posterId", "username email");
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ message: "Error fetching post", error: error.message });
  }
};

module.exports = {
    getAllPosts,
    getPostByUserId,
    createPost,
    updaatePost,
    deletePost,
    getPostById,

};
