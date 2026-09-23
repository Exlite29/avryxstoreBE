const cloudinary = require("cloudinary").v2;
const dotenv = require("dotenv");

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "demo",
  api_key: process.env.CLOUDINARY_API_KEY || "",
  api_secret: process.env.CLOUDINARY_API_SECRET || "",
  secure: true,
});

const uploadImage = async (filePath, folder = "sari-sari-store") => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: "image",
      transformation: [
        { width: 800, height: 800, crop: "limit" },
        { quality: "auto:good" },
        { format: "webp" },
      ],
    });
    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw error;
  }
};

const uploadBase64Image = async (base64Data, folder = "sari-sari-store") => {
  try {
    const result = await cloudinary.uploader.upload(base64Data, {
      folder: folder,
      resource_type: "image",
      transformation: [
        { width: 800, height: 800, crop: "limit" },
        { quality: "auto:good" },
        { format: "webp" },
      ],
    });
    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    console.error("Cloudinary base64 upload error:", error);
    throw error;
  }
};

const deleteImage = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    throw error;
  }
};

const generateThumbnail = async (imageUrl, width = 200, height = 200) => {
  try {
    const result = cloudinary.url(imageUrl, {
      transformation: [
        { width: width, height: height, crop: "fill" },
        { quality: "auto:low" },
        { format: "webp" },
      ],
    });
    return result;
  } catch (error) {
    console.error("Cloudinary thumbnail error:", error);
    throw error;
  }
};

module.exports = {
  cloudinary,
  uploadImage,
  uploadBase64Image,
  deleteImage,
  generateThumbnail,
};
