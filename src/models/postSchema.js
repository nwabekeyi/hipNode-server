const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
    },
    tags: {
      type: [String], // Array of strings
    },
    imageUrl: {
      type: String, // Store Cloudinary URL here
      trim: true,
    },
    posterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // References User collection
      required: true,
      unique: true,
    },
    likes: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },
    views: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },
    comments: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }, // Timestamp for each comment
        updatedAt: { type: Date, default: Date.now }, // Timestamp for each comment
        likes: {
          type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
          default: [],
        },
      },
    ],
  },
  { timestamps: true } // Adds createdAt & updatedAt fields to posts
);

module.exports = mongoose.model("Post", PostSchema);
