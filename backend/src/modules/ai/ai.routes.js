const express = require('express');
const router = express.Router();
const { optionalAuthenticate } = require('../../middleware/authenticate');
const { uploadDieline } = require('../../middleware/upload');
const aiController = require('./ai.controller');

// Optional authentication allows both logged-in users and guests to use the AI packaging assistant
router.use(optionalAuthenticate);

// POST /api/ai/chat
router.post('/chat', aiController.chat);

// POST /api/ai/chat/v2 (Pacdora-Style Precision Mapping)
router.post('/chat/v2', aiController.chatV2);

// Asynchronous generation jobs
// POST /api/ai/jobs/start
router.post('/jobs/start', aiController.startAiJob);

// GET /api/ai/jobs/:jobId
router.get('/jobs/:jobId', aiController.getAiJobStatus);

// Dieline CAD detection & matching across the 6 directory box models
// POST /api/ai/detect-dieline
router.post('/detect-dieline', uploadDieline.single('file'), aiController.detectDieline);

// POST /api/ai/generate-texture
router.post('/generate-texture', aiController.generateTexture);

module.exports = router;
