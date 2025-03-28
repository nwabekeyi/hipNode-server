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
      ref: "User",
      required: true, // ❌ Removed index: true
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
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
        likes: {
          type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
          default: [],
        },
      },
    ],
  },
  { timestamps: true }
);

// ✅ Keep only this index declaration
PostSchema.index({ posterId: 1 });

module.exports = mongoose.model("Post", PostSchema);

