const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

// Import controllers for authentication
const {
  registerUser,
  loginUser,
  refreshToken,
  forgotPassword,
  resetPassword,
  logoutUser,
  followUser,
  unfollowUser,
  updateProfilePicture,
  updateBio,
  getUserById 
} = require("../controllers/authController");


// Import middleware for authentication
const { authenticateUser } = require("../middlewares/authMiddleware");

// Configure multer to store files in memory (we'll upload to Cloudinary)
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error("Only images (jpeg, jpg, png, gif) are allowed"));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
});

// Authentication routes
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
router.get("/:id", authenticateUser, getUserById);

// Profile update routes (protected)
router.patch("/:id/profile-picture", authenticateUser, upload.single("profilePicture"), updateProfilePicture);
router.patch("/:id", authenticateUser, updateBio);

module.exports = router;