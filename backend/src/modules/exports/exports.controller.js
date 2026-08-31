const Export = require('../../models/Export');
const User = require('../../models/User');
const { sendSuccess, sendCreated, sendError } = require('../../utils/response');

/**
 * Log a new export request
 * POST /api/exports
 */
const createExport = async (req, res, next) => {
  try {
    const { format, resolution, designId, fileUrl, fileName } = req.body;

    if (!format) {
      return sendError(res, 'Export format (SVG, PDF, DXF, PNG, MP4) is required.', 400);
    }

    const validFormats = ['SVG', 'PDF', 'DXF', 'PNG', 'MP4'];
    const formattedFormat = format.toUpperCase();

    if (!validFormats.includes(formattedFormat)) {
      return sendError(res, `Invalid format '${format}'. Allowed: ${validFormats.join(', ')}`, 400);
    }

    // Check user subscription & plan restrictions
    const user = await User.findById(req.user.id);
    const userPlan = user?.subscription?.plan || user?.plan || 'FREE';

    // 8K render limit check for Non-PRO users
    if (resolution === '8K' && userPlan !== 'PRO') {
      return sendError(res, '8K image rendering requires a PRO Plan membership.', 403);
    }

    const exportRecord = await Export.create({
      user: req.user.id,
      design: designId || null,
      format: formattedFormat,
      resolution: resolution || (formattedFormat === 'PNG' ? '2K' : null),
      fileUrl: fileUrl || null,
      fileName: fileName || `KLD_${formattedFormat}_${Date.now()}`,
      status: 'DONE',
    });

    return sendCreated(res, exportRecord, 'Export recorded in user history successfully.');
  } catch (err) {
    next(err);
  }
};

/**
 * Get current user's past export history
 * GET /api/exports/history
 */
const getExportHistory = async (req, res, next) => {
  try {
    const exports = await Export.find({ user: req.user.id })
      .populate('design', 'name category type')
      .sort({ createdAt: -1 });

    return sendSuccess(res, { exports }, 'Export history retrieved successfully.');
  } catch (err) {
    next(err);
  }
};

/**
 * Check processing status of a specific export
 * GET /api/exports/:id/status
 */
const getExportStatus = async (req, res, next) => {
  try {
    const exportDoc = await Export.findOne({ _id: req.params.id, user: req.user.id });

    if (!exportDoc) {
      return sendError(res, 'Export record not found.', 404);
    }

    return sendSuccess(
      res,
      {
        id: exportDoc._id,
        status: exportDoc.status,
        fileUrl: exportDoc.fileUrl,
        format: exportDoc.format,
        errorMsg: exportDoc.errorMsg,
      },
      'Export status fetched.'
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Delete an export record from history
 * DELETE /api/exports/:id
 */
const deleteExport = async (req, res, next) => {
  try {
    const exportDoc = await Export.findOneAndDelete({ _id: req.params.id, user: req.user.id });

    if (!exportDoc) {
      return sendError(res, 'Export record not found.', 404);
    }

    return sendSuccess(res, {}, 'Export record deleted successfully.');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createExport,
  getExportHistory,
  getExportStatus,
  deleteExport,
};
