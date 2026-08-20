import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/authService';
import { USER_ROLES } from '../utils/constants';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize session from localStorage
  useEffect(() => {
    try {
      const storedToken = authService.getToken();
      const storedUser = authService.getCurrentUser();

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);
      }
    } catch (e) {
      console.error('Failed to restore auth session', e);
      authService.clearSession();
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Log in user using backend OAuth2 endpoint
   */
  const login = async (email, password, roleOverride = null) => {
    // 1. Call Backend OAuth2 Access-Token API
    const data = await authService.login(email, password);
    const accessToken = data.access_token;

    // 2. Derive user info
    // For admin@example.com, default role is ADMIN. If roleOverride passed or derived from email:
    let role = roleOverride || USER_ROLES.VIEWER;
    if (email.toLowerCase().includes('admin')) {
      role = USER_ROLES.ADMIN;
    } else if (email.toLowerCase().includes('maintenance') || email.toLowerCase().includes('facility')) {
      role = USER_ROLES.MAINTENANCE;
    } else if (email.toLowerCase().includes('hod')) {
      role = USER_ROLES.HOD;
    }

    const userData = {
      email,
      name: email.split('@')[0].replace('.', ' ').toUpperCase(),
      role: role,
      department_id: role === USER_ROLES.ADMIN ? null : 1, // Default dept for non-admins
    };

    // 3. Persist
    authService.setSession(accessToken, userData);
    setToken(accessToken);
    setUser(userData);

    return { token: accessToken, user: userData };
  };

  /**
   * Logout user
   */
  const logout = () => {
    authService.clearSession();
    setToken(null);
    setUser(null);
  };

  /**
   * Switch role during evaluation / testing
   */
  const switchDemoRole = (newRole) => {
    if (!user) return;
    const updatedUser = { ...user, role: newRole };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  /**
   * Check if current user has one of the allowed roles
   */
  const hasRole = (allowedRoles) => {
    if (!user || !user.role) return false;
    if (!allowedRoles || allowedRoles.length === 0) return true;
    return allowedRoles.includes(user.role);
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token,
    isLoading,
    login,
    logout,
    switchDemoRole,
    hasRole,
    isAdmin: user?.role === USER_ROLES.ADMIN,
    isMaintenance: user?.role === USER_ROLES.MAINTENANCE,
    isHOD: user?.role === USER_ROLES.HOD,
    isViewer: user?.role === USER_ROLES.VIEWER,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
