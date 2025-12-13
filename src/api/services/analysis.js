/**
 * Analysis API service
 * Handles analysis-related operations
 */
import { httpClient } from '../http-client';

/**
 * Analysis service
 */
export const analysisService = {
  /**
   * Get all analyses for current user
   */
  getAll: async (page = 1, perPage = 20) => {
    return httpClient.get('/analyses', {
      params: { page, per_page: perPage },
    });
  },

  /**
   * Get analysis by ID
   */
  getById: async (analysisId) => {
    return httpClient.get(`/analyses/${analysisId}`);
  },

  /**
   * Create new analysis
   */
  create: async (data) => {
    return httpClient.post('/analyses', data);
  },

  /**
   * Update analysis
   */
  update: async (analysisId, data) => {
    return httpClient.put(`/analyses/${analysisId}`, data);
  },

  /**
   * Delete analysis
   */
  delete: async (analysisId) => {
    return httpClient.delete(`/analyses/${analysisId}`);
  },

  /**
   * Generate analysis report
   */
  generateReport: async (analysisId, options = {}) => {
    return httpClient.post(`/analyses/${analysisId}/generate-report`, options);
  },

  /**
   * Export analysis
   */
  export: async (analysisId, format = 'pdf') => {
    return httpClient.get(`/analyses/${analysisId}/export`, {
      params: { format },
    });
  },

  /**
   * Share analysis
   */
  share: async (analysisId, shareData) => {
    return httpClient.post(`/analyses/${analysisId}/share`, shareData);
  },

  /**
   * Get shared analysis
   */
  getShared: async (shareToken) => {
    return httpClient.get(`/analyses/shared/${shareToken}`);
  },

  /**
   * Filter analyses
   */
  filter: async (criteria = {}) => {
    return httpClient.get('/analyses/filter', { params: criteria });
  },
};

export default analysisService;
