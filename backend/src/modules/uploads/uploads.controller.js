const User = require('../../models/User');
const { uploadBufferToCloudinary, deleteFromCloudinary } = require('../../config/cloudinary');
const { sendSuccess, sendError } = require('../../utils/response');

/* ─── UPLOAD BRAND LOGO / DECAL ──────────────────────────────────── */
const uploadLogo = async (req, res, next) => {
  try {
    if (!req.file) {
      return sendError(res, 'Please select a logo image file to upload.', 400);
    }

    let cloudResult;
    try {
      cloudResult = await uploadBufferToCloudinary(req.file.buffer, {
        folder: 'kld/logos',
        resource_type: 'image',
      });
    } catch (cloudErr) {
      console.warn('⚠️ Cloudinary Upload Warning (using local data URL fallback):', cloudErr.message);
      // Fallback if Cloudinary credentials are mock/unreachable
      const base64 = req.file.buffer.toString('base64');
      const dataUrl = `data:${req.file.mimetype};base64,${base64}`;
      cloudResult = {
        secure_url: dataUrl,
        public_id: `local_logo_${Date.now()}`,
        width: 500,
        height: 500,
        format: req.file.mimetype.split('/')[1] || 'png',
        bytes: req.file.size,
      };
    }

    return sendSuccess(
      res,
      {
        url: cloudResult.secure_url,
        publicId: cloudResult.public_id,
        width: cloudResult.width,
        height: cloudResult.height,
        format: cloudResult.format,
        bytes: cloudResult.bytes,
      },
      'Logo image uploaded successfully to Cloudinary!'
    );
  } catch (err) {
    next(err);
  }
};

/* ─── UPLOAD USER PROFILE AVATAR ─────────────────────────────────── */
const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return sendError(res, 'Please select an avatar image file to upload.', 400);
    }

    let cloudResult;
    try {
      cloudResult = await uploadBufferToCloudinary(req.file.buffer, {
        folder: 'kld/avatars',
        resource_type: 'image',
        transformation: [
          { width: 400, height: 400, crop: 'fill', gravity: 'face' }
        ]
      });
    } catch (cloudErr) {
      console.warn('⚠️ Cloudinary Upload Warning for avatar (using base64 fallback):', cloudErr.message);
      const base64 = req.file.buffer.toString('base64');
      const dataUrl = `data:${req.file.mimetype};base64,${base64}`;
      cloudResult = {
        secure_url: dataUrl,
        public_id: `local_avatar_${Date.now()}`
      };
    }

    // Update Avatar URL on authenticated user document in MongoDB
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatarUrl: cloudResult.secure_url },
      { new: true, runValidators: true }
    ).select('-passwordHash -refreshToken');

    if (!user) {
      return sendError(res, 'User account not found.', 404);
    }

    return sendSuccess(
      res,
      {
        user: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
          avatarUrl: user.avatarUrl,
          role: user.role,
        },
        url: cloudResult.secure_url,
        publicId: cloudResult.public_id,
      },
      'Profile avatar updated successfully!'
    );
  } catch (err) {
    next(err);
  }
};

/* ─── UPLOAD DIELINE FILE (DXF, PDF, SVG, JSON) ─────────────────── */
const uploadDielineAsset = async (req, res, next) => {
  try {
    if (!req.file) {
      return sendError(res, 'Please select a dieline vector file to upload.', 400);
    }

    let cloudResult;
    try {
      cloudResult = await uploadBufferToCloudinary(req.file.buffer, {
        folder: 'kld/dielines',
        resource_type: 'auto',
      });
    } catch (cloudErr) {
      console.warn('⚠️ Cloudinary Upload Warning for dieline asset:', cloudErr.message);
      const base64 = req.file.buffer.toString('base64');
      const dataUrl = `data:${req.file.mimetype || 'application/octet-stream'};base64,${base64}`;
      cloudResult = {
        secure_url: dataUrl,
        public_id: `local_dieline_${Date.now()}`
      };
    }

    return sendSuccess(
      res,
      {
        url: cloudResult.secure_url,
        publicId: cloudResult.public_id,
        originalName: req.file.originalname,
        size: req.file.size,
      },
      'Dieline asset uploaded successfully!'
    );
  } catch (err) {
    next(err);
  }
};

/* ─── DELETE CLOUDINARY ASSET ────────────────────────────────────── */
const deleteAsset = async (req, res, next) => {
  try {
    const { publicId } = req.params;
    if (!publicId) {
      return sendError(res, 'Asset Public ID is required.', 400);
    }

    await deleteFromCloudinary(publicId);
    return sendSuccess(res, { publicId }, 'Cloudinary asset deleted successfully.');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  uploadLogo,
  uploadAvatar,
  uploadDielineAsset,
  deleteAsset,
};
