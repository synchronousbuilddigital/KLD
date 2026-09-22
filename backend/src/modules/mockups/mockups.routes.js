const express = require('express');
const router = express.Router();
const authenticate = require('../../middleware/authenticate');
const SavedDesign = require('../../models/SavedDesign');
const { deleteFromCloudinary } = require('../../config/cloudinary');
const { sendSuccess, sendCreated, sendError } = require('../../utils/response');

// Helper to extract Cloudinary public ID from URL or object
const extractCloudinaryPublicId = (item) => {
  if (!item) return null;
  if (typeof item === 'object' && item.publicId) return item.publicId;
  const urlStr = typeof item === 'string' ? item : item.url || item.imageSrc || item.src;
  if (urlStr && typeof urlStr === 'string' && urlStr.includes('cloudinary.com')) {
    const parts = urlStr.split('/upload/');
    if (parts.length > 1) {
      const pathAfterUpload = parts[1].replace(/^v\d+\//, ''); // remove version prefix v123456/
      const dotIndex = pathAfterUpload.lastIndexOf('.');
      return dotIndex !== -1 ? pathAfterUpload.substring(0, dotIndex) : pathAfterUpload;
    }
  }
  return null;
};

// GET /api/mockups/saved — Get all saved designs for the current user
router.get('/saved', authenticate, async (req, res, next) => {
  try {
    const designs = await SavedDesign.find({ user: req.user.id })
      .sort({ updatedAt: -1 })
      .limit(50);
    return sendSuccess(res, { designs });
  } catch (err) {
    next(err);
  }
});

// POST /api/mockups/saved — Save a new design
router.post('/saved', authenticate, async (req, res, next) => {
  try {
    const { name, type, category, boxModel, variantId, dimensions, packageColor, insideColor, decals, customColors, tabCategory, isFavorite, isDraft, tags } = req.body;

    if (!name) {
      return sendError(res, 'name is required.', 400);
    }

    const design = await SavedDesign.create({
      user: req.user.id,
      name,
      type: type || 'DIELINE',
      category: category || 'General Box',
      boxModel: boxModel || 'rte',
      variantId: variantId != null ? variantId : 1,
      dimensions: dimensions || {},
      packageColor: packageColor || null,
      insideColor: insideColor || null,
      decals: decals || [],
      customColors: customColors || {},
      tabCategory: tabCategory || 'projects',
      isFavorite: isFavorite || false,
      isDraft: isDraft !== undefined ? isDraft : true,
      tags: tags || []
    });

    return sendCreated(res, { design }, 'Design saved successfully.');
  } catch (err) {
    next(err);
  }
});

// PUT /api/mockups/saved/:id — Update a saved design
router.put('/saved/:id', authenticate, async (req, res, next) => {
  try {
    const design = await SavedDesign.findOne({ _id: req.params.id, user: req.user.id });
    if (!design) return sendError(res, 'Design not found.', 404);

    const { name, type, category, boxModel, variantId, packageColor, insideColor, decals, dimensions, customColors, tabCategory, isFavorite, isDraft, tags } = req.body;
    if (name !== undefined) design.name = name;
    if (type !== undefined) design.type = type;
    if (category !== undefined) design.category = category;
    if (boxModel !== undefined) design.boxModel = boxModel;
    if (variantId !== undefined) design.variantId = variantId;
    if (packageColor !== undefined) design.packageColor = packageColor;
    if (insideColor !== undefined) design.insideColor = insideColor;
    if (decals !== undefined) design.decals = decals;
    if (dimensions !== undefined) design.dimensions = { ...design.dimensions, ...dimensions };
    if (customColors !== undefined) design.customColors = { ...design.customColors, ...customColors };
    if (tabCategory !== undefined) design.tabCategory = tabCategory;
    if (isFavorite !== undefined) design.isFavorite = isFavorite;
    if (isDraft !== undefined) design.isDraft = isDraft;
    if (tags !== undefined) design.tags = tags;

    await design.save();
    return sendSuccess(res, { design }, 'Design updated.');
  } catch (err) {
    next(err);
  }
});

// DELETE /api/mockups/saved/:id — Delete a saved design and clean up Cloudinary assets
router.delete('/saved/:id', authenticate, async (req, res, next) => {
  try {
    const design = await SavedDesign.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!design) return sendError(res, 'Design not found.', 404);

    // Asynchronously clean up associated Cloudinary image assets
    try {
      const publicIds = new Set();
      if (design.thumbnailUrl) {
        const pid = extractCloudinaryPublicId(design.thumbnailUrl);
        if (pid) publicIds.add(pid);
      }
      if (Array.isArray(design.decals)) {
        design.decals.forEach((decal) => {
          const pid = extractCloudinaryPublicId(decal);
          if (pid) publicIds.add(pid);
        });
      }

      for (const pid of publicIds) {
        deleteFromCloudinary(pid).catch((err) => {
          console.warn(`⚠️ Cloudinary asset deletion notice for [${pid}]:`, err.message);
        });
      }
    } catch (cleanupErr) {
      console.warn('⚠️ Non-blocking Cloudinary cleanup notice:', cleanupErr.message);
    }

    return sendSuccess(res, {}, 'Design and associated cloud assets deleted.');
  } catch (err) {
    next(err);
  }
});

// GET /api/mockups/saved/:id — Get a single saved design
router.get('/saved/:id', authenticate, async (req, res, next) => {
  try {
    const design = await SavedDesign.findOne({ _id: req.params.id, user: req.user.id });
    if (!design) return sendError(res, 'Design not found.', 404);
    return sendSuccess(res, { design });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
