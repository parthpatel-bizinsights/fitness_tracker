const multer = require("multer");
const sharp = require("sharp");
const cloudinary = require("../config/cloudinary");
const apiError = require("../../utils/error.util");
const HTTP_STATUS = require("../../constants/httpStatus.constant");
const HTTP_CODE = require("../../constants/httpCode.constant");

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new apiError(HTTP_STATUS.BAD_REQUEST, HTTP_CODE.BAD_REQUEST, "Invalid file type. Only JPEG, PNG, and WebP are allowed."), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter,
});

// Helper function to process and upload to Cloudinary
const uploadToCloudinary = async (fileBuffer, folder = "fitness_tracker") => {
  try {
    const processedBuffer = await sharp(fileBuffer)
      .resize({ width: 1200, withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder },
        (error, result) => {
          if (error) return reject(error);
          resolve(result.secure_url);
        }
      );
      uploadStream.end(processedBuffer);
    });
  } catch (error) {
    throw new apiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, HTTP_CODE.INTERNAL_SERVER_ERROR, "Image processing or upload failed: " + error.message);
  }
};

module.exports = {
  upload,
  uploadToCloudinary,
};
