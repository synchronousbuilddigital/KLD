const mongoose = require('mongoose');

const exportSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    design: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SavedDesign',
      default: null,
    },
    format: {
      type: String,
      enum: ['SVG', 'PDF', 'DXF', 'PNG', 'MP4'],
      required: true,
    },
    resolution: {
      type: String,
      default: null, // e.g. "2K", "8K", "720p"
    },
    fileUrl: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'DONE', 'FAILED'],
      default: 'PENDING',
    },
    errorMsg: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

exportSchema.index({ user: 1, createdAt: -1 });

const Export = mongoose.model('Export', exportSchema);
module.exports = Export;
