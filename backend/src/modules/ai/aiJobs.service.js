const aiService = require('./ai.service');

/**
 * In-memory AI Generation Jobs Store
 * Retains active and recently completed jobs (15 minute TTL)
 */
const jobs = new Map();
const JOB_TTL_MS = 15 * 60 * 1000; // 15 minutes

// Periodic cleanup of stale jobs
setInterval(() => {
  const now = Date.now();
  for (const [id, job] of jobs.entries()) {
    if (now - job.createdAt > JOB_TTL_MS) {
      jobs.delete(id);
    }
  }
}, 60000);

/**
 * Start an asynchronous AI Precision generation job
 */
function startJob(prompt, context = {}) {
  const jobId = 'ai_job_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

  const job = {
    id: jobId,
    status: 'processing', // 'processing' | 'completed' | 'failed'
    progress: 10,
    currentStep: 'Interpreting packaging dimensions and prompt...',
    prompt,
    context,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    result: null,
    error: null
  };

  jobs.set(jobId, job);

  // Run in background asynchronously without blocking HTTP response
  (async () => {
    try {
      // Step 1: Prompt & Layout classification
      job.progress = 25;
      job.currentStep = 'Synthesizing 3D box model and multi-panel coordinates...';
      job.updatedAt = Date.now();

      // Step 2: Generation execution
      job.progress = 45;
      job.currentStep = 'Generating high-resolution packaging textures & packshots...';
      job.updatedAt = Date.now();

      const result = await aiService.processAiChatV2(prompt, context);

      job.progress = 85;
      job.currentStep = 'Compositing vector dielines and 3D preview wraps...';
      job.updatedAt = Date.now();

      // Small delay for smooth UX transition
      await new Promise(r => setTimeout(r, 600));

      job.status = 'completed';
      job.progress = 100;
      job.currentStep = 'Design generation complete!';
      job.result = result;
      job.updatedAt = Date.now();
    } catch (err) {
      console.error(`AI Job ${jobId} failed:`, err);
      job.status = 'failed';
      job.progress = 0;
      job.currentStep = 'Generation failed: ' + (err.message || 'Unknown error');
      job.error = err.message || 'Failed to generate design';
      job.updatedAt = Date.now();
    }
  })();

  return {
    jobId,
    status: job.status,
    progress: job.progress,
    currentStep: job.currentStep
  };
}

/**
 * Retrieve status of a job
 */
function getJob(jobId) {
  const job = jobs.get(jobId);
  if (!job) return null;

  return {
    id: job.id,
    status: job.status,
    progress: job.progress,
    currentStep: job.currentStep,
    result: job.result,
    error: job.error,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt
  };
}

module.exports = {
  startJob,
  getJob
};
