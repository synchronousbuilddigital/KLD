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
    url: string;
    aspectRatio?: string;
  }>;
  outputsSummary?: string;
  dielineSummary?: string;
  model?: string;
  dimensions?: { L: number; W: number; H: number; unit?: string };
}

const getAiHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

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
