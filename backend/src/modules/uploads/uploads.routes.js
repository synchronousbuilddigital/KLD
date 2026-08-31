const express = require('express');
const router = express.Router();
const authenticate = require('../../middleware/authenticate');
const { uploadImage, uploadDieline } = require('../../middleware/upload');
const {
  uploadLogo,
  uploadAvatar,
  uploadDielineAsset,
  deleteAsset,
} = require('./uploads.controller');

// POST /api/uploads/logo — Upload brand logo / decal image
router.post('/logo', uploadImage.single('logo'), uploadLogo);

// POST /api/uploads/avatar — Upload user profile avatar (authenticated)
router.post('/avatar', authenticate, uploadImage.single('avatar'), uploadAvatar);

// POST /api/uploads/dieline — Upload custom dieline / model file
router.post('/dieline', uploadDieline.single('dieline'), uploadDielineAsset);

// DELETE /api/uploads/:publicId — Delete Cloudinary asset (authenticated)
router.delete('/:publicId', authenticate, deleteAsset);

module.exports = router;
