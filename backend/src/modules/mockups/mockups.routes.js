const express = require('express');
const router = express.Router();
const authenticate = require('../../middleware/authenticate');
const SavedDesign = require('../../models/SavedDesign');
const { sendSuccess, sendCreated, sendError } = require('../../utils/response');

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
    const { name, type, category, variantId, dimensions, customColors, tabCategory, isFavorite, isDraft, tags } = req.body;

    if (!name) {
      return sendError(res, 'name is required.', 400);
    }

    const design = await SavedDesign.create({
      user: req.user.id,
      name,
      type: type || 'DIELINE',
      category: category || 'General Box',
      variantId: variantId != null ? variantId : 1,
      dimensions: dimensions || {},
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

    const { name, dimensions, customColors, tabCategory, isFavorite, isDraft, tags } = req.body;
    if (name !== undefined) design.name = name;
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

// DELETE /api/mockups/saved/:id — Delete a saved design
router.delete('/saved/:id', authenticate, async (req, res, next) => {
  try {
    const design = await SavedDesign.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!design) return sendError(res, 'Design not found.', 404);
    return sendSuccess(res, {}, 'Design deleted.');
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
