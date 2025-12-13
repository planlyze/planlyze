/**
 * Authentication API service
 * Handles login, registration, profile updates, etc.
 */
import { httpClient, APIError } from './http-client';

/**
 * Authentication service
 */
export const authService = {
  /**
   * Register a new user
   */
  register: async (email, password, name) => {
    return httpClient.post('/auth/register', {
      email,
      password,
      name,
    });
  },

  /**
   * Login with email and password
   */
  login: async (email, password) => {
    return httpClient.post('/auth/login', {
      email,
      password,
    });
  },

  /**
   * Get current user profile
   */
  getProfile: async () => {
    return httpClient.get('/auth/me');
  },

  /**
   * Update user profile
   */
  updateProfile: async (data) => {
    return httpClient.put('/auth/me', data);
  },

  /**
   * Change password
   */
  changePassword: async (currentPassword, newPassword) => {
    return httpClient.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  },

  /**
   * Logout user
   */
  logout: async () => {
    return httpClient.post('/auth/logout');
  },

  /**
   * Token management
   */
  token: {
    set: (token) => localStorage.setItem('auth_token', token),
    get: () => localStorage.getItem('auth_token'),
    remove: () => localStorage.removeItem('auth_token'),
    exists: () => !!localStorage.getItem('auth_token'),
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: () => authService.token.exists(),

  /**
   * Clear all auth data
   */
  clear: () => {
    authService.token.remove();
  },
};

export default authService;
