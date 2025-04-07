const jwt = require("jsonwebtoken");

const authenticateUser = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("No or invalid Authorization header:", req.headers);
    return res.status(401).json({ message: "No access token provided" });
  }

  const accessToken = authHeader.split(" ")[1]; // Extract token after "Bearer"

  try {
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
    console.log("Token decoded successfully:", decoded);
    req.user = { id: decoded.id }; // Match the structure expected by your endpoints
    next();
  } catch (error) {
    console.error("Authentication error:", error.name, error.message);
    return res.status(403).json({ message: "Invalid access token" });
  }
};

module.exports = { authenticateUser };