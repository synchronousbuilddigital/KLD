// @ts-nocheck
import { API_BASE_URL } from '../config/api';

export interface AiChatResponse {
  reply: string;
  actions: Array<{
    type: string;
    model?: string;
    L?: number;
    W?: number;
    H?: number;
    unit?: string;
    color?: string;
    [key: string]: any;
  }>;
  directions?: Array<{
    id: string;
    title: string;
    subtitle: string;
    primaryColor?: string;
    accentColor?: string;
  }>;
  expandedBrief?: string;
  renderVariations?: Array<{
    id: string;
    title: string;
    url?: string;
    backgroundUrl?: string;
    iconUrl?: string;
    typography?: any;
    v2Layout?: any;
    aspectRatio?: string;
  }>;
  outputsSummary?: string;
  dielineSummary?: string;
  model?: string;
  dimensions?: { L: number; W: number; H: number; unit?: string };
}

export interface DielineDetectionResult {
  matchedBox: {
    itemId: string;
    boxModelKey: string;
    name: string;
    subtitle: string;
    description: string;
    dieline2DImg: string;
    box3DImg: string;
    defaultDims: { L: number; W: number; H: number; unit: string };
    structureFeatures: string[];
  };
  matchedModelKey: string;
  matchedTitle: string;
  confidence: number;
  isExactMatch: boolean;
  dimensions: { L: number; W: number; H: number; unit: string };
  dimensionsIn: { L: number; W: number; H: number; unit: string };
  detectedFeatures: string[];
  explanation: string;
  dieline2DImg: string;
  box3DImg: string;
  allDirectoryBoxes: Array<{
    key: string;
    name: string;
    dieline2DImg: string;
    box3DImg: string;
  }>;
}

const getAiHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

/**
 * Start asynchronous AI precision generation job (resilient against page change & reload)
 */
export async function startAiPrecisionJob(prompt: string, context: any): Promise<{ jobId: string; status: string; progress: number; currentStep: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/ai/jobs/start`, {
      method: 'POST',
      headers: getAiHeaders(),
      credentials: 'include',
      body: JSON.stringify({ prompt, context }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    }
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson.message || 'Failed to start AI generation job');
  } catch (err) {
    console.error('startAiPrecisionJob error:', err);
    throw err;
  }
}

/**
 * Poll AI generation job status
 */
export async function pollAiJob(jobId: string): Promise<{ id: string; status: string; progress: number; currentStep: string; result?: AiChatResponse; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/ai/jobs/${jobId}`, {
      method: 'GET',
      headers: getAiHeaders(),
      credentials: 'include'
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    }
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson.message || 'Failed to query AI generation job');
  } catch (err) {
    console.error('pollAiJob error:', err);
    throw err;
  }
}

/**
 * Detect dieline from uploaded DXF, SVG, or image file and match to the 6 directory box models
 */
export async function detectDielineFile(file: File): Promise<DielineDetectionResult> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}/ai/detect-dieline`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: formData,
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    }
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson.message || 'Failed to analyze dieline file.');
  } catch (err) {
    console.error('detectDielineFile error:', err);
    throw err;
  }
}

export async function sendAiChatMessage(prompt: string, context: any): Promise<AiChatResponse> {
  try {
    const backendUrl = `${API_BASE_URL}/ai/chat`;

    const res = await fetch(backendUrl, {
      method: 'POST',
      headers: getAiHeaders(),
      credentials: 'include',
      body: JSON.stringify({ prompt, context }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    }
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson.message || 'Backend AI endpoint returned an invalid response.');
  } catch (err) {
    console.error('Backend AI endpoint error:', err);
    throw err;
  }
}

export async function sendAiChatMessageV2(prompt: string, context: any): Promise<AiChatResponse> {
  try {
    const backendUrl = `${API_BASE_URL}/ai/chat/v2`;

    const res = await fetch(backendUrl, {
      method: 'POST',
      headers: getAiHeaders(),
      credentials: 'include',
      body: JSON.stringify({ prompt, context }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
      throw new Error(json.message || 'Backend V2 endpoint returned an invalid structure.');
    } else {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson.message || `Backend responded with HTTP ${res.status}`);
    }
  } catch (err) {
    console.error('Backend AI V2 endpoint error:', err);
    throw err;
  }
}
