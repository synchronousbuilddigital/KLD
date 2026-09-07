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

export async function sendAiChatMessage(prompt: string, context: any): Promise<AiChatResponse> {
  try {
    const backendUrl = API_BASE_URL.startsWith('http') 
      ? `${API_BASE_URL}/ai/chat` 
      : `http://localhost:5000/api/ai/chat`;

    const res = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ prompt, context }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    }
    throw new Error('Backend AI endpoint returned an invalid response.');
  } catch (err) {
    console.error('Backend AI endpoint unreachable:', err);
    throw err;
  }
}

export async function sendAiChatMessageV2(prompt: string, context: any): Promise<AiChatResponse> {
  try {
    const backendUrl = API_BASE_URL.startsWith('http') 
      ? `${API_BASE_URL}/ai/chat/v2` 
      : `http://localhost:5000/api/ai/chat/v2`;

    const res = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      },
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
    console.error('Backend AI V2 endpoint unreachable or failed:', err);
    throw err;
  }
}
