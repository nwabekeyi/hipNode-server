const jwt = require("jsonwebtoken");

// Middleware to authenticate users
const authenticateUser = (req, res, next) => {
  const { accessToken } = req.cookies;

  if (!accessToken) {
    return res.status(401).json({ message: "No access token provided" });
  }

  try {
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
    req.user = decoded; // Attach user ID to request
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(403).json({ message: "Invalid access token" });
  }
};

module.exports = { authenticateUser };
