const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary.config");


// Configure Multer to use Cloudinary storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: "hipnode_posts",
      allowed_formats: ["jpg", "png", "jpeg"],
    },
  });
  
  const multerUpload = multer({ storage: storage });

  module.exports = multerUpload;