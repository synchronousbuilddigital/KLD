const mongoose = require('mongoose');

const uploadedAssetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    publicId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    url: {
      type: String,
      required: true,
    },
    assetType: {
      type: String,
      enum: ['logo', 'avatar', 'dieline', 'decal'],
      required: true,
    },
    originalName: String,
    size: Number,
    format: String,
  },
  { timestamps: true }
);

const UploadedAsset = mongoose.model('UploadedAsset', uploadedAssetSchema);
module.exports = UploadedAsset;
