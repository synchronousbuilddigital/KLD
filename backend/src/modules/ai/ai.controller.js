const aiService = require('./ai.service');
const aiJobsService = require('./aiJobs.service');
const dielineDetectorService = require('./dielineDetector.service');

/**
 * Handles AI Packaging Chat request
 * POST /api/ai/chat
 */
async function chat(req, res, next) {
  try {
    const { prompt, context } = req.body;
    if (!prompt) {
      return res.status(400).json({ success: false, message: 'Prompt is required' });
    }

    const result = await aiService.processAiChat(prompt, context || {});
    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handles AI Packaging Chat request (V2 - Multi-Panel Precision)
 * POST /api/ai/chat/v2
 */
async function chatV2(req, res, next) {
  try {
    const { prompt, context } = req.body;
    if (!prompt) {
      return res.status(400).json({ success: false, message: 'Prompt is required' });
    }

    const result = await aiService.processAiChatV2(prompt, context || {});
    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Start asynchronous AI generation job
 * POST /api/ai/jobs/start
 */
async function startAiJob(req, res, next) {
  try {
    const { prompt, context } = req.body;
    if (!prompt) {
      return res.status(400).json({ success: false, message: 'Prompt is required' });
    }

    const job = aiJobsService.startJob(prompt, context || {});
    return res.json({
      success: true,
      data: job
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Check status of AI generation job
 * GET /api/ai/jobs/:jobId
 */
async function getAiJobStatus(req, res, next) {
  try {
    const { jobId } = req.params;
    const job = aiJobsService.getJob(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Generation job not found or has expired'
      });
    }

    return res.json({
      success: true,
      data: job
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handles Dieline Detection from uploaded DXF, SVG, or image file
 * POST /api/ai/detect-dieline
 */
async function detectDieline(req, res, next) {
  try {
    if (!req.file && !req.body.content) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a DXF, SVG, or dieline image file.'
      });
    }

    const fileBuffer = req.file ? req.file.buffer : Buffer.from(req.body.content, 'utf-8');
    const originalName = req.file ? req.file.originalname : (req.body.filename || 'dieline.dxf');
    const mimeType = req.file ? req.file.mimetype : 'application/octet-stream';

    const detectionResult = await dielineDetectorService.detectUploadedDieline(
      fileBuffer,
      originalName,
      mimeType
    );

    return res.json({
      success: true,
      data: detectionResult
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handles AI Artwork / Texture generation request
 * POST /api/ai/generate-texture
 */
async function generateTexture(req, res, next) {
  try {
    const { prompt, style } = req.body;
    const result = await aiService.generateArtworkTexture(prompt, style);
    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  chat,
  chatV2,
  startAiJob,
  getAiJobStatus,
  detectDieline,
  generateTexture
};
