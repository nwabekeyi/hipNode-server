const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/authSchema");

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

    // Set tokens as HTTP-only cookies
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 1800000, // 30 minutes
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 604800000, // 7 days
    });

    res.status(200).json({ message: "Login successful" });
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
      { expiresIn: "30m" } // Consistent expiry time
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

module.exports = { registerUser, loginUser, refreshToken, logoutUser };