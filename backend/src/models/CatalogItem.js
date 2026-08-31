const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true },
    name: { type: String, required: true, trim: true },
    animation: { type: String, default: '', trim: true },
    imageUrl: { type: String, default: '/mockups/generated_box.png', trim: true },
    description: { type: String, default: '', trim: true },
    dimensions: { type: String, default: '', trim: true },
    material: { type: String, default: '', trim: true },
    finishing: { type: String, default: '', trim: true },
    printing: { type: String, default: '', trim: true },
    moq: { type: String, default: '', trim: true },
    isFeatured: { type: Boolean, default: false },
    gridSize: { type: String, enum: ['large', 'medium', 'small'], default: 'large' },
  },
  { _id: true, timestamps: true }
);

const catalogItemSchema = new mongoose.Schema(
  {
    itemId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subtitle: {
      type: String,
      default: '',
      trim: true,
    },
    img: {
      type: String,
      required: true,
      trim: true,
    },
    group: {
      type: String,
      required: true,
      enum: ['boxes', 'bottles', 'pouches', 'containers'],
      default: 'boxes',
    },
    badge: {
      type: String,
      default: '',
      trim: true,
    },
    tag: {
      type: String,
      default: '',
      trim: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    showInMarquee: {
      type: Boolean,
      default: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    boxModelKey: {
      type: String,
      default: 'rte',
      trim: true,
    },
    variants: [variantSchema],
  },
  {
    timestamps: true,
  }
);

// Index for fast query ordering and filtering
catalogItemSchema.index({ active: 1, order: 1 });
catalogItemSchema.index({ group: 1 });

module.exports = mongoose.model('CatalogItem', catalogItemSchema);
