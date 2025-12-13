/**
 * AI API service
 * Handles AI-related operations
 */
import { httpClient } from '../http-client';

/**
 * AI service
 */
export const aiService = {
  /**
   * Invoke AI with prompt
   */
  invoke: async (prompt, options = {}) => {
    return httpClient.post('/ai/invoke', {
      prompt,
      ...options,
    });
  },

  /**
   * Generate analysis using AI
   */
  generateAnalysis: async (data, systemPrompt = null) => {
    return httpClient.post('/ai/generate-analysis', {
      data,
      system_prompt: systemPrompt,
    });
  },

  /**
   * Stream AI response (for real-time updates)
   */
  streamInvoke: async (prompt, onChunk, options = {}) => {
    const response = await fetch('/api/ai/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
      body: JSON.stringify({
        prompt,
        ...options,
      }),
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        if (onChunk) onChunk(chunk);
      }
    } finally {
      reader.cancel();
    }
  },
};

export default aiService;
