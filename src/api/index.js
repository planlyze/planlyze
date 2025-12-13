/**
 * Unified API client exporting all services
 * Initialize interceptors here for global request/response handling
 */
import { httpClient } from './http-client';
import authService from './services/auth';
import userService from './services/user';
import analysisService from './services/analysis';
import aiService from './services/ai';

/**
 * Initialize HTTP client interceptors
 */
function initializeInterceptors() {
  /**
   * Request interceptor: Add auth token to headers
   */
  httpClient.addRequestInterceptor((config) => {
    const token = authService.token.get();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  /**
   * Error interceptor: Handle common error scenarios
   */
  httpClient.addErrorInterceptor((error) => {
    if (error.isUnauthorized()) {
      // Token expired or invalid
      authService.clear();
      window.location.href = '/login';
      return;
    }

    if (error.isForbidden()) {
      // User doesn't have permission
      console.warn('Access denied:', error.message);
    }

    return error;
  });
}

// Initialize interceptors when module loads
initializeInterceptors();

/**
 * Export all services
 */
export const api = {
  auth: authService,
  user: userService,
  analysis: analysisService,
  ai: aiService,
  http: httpClient,
};

/**
 * Export individual services for convenience
 */
export { authService, userService, analysisService, aiService };

export default api;
