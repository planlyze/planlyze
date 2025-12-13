/**
 * Hook for managing user authentication state
 */
import { useCallback } from 'react';
import { useApi } from './useApi';
import { authService } from '@/api';

/**
 * useAuth Hook
 * Manages authentication state and provides auth methods
 */
export function useAuth() {
  const { execute: fetchProfile, status, data: user, error } = useApi(
    () => authService.getProfile(),
    { immediate: false }
  );

  const login = useCallback(
    async (email, password) => {
      try {
        const response = await authService.login(email, password);
        authService.token.set(response.data.token);
        await fetchProfile();
        return response;
      } catch (err) {
        throw err;
      }
    },
    [fetchProfile]
  );

  const register = useCallback(
    async (email, password, name) => {
      try {
        const response = await authService.register(email, password, name);
        authService.token.set(response.data.token);
        await fetchProfile();
        return response;
      } catch (err) {
        throw err;
      }
    },
    [fetchProfile]
  );

  const logout = useCallback(() => {
    authService.clear();
  }, []);

  const updateProfile = useCallback(async (profileData) => {
    const response = await authService.updateProfile(profileData);
    await fetchProfile();
    return response;
  }, [fetchProfile]);

  return {
    user: data?.data,
    isLoading: status === 'pending',
    isAuthenticated: !!data?.data,
    error,
    login,
    register,
    logout,
    updateProfile,
    fetchProfile,
  };
}

export default useAuth;
