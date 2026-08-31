const express = require('express');
const router = express.Router();
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const {
  getPublicCatalog,
  getAdminCatalog,
  createCatalogItem,
  updateCatalogItem,
  deleteCatalogItem,
  addVariantToCategory,
  updateCategoryVariant,
  deleteCategoryVariant,
} = require('./catalog.controller');

// Public route for landing & 3D models pages
router.get('/public', getPublicCatalog);
router.get('/', getPublicCatalog);

// Protected admin management routes
router.get('/admin/list', authenticate, authorize('ADMIN'), getAdminCatalog);
router.post('/admin/create', authenticate, authorize('ADMIN'), createCatalogItem);
router.patch('/admin/:id', authenticate, authorize('ADMIN'), updateCatalogItem);
router.delete('/admin/:id', authenticate, authorize('ADMIN'), deleteCatalogItem);

// Sub-variant management routes
router.post('/admin/:id/variants', authenticate, authorize('ADMIN'), addVariantToCategory);
router.patch('/admin/:id/variants/:variantId', authenticate, authorize('ADMIN'), updateCategoryVariant);
router.delete('/admin/:id/variants/:variantId', authenticate, authorize('ADMIN'), deleteCategoryVariant);

module.exports = router;
