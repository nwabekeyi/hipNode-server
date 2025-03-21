const express = require("express");
const { registerUser, loginUser, refreshToken,forgotPassword,resetPassword, logoutUser, followUser, unfollowUser } = require("../controllers/authController");
const { authenticateUser } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/refresh-token", refreshToken);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.post("/logout", authenticateUser, logoutUser);
router.post("/follow", authenticateUser, followUser);
router.post("/unfollow", authenticateUser, unfollowUser);

// Protected route (only authenticated users can access)
router.get("/protected", authenticateUser, (req, res) => {
  res.json({ message: "Welcome, authenticated user!" });
});

module.exports = router;
