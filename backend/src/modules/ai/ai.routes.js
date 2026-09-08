const express = require('express');
const router = express.Router();
const { optionalAuthenticate } = require('../../middleware/authenticate');
const aiController = require('./ai.controller');

// Optional authentication allows both logged-in users and guests to use the AI packaging assistant
router.use(optionalAuthenticate);

// POST /api/ai/chat
router.post('/chat', aiController.chat);

// POST /api/ai/chat/v2 (Pacdora-Style Precision Mapping)
router.post('/chat/v2', aiController.chatV2);

// POST /api/ai/generate-texture
router.post('/generate-texture', aiController.generateTexture);

module.exports = router;
