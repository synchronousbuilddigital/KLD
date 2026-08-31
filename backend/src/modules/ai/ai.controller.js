const aiService = require('./ai.service');

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
  generateTexture
};
