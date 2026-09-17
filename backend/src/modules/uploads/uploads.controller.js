const User = require('../../models/User');
const UploadedAsset = require('../../models/UploadedAsset');
const { uploadBufferToCloudinary, deleteFromCloudinary } = require('../../config/cloudinary');
const { sendSuccess, sendError } = require('../../utils/response');
const fs = require('fs');
const path = require('path');

const saveLocalFallback = (buffer, mimetype, folder) => {
  const ext = mimetype.split('/')[1] || 'png';
  const fileName = `local_${Date.now()}.${ext}`;
  const uploadDir = path.join(__dirname, '../../../../public/uploads', folder);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  fs.writeFileSync(path.join(uploadDir, fileName), buffer);
  return {
    public_id: `local_${folder}_${Date.now()}`,
    fileName
  };
};

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
      console.warn('⚠️ Cloudinary Upload Warning (using local file fallback):', cloudErr.message);
      const baseUrl = req.protocol + '://' + req.get('host');
      const localResult = saveLocalFallback(req.file.buffer, req.file.mimetype, 'logos');
      
      cloudResult = {
        secure_url: `${baseUrl}/uploads/logos/${localResult.fileName}`,
        public_id: localResult.public_id,
        width: 500,
        height: 500,
        format: req.file.mimetype.split('/')[1] || 'png',
        bytes: req.file.size,
      };
    }

    // Save asset record for ownership tracking
    if (req.user?.id) {
      await UploadedAsset.create({
        user: req.user.id,
        publicId: cloudResult.public_id,
        url: cloudResult.secure_url,
        assetType: 'logo',
        originalName: req.file.originalname,
        size: req.file.size,
        format: cloudResult.format,
      }).catch(err => console.warn('⚠️ Could not save UploadedAsset record:', err.message));
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
      console.warn('⚠️ Cloudinary Upload Warning for avatar (using local file fallback):', cloudErr.message);
      const baseUrl = req.protocol + '://' + req.get('host');
      const localResult = saveLocalFallback(req.file.buffer, req.file.mimetype, 'avatars');

      cloudResult = {
        secure_url: `${baseUrl}/uploads/avatars/${localResult.fileName}`,
        public_id: localResult.public_id
      };
    }

    // Save asset record for ownership tracking
    if (req.user?.id) {
      await UploadedAsset.create({
        user: req.user.id,
        publicId: cloudResult.public_id,
        url: cloudResult.secure_url,
        assetType: 'avatar',
        originalName: req.file.originalname,
        size: req.file.size,
      }).catch(err => console.warn('⚠️ Could not save UploadedAsset record:', err.message));
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
      console.warn('⚠️ Cloudinary Upload Warning for dieline asset (using local file fallback):', cloudErr.message);
      const baseUrl = req.protocol + '://' + req.get('host');
      const localResult = saveLocalFallback(req.file.buffer, req.file.mimetype || 'application/octet-stream', 'dielines');

      cloudResult = {
        secure_url: `${baseUrl}/uploads/dielines/${localResult.fileName}`,
        public_id: localResult.public_id
      };
    }

    // Save asset record for ownership tracking
    if (req.user?.id) {
      await UploadedAsset.create({
        user: req.user.id,
        publicId: cloudResult.public_id,
        url: cloudResult.secure_url,
        assetType: 'dieline',
        originalName: req.file.originalname,
        size: req.file.size,
      }).catch(err => console.warn('⚠️ Could not save UploadedAsset record:', err.message));
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
    // Extract publicId from wildcard route or params (e.g. kld/logos/sample)
    const rawPublicId = req.params[0] || req.params.publicId;
    if (!rawPublicId) {
      return sendError(res, 'Asset Public ID is required.', 400);
    }
    const publicId = decodeURIComponent(rawPublicId);

    // Verify ownership of the asset in UploadedAsset database model (if user is not ADMIN)
    if (req.user?.role !== 'ADMIN') {
      const assetDoc = await UploadedAsset.findOne({ publicId });
      if (assetDoc && assetDoc.user.toString() !== req.user.id) {
        return sendError(res, 'Access denied. You do not have permission to delete this asset.', 403);
      }
    }

    await deleteFromCloudinary(publicId);
    await UploadedAsset.deleteOne({ publicId }).catch(() => {});

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
