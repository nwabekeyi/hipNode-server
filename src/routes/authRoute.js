const express = require("express");
const { registerUser, loginUser, refreshToken, logoutUser } = require("../controllers/authController");
const { authenticateUser } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/refresh-token", refreshToken);
router.post("/logout", authenticateUser, logoutUser);

// Protected route (only authenticated users can access)
router.get("/protected", authenticateUser, (req, res) => {
  res.json({ message: "Welcome, authenticated user!" });
});

module.exports = router;
