const mongoose = require('mongoose');

const savedDesignSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Design name is required'],
      trim: true,
      maxlength: 100,
    },
    type: {
      type: String,
      enum: ['MOCKUP', 'DIELINE'],
      required: true,
    },
    category: {
      type: String,
      required: true,
      // e.g. 'box-mockups', 'pouch-bag-mockups', 'bottle-mockups'
    },
    variantId: {
      type: Number,
      required: true,
    },
    dimensions: {
      // All values in mm
      L: { type: Number, default: null }, // Length
      W: { type: Number, default: null }, // Width
      H: { type: Number, default: null }, // Height
      glueTab: { type: Number, default: null },
      tuck: { type: Number, default: null },
      flapH: { type: Number, default: null },
    },
    customColors: {
      cut: { type: String, default: '#FF0000' },   // Cut line color
      crease: { type: String, default: '#0000FF' }, // Crease line color
      bleed: { type: String, default: '#00FF00' },  // Bleed line color
    },
    tabCategory: {
      type: String,
      default: 'projects',
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
    isDraft: {
      type: Boolean,
      default: true,
    },
    tags: [String],
    thumbnailUrl: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// Index for fast lookup by user
savedDesignSchema.index({ user: 1, createdAt: -1 });

const SavedDesign = mongoose.model('SavedDesign', savedDesignSchema);
module.exports = SavedDesign;
