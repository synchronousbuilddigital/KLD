const express = require('express');
const authenticate = require('../../middleware/authenticate');
const {
  createExport,
  getExportHistory,
  getExportStatus,
  deleteExport,
} = require('./exports.controller');

const router = express.Router();

// All export routes require authentication
router.use(authenticate);

router.post('/', createExport);
router.get('/history', getExportHistory);
router.get('/:id/status', getExportStatus);
router.delete('/:id', deleteExport);

module.exports = router;
