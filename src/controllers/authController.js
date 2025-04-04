const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const User = require("../models/authSchema");
const cloudinary = require("../config/profileCloudinaryConfig");
const { createAndSendNotification } = require("./notifController"); // Import the centralized notification function

// Register a new user
const registerUser = async (req, res) => {
  try {
    const { firstname, surname, username, dob, email, password = "user" } = req.body;

    if (!firstname || !surname || !username || !dob || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({ firstname, surname, username, dob, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Login user
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Incorrect email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect email or password" });
    }

    // Generate access token (valid for 30 minutes)
    const accessToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "30m" }
    );

    // Generate refresh token (valid for 7 days)
    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    // Save refresh token in the database
    user.refreshTokens.push(refreshToken);
    await user.save();

    // Set refresh token as HTTP-only cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 604800000, // 7 days
    });

    // Send access token and user details in the JSON response
    res.status(200).json({ 
      message: "Login successful",
      accessToken, 
      user: { 
        _id: user._id,
        firstname: user.firstname,
        surname: user.surname,
        username: user.username,
        dob: user.dob,
        email: user.email,
        followers: user.followers,
        following: user.following
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Refresh access token
const refreshToken = async (req, res) => {
  const { refreshToken } = req.cookies;
  if (!refreshToken) {
    return res.status(401).json({ message: "No refresh token provided" });
  }

  if (!refreshToken || typeof refreshToken !== 'string' || !refreshToken.includes('.')) {
    return res.status(400).json({ error: 'Invalid token format' });
  }
  
  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || !user.refreshTokens.includes(refreshToken)) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    // Generate a new access token
    const accessToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "30m" }
    );

    // Set the new access token as an HTTP-only cookie
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 1800000, // 30 minutes
    });

    res.status(200).json({ message: "Access token refreshed" });
  } catch (error) {
    console.error("Refresh token error:", error);
    if (error.name === "TokenExpiredError") {
      return res.status(403).json({ message: "Refresh token expired" });
    }
    res.status(403).json({ message: "Invalid refresh token" });
  }
};

// Logout user
const logoutUser = async (req, res) => {
  const { refreshToken } = req.cookies;

  try {
    const user = await User.findOne({ refreshTokens: refreshToken });
    if (user) {
      // Remove the refresh token from the user's record
      user.refreshTokens = user.refreshTokens.filter(token => token !== refreshToken);
      await user.save();
    }

    // Clear cookies
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Forgot password
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate a reset token
    const resetToken = crypto.randomBytes(20).toString("hex");
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now

    // Save the token and expiry in the database
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();

    // Send email with reset link to the static HTML page
    const resetUrl = `https://hipnode-server.onrender.com/reset-password.html?token=${resetToken}`;
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      to: user.email,
      from: process.env.EMAIL_USER,
      subject: "Password Reset",
      text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
        Please click on the following link, or paste it into your browser to complete the process:\n\n
        ${resetUrl}\n\n
        If you did not request this, please ignore this email and your password will remain unchanged.\n`,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Password reset email sent" });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update the user's password and clear the reset token
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Follow user
const followUser = async (req, res) => {
  const { followerId, followedUserId } = req.body;

  try {
    // Check if the follower and followed user exist
    const follower = await User.findById(followerId);
    const followedUser = await User.findById(followedUserId);

    if (!follower || !followedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the user is already following the target user
    if (follower.following.includes(followedUserId)) {
      return res.status(400).json({ message: "You are already following this user" });
    }

    // Add the followed user to the follower's "following" array
    follower.following.push(followedUserId);
    await follower.save();

    // Add the follower to the followed user's "followers" array
    followedUser.followers.push(followerId);
    await followedUser.save();

    // Create and send notification
    const notification = await createAndSendNotification({
      toUserId: followedUserId,
      fromUserId: followerId,
      message: `${follower.username} started following you.`,
      action: "follow",
    });

    res.status(200).json({ 
      message: "Follow operation successful",
      notification // Optionally return the notification
    });
  } catch (error) {
    console.error("Follow user error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Unfollow user
const unfollowUser = async (req, res) => {
  const { followerId, followedUserId } = req.body;

  try {
    // Check if the follower and followed user exist
    const follower = await User.findById(followerId);
    const followedUser = await User.findById(followedUserId);

    if (!follower || !followedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the user is not following the target user
    if (!follower.following.includes(followedUserId)) {
      return res.status(400).json({ message: "You are not following this user" });
    }

    // Remove the followed user from the follower's "following" array
    follower.following = follower.following.filter(
      (id) => id.toString() !== followedUserId
    );
    await follower.save();

    // Remove the follower from the followed user's "followers" array
    followedUser.followers = followedUser.followers.filter(
      (id) => id.toString() !== followerId
    );
    await followedUser.save();

    res.status(200).json({ message: "Unfollow operation successful" });
  } catch (error) {
    console.error("Unfollow user error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update profile picture
const updateProfilePicture = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if the user is authorized to update this profile
    if (req.user.id !== id) {
      return res.status(403).json({ message: "Unauthorized to update this profile" });
    }

    // Check if a file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Upload the file to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "my-profile-pics",
          resource_type: "image",
          transformation: [
            { width: 150, height: 150, crop: "fill", gravity: "face" },
            { quality: "auto", fetch_format: "auto" },
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    // Update the user's profilePicture field with the Cloudinary URL
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { profilePicture: result.secure_url },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Profile picture updated successfully",
      profilePicture: result.secure_url,
    });
  } catch (error) {
    console.error("Error updating profile picture:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update bio
const updateBio = async (req, res) => {
  try {
    const { id } = req.params;
    const { bio } = req.body;

    // Validate input
    if (typeof bio !== "string") {
      return res.status(400).json({ message: "Bio must be a string" });
    }
    if (bio.length > 500) {
      return res.status(400).json({ message: "Bio cannot exceed 500 characters" });
    }

    // Check if the user is authorized to update this profile
    if (req.user.id !== id) {
      return res.status(403).json({ message: "Unauthorized to update this profile" });
    }

    // Update the user
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { bio },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Bio updated successfully", user: updatedUser });
  } catch (error) {
    console.error("Error updating bio:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const userId = req.params.id;

    // Validate the ID format (MongoDB ObjectId)
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Fetch the user by ID and populate followers and following
    const user = await User.findById(userId)
      .select("-password -refreshTokens") // Exclude sensitive fields
      .populate("followers", "firstname surname username profilePicture")
      .populate("following", "firstname surname username profilePicture");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User fetched successfully",
      user,
    });
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { 
  registerUser, 
  loginUser, 
  refreshToken,
  forgotPassword, 
  getUserById, 
  resetPassword, 
  logoutUser, 
  followUser, 
  unfollowUser, 
  updateProfilePicture, 
  updateBio 
};