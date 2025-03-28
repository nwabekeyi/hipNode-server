const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  firstname: {
    type: String,
    required: true,
    trim: true,
  },
  surname: {
    type: String,
    required: true,
    trim: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  dob: {
    type: Date,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  password: {
    type: String,
    required: true,
  },
  refreshTokens: [
    {
      type: String,
      default: [],
    },
  ],
  resetPasswordToken: {
    type: String,
  },
  resetPasswordExpires: {
    type: Date,
  },
  followers: [
    {
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      default: [], 
    },
  ],
  following: [
    {
      type: mongoose.Schema.Types.ObjectId, // Reference to other users
      ref: "User", // Reference the same User model
      default: [], // Default to an empty array
    },
  ],
}, { timestamps: true }); // Adds createdAt & updatedAt fields automatically

module.exports = mongoose.model("User", UserSchema);