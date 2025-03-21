const cloudinary = require("cloudinary").v2;
require("dotenv").config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,  // Corrected
  api_key: process.env.CLOUDINARY_API_KEY,        // Corrected
  api_secret: process.env.CLOUDINARY_API_SECRET,  // Corrected
});

module.exports = cloudinary;
