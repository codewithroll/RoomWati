const cloudinary = require("cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const hasCloudinaryConfig =
  Boolean(process.env.CLOUDINARY_CLOUD_NAME) &&
  Boolean(process.env.CLOUDINARY_KEY) &&
  Boolean(process.env.CLOUDINARY_SECRET);

let storage;

if (hasCloudinaryConfig) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET,
  });

  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: "Wanderlust_DEV",
      allowed_formats: ["png", "jpg", "jpeg"],
    },
  });
} else {
  const uploadDir = path.join(__dirname, "public", "uploads");
  fs.mkdirSync(uploadDir, { recursive: true });

  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname || "").toLowerCase();
      const safeExt = ext || ".jpg";
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
    },
  });

  console.warn(
    "Cloudinary credentials missing. Falling back to local uploads in /public/uploads.",
  );
}

module.exports = {
  cloudinary,
  storage,
  hasCloudinaryConfig,
};
