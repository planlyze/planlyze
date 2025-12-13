/**
 * Core HTTP client for API communication
 * Handles authentication, error handling, and request/response transformation
 */

const API_BASE = '/api';

/**
 * Custom error class for API failures
 */
export class APIError extends Error {
  constructor(message, status, data = {}) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.data = data;
    this.errorCode = data.error_code || 'UNKNOWN_ERROR';
  }

  isClientError() {
    return this.status >= 400 && this.status < 500;
  }

  isServerError() {
    return this.status >= 500;
  }

  isUnauthorized() {
    return this.status === 401;
  }

  isForbidden() {
    return this.status === 403;
  }

  isNotFound() {
    return this.status === 404;
  }
}

/**
 * HTTP Client for making API requests
 */
class HTTPClient {
  constructor(baseUrl = API_BASE) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
    this.interceptors = {
      request: [],
      response: [],
      error: [],
    };
  }

  /**
   * Add request interceptor
   */
  addRequestInterceptor(callback) {
    this.interceptors.request.push(callback);
  }

  /**
   * Add response interceptor
   */
  addResponseInterceptor(callback) {
    this.interceptors.response.push(callback);
  }

  /**
   * Add error interceptor
   */
  addErrorInterceptor(callback) {
    this.interceptors.error.push(callback);
  }

  /**
   * Execute request interceptors
   */
  async executeRequestInterceptors(config) {
    let result = config;
    for (const interceptor of this.interceptors.request) {
      result = await interceptor(result);
    }
    return result;
  }

  /**
   * Execute response interceptors
   */
  async executeResponseInterceptors(response) {
    let result = response;
    for (const interceptor of this.interceptors.response) {
      result = await interceptor(result);
    }
    return result;
  }

  /**
   * Execute error interceptors
   */
  async executeErrorInterceptors(error) {
    let result = error;
    for (const interceptor of this.interceptors.error) {
      result = await interceptor(result);
    }
    return result;
  }

  /**
   * Make HTTP request
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config = {
      url,
      method: options.method || 'GET',
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
      ...options,
    };

    // Execute request interceptors
    const finalConfig = await this.executeRequestInterceptors(config);

    try {
      const response = await fetch(finalConfig.url, {
        method: finalConfig.method,
        headers: finalConfig.headers,
        body: finalConfig.body ? JSON.stringify(finalConfig.body) : undefined,
      });

      const data = await this._parseResponse(response);

      if (!response.ok) {
        throw new APIError(
          data.error || 'Request failed',
          response.status,
          data
        );
      }

      // Execute response interceptors
      const finalResponse = await this.executeResponseInterceptors({
        status: response.status,
        data,
        headers: response.headers,
      });

      return finalResponse.data;
    } catch (error) {
      // Execute error interceptors
      const handledError = await this.executeErrorInterceptors(error);
      throw handledError;
    }
  }

  /**
   * Parse response based on content type
   */
  async _parseResponse(response) {
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return await response.json();
    }
    return { message: await response.text() };
  }

  /**
   * GET request
   */
  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  /**
   * POST request
   */
  post(endpoint, body = {}, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body });
  }

  /**
   * PUT request
   */
  put(endpoint, body = {}, options = {}) {
    return this.request(endpoint, { ...options, method: 'PUT', body });
  }

  /**
   * PATCH request
   */
  patch(endpoint, body = {}, options = {}) {
    return this.request(endpoint, { ...options, method: 'PATCH', body });
  }

  /**
   * DELETE request
   */
  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

// Export singleton instance
export const httpClient = new HTTPClient();
