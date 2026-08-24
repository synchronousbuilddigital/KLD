const multer = require('multer');

// Configure Multer to use Memory Storage (keeps files in RAM buffer for stream upload to Cloudinary)
const storage = multer.memoryStorage();

// File Filter for Image Asset Uploads (Logos, Avatars, Decals)
const imageFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'image/svg+xml',
    'image/gif',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid image file type (${file.mimetype}). Allowed types: PNG, JPG, JPEG, WEBP, SVG, GIF.`), false);
  }
};

// File Filter for Packaging Dielines & Model Uploads
const dielineFileFilter = (req, file, cb) => {
  const allowedExtensions = ['.dxf', '.pdf', '.svg', '.json', '.png', '.jpg', '.jpeg'];
  const ext = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));

  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid dieline file extension (${ext}). Allowed extensions: DXF, PDF, SVG, JSON, PNG, JPG.`), false);
  }
};

// Multer Upload Instances (Max file size: 10MB)
const uploadImage = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: imageFileFilter,
});

const uploadDieline = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
  fileFilter: dielineFileFilter,
});

module.exports = {
  uploadImage,
  uploadDieline,
};
