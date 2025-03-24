const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "hipnode_uploads", // Cloudinary folder
    allowed_formats: ["jpg", "png", "jpeg", "gif"],
    transformation: [{ width: 800, height: 800, crop: "limit" }], // Resize image
  },
});

const upload = multer({ storage });

module.exports = upload;
