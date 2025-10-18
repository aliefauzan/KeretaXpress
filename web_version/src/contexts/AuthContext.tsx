'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string; user?: User }>;
  register: (name: string, email: string, password: string, password_confirmation: string) => Promise<{ success: boolean; message?: string; user?: User }>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  updateUser: (userData: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthStorageData {
  token: string;
  user: User;
  refreshToken?: string;
  expiresAt: number;
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const TOKEN_STORAGE_KEY = 'auth_data';
const BACKUP_TOKEN_KEY = 'backup_token';
const TOKEN_REFRESH_THRESHOLD = 15 * 60 * 1000; // Refresh token if expiring within 15 minutes
const TOKEN_LIFETIME = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Enhanced storage management with dual persistence
  const saveAuthData = useCallback((token: string, userData: User, refreshToken?: string) => {
    const expiresAt = Date.now() + TOKEN_LIFETIME;
    const authData: AuthStorageData = {
      token,
      user: userData,
      refreshToken,
      expiresAt
    };

    try {
      // Primary storage (persists across browser sessions)
      localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(authData));
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Backup storage (for current session only)
      sessionStorage.setItem(BACKUP_TOKEN_KEY, JSON.stringify(authData));
      
      // Set secure cookie for middleware (7 days expiry for long-term session)
      const cookieExpiry = 7 * 24 * 60 * 60; // 7 days in seconds
      document.cookie = `token=${token}; path=/; max-age=${cookieExpiry}; secure; samesite=strict`;
      
      console.log('Auth data saved successfully');
    } catch (error) {
      console.error('Error saving auth data:', error);
    }
  }, []);

  const clearAuthData = useCallback(() => {
    try {
      // Clear all storage
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem(BACKUP_TOKEN_KEY);
      
      // Clear cookie
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=strict';
      
      setUser(null);
      setIsLoggedIn(false);
      console.log('Auth data cleared successfully');
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  }, []);

  const getStoredAuthData = useCallback((): AuthStorageData | null => {
    try {
      // Try primary storage first
      const primaryData = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (primaryData) {
        const parsed = JSON.parse(primaryData);
        if (parsed.token && parsed.user) {
          return parsed;
        }
      }

      // Fallback to backup storage
      const backupData = sessionStorage.getItem(BACKUP_TOKEN_KEY);
      if (backupData) {
        const parsed = JSON.parse(backupData);
        if (parsed.token && parsed.user) {
          // Restore to primary storage
          localStorage.setItem(TOKEN_STORAGE_KEY, backupData);
          localStorage.setItem('token', parsed.token);
          localStorage.setItem('user', JSON.stringify(parsed.user));
          return parsed;
        }
      }

      // Legacy fallback
      const legacyToken = localStorage.getItem('token');
      const legacyUser = localStorage.getItem('user');
      if (legacyToken && legacyUser) {
        try {
          const userData = JSON.parse(legacyUser);
          return {
            token: legacyToken,
            user: userData,
            expiresAt: Date.now() + TOKEN_LIFETIME
          };
        } catch (e) {
          console.error('Error parsing legacy user data:', e);
        }
      }
    } catch (error) {
      console.error('Error retrieving stored auth data:', error);
    }
    return null;
  }, []);

  const isTokenValid = useCallback((authData: AuthStorageData): boolean => {
    if (!authData.token || !authData.user) {
      return false;
    }
    
    // Check if token is not expired (with some buffer)
    const now = Date.now();
    const isExpired = authData.expiresAt && authData.expiresAt <= now;
    
    return !isExpired;
  }, []);

  const shouldRefreshToken = useCallback((authData: AuthStorageData): boolean => {
    if (!authData.expiresAt) {
      return false;
    }
    
    const now = Date.now();
    const timeUntilExpiry = authData.expiresAt - now;
    
    return timeUntilExpiry <= TOKEN_REFRESH_THRESHOLD && timeUntilExpiry > 0;
  }, []);

  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const authData = getStoredAuthData();
      if (!authData || !authData.token) {
        console.log('No auth data found for refresh');
        return false;
      }

      console.log('Attempting to refresh token...');
      
      // Call refresh endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authData.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.token && data.user) {
          saveAuthData(data.token, data.user, data.refreshToken);
          setUser(data.user);
          setIsLoggedIn(true);
          console.log('Token refreshed successfully');
          return true;        }
      } else if (response.status === 401) {
        console.log('Refresh token expired, clearing auth data');
        clearAuthData();
        return false;
      }
      
      console.error('Token refresh failed:', response.status);
      return false;    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    }
  }, [getStoredAuthData, saveAuthData, clearAuthData]);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; message?: string; user?: User }> => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.token && data.user) {
        saveAuthData(data.token, data.user, data.refreshToken);
        setUser(data.user);
        setIsLoggedIn(true);
        
        return {
          success: true,
          user: data.user
        };
      } else {
        // Handle validation errors (Laravel/Express format)
        if (data.errors) {
          // Get first error from the errors object
          const firstErrorField = Object.keys(data.errors)[0];
          const firstErrorMessage = Array.isArray(data.errors[firstErrorField]) 
            ? data.errors[firstErrorField][0] 
            : data.errors[firstErrorField];
          
          return {
            success: false,
            message: firstErrorMessage || 'Login gagal'
          };
        }
        
        return {
          success: false,
          message: data.message || 'Login gagal'
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Terjadi kesalahan saat login'
      };
    }  }, [saveAuthData]);

  const register = useCallback(async (name: string, email: string, password: string, password_confirmation: string): Promise<{ success: boolean; message?: string; user?: User }> => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ name, email, password, password_confirmation }),
      });

      const data = await response.json();

      if (response.ok && data.token && data.user) {
        saveAuthData(data.token, data.user, data.refreshToken);
        setUser(data.user);
        setIsLoggedIn(true);
        
        return {
          success: true,
          user: data.user
        };
      } else {
        // Handle validation errors (Laravel/Express format)
        if (data.errors) {
          // Get first error from the errors object
          const firstErrorField = Object.keys(data.errors)[0];
          const firstErrorMessage = Array.isArray(data.errors[firstErrorField]) 
            ? data.errors[firstErrorField][0] 
            : data.errors[firstErrorField];
          
          return {
            success: false,
            message: firstErrorMessage || 'Registrasi gagal'
          };
        }
        
        return {
          success: false,
          message: data.message || 'Registrasi gagal'
        };
      }
    } catch (error) {
      console.error('Register error:', error);
      return {
        success: false,
        message: 'Terjadi kesalahan saat registrasi'
      };
    }
  }, [saveAuthData]);

  const logout = useCallback(async (): Promise<void> => {
    try {
      const authData = getStoredAuthData();
      if (authData?.token) {
        // Call logout API
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authData.token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      clearAuthData();
      // Force redirect to home page after logout
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
  }, [getStoredAuthData, clearAuthData]);

  const updateUser = useCallback((userData: User) => {
    setUser(userData);
    const authData = getStoredAuthData();
    if (authData) {
      saveAuthData(authData.token, userData, authData.refreshToken);
    }
  }, [getStoredAuthData, saveAuthData]);

  // Auto-refresh token logic
  useEffect(() => {
    let refreshInterval: NodeJS.Timeout;

    const checkAndRefreshToken = async () => {
      const authData = getStoredAuthData();
      if (!authData) {
        setIsLoading(false);
        return;
      }

      if (!isTokenValid(authData)) {
        console.log('Token invalid, clearing auth data');
        clearAuthData();
        setIsLoading(false);
        return;
      }

      if (shouldRefreshToken(authData)) {
        console.log('Token needs refresh');
        const refreshed = await refreshToken();
        if (!refreshed) {
          clearAuthData();
          setIsLoading(false);
          return;
        }
      } else {
        // Token is still valid
        setUser(authData.user);
        setIsLoggedIn(true);
      }

      setIsLoading(false);
    };

    // Initial check
    checkAndRefreshToken();

    // Set up periodic refresh check (every 5 minutes)
    refreshInterval = setInterval(checkAndRefreshToken, 5 * 60 * 1000);

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [getStoredAuthData, isTokenValid, shouldRefreshToken, refreshToken, clearAuthData]);

  // Listen for storage changes (multi-tab synchronization)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === TOKEN_STORAGE_KEY || e.key === 'token') {
        const authData = getStoredAuthData();
        if (authData && isTokenValid(authData)) {
          setUser(authData.user);
          setIsLoggedIn(true);
        } else {
          setUser(null);
          setIsLoggedIn(false);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [getStoredAuthData, isTokenValid]);
  const value: AuthContextType = {
    user,
    isLoggedIn,
    isLoading,
    login,
    register,
    logout,
    refreshToken,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
