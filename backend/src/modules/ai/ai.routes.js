const express = require('express');
const router = express.Router();
const authenticate = require('../../middleware/authenticate');
const aiController = require('./ai.controller');

// All AI endpoints require user authentication to protect Gemini & HuggingFace API quotas
router.use(authenticate);

// POST /api/ai/chat
router.post('/chat', aiController.chat);

// POST /api/ai/chat/v2 (Pacdora-Style Precision Mapping)
router.post('/chat/v2', aiController.chatV2);

// POST /api/ai/generate-texture
router.post('/generate-texture', aiController.generateTexture);

module.exports = router;
