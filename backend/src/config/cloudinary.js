const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

// Configure Cloudinary v2 SDK
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'keylinedesign',
  api_key: process.env.CLOUDINARY_API_KEY || 'demo_key',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'demo_secret',
  secure: true,
});

/**
 * Upload Buffer directly to Cloudinary using Node Readable Stream
 * @param {Buffer} buffer - Multer memory storage buffer
 * @param {Object} options - Cloudinary upload stream options (folder, resource_type, etc.)
 * @returns {Promise<Object>} Cloudinary upload response object
 */
const uploadBufferToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || 'kld',
        resource_type: options.resource_type || 'auto',
        ...options,
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      }
    );

    Readable.from(buffer).pipe(uploadStream);
  });
};

/**
 * Delete asset from Cloudinary by public ID
 * @param {string} publicId - Cloudinary public ID
 * @param {Object} options - Delete options
 */
const deleteFromCloudinary = async (publicId, options = {}) => {
  return cloudinary.uploader.destroy(publicId, options);
};

module.exports = {
  cloudinary,
  uploadBufferToCloudinary,
  deleteFromCloudinary,
};
