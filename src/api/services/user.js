/**
 * User API service
 * Handles user-related operations
 */
import { httpClient } from '../http-client';

/**
 * User service
 */
export const userService = {
  /**
   * Get all users (admin only)
   */
  getAll: async (page = 1, perPage = 20) => {
    return httpClient.get('/users', {
      params: { page, per_page: perPage },
    });
  },

  /**
   * Get user by ID
   */
  getById: async (userId) => {
    return httpClient.get(`/users/${userId}`);
  },

  /**
   * Search users by criteria
   */
  search: async (query, filters = {}) => {
    const params = { q: query, ...filters };
    return httpClient.get('/users/search', { params });
  },

  /**
   * Adjust user credits
   */
  adjustCredits: async (userId, amount, reason) => {
    return httpClient.post(`/users/${userId}/credits/adjust`, {
      amount,
      reason,
    });
  },

  /**
   * Get user credits
   */
  getCredits: async (userId) => {
    return httpClient.get(`/users/${userId}/credits`);
  },

  /**
   * Update user (admin only)
   */
  update: async (userId, data) => {
    return httpClient.put(`/users/${userId}`, data);
  },

  /**
   * Delete user (admin only)
   */
  delete: async (userId) => {
    return httpClient.delete(`/users/${userId}`);
  },

  /**
   * Filter users by criteria
   */
  filter: async (criteria = {}) => {
    return httpClient.get('/users/filter', { params: criteria });
  },
};

export default userService;
