const express = require('express');
const router = express.Router();
const aiController = require('./ai.controller');

// POST /api/ai/chat
router.post('/chat', aiController.chat);

// POST /api/ai/chat/v2 (Pacdora-Style Precision Mapping)
router.post('/chat/v2', aiController.chatV2);

// POST /api/ai/generate-texture
router.post('/generate-texture', aiController.generateTexture);

module.exports = router;
