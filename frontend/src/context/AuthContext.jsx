import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/authService';
import { USER_ROLES } from '../utils/constants';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize and verify session from localStorage & backend
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = authService.getToken();
        const storedUser = authService.getCurrentUser();

        if (storedToken) {
          setToken(storedToken);
          // Set cached user immediately to prevent flash
          if (storedUser) {
            setUser(storedUser);
          }
          // Validate and refresh with backend /auth/me
          try {
            const verifiedProfile = await authService.getMe();
            if (verifiedProfile && verifiedProfile.is_active) {
              const freshUserData = {
                id: verifiedProfile.id,
                email: verifiedProfile.email,
                name: verifiedProfile.name || verifiedProfile.email.split('@')[0],
                role: verifiedProfile.role,
                department_id: verifiedProfile.department_id || (verifiedProfile.role === USER_ROLES.ADMIN ? null : 1),
              };
              setUser(freshUserData);
              authService.setSession(storedToken, freshUserData);
            }
          } catch (meError) {
            // If token rejected with 401 or network error
            if (meError.response && meError.response.status === 401) {
              authService.clearSession();
              setToken(null);
              setUser(null);
            }
          }
        }
      } catch (e) {
        console.error('Failed to restore auth session', e);
        authService.clearSession();
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  /**
   * Log in user using backend OAuth2 endpoint
   */
  const login = async (email, password, roleOverride = null) => {
    // 1. Call Backend OAuth2 Access-Token API
    const data = await authService.login(email, password);
    const accessToken = data.access_token;

    // Set token immediately so subsequent getMe() attaches it
    localStorage.setItem('token', accessToken);

    // 2. Fetch authenticated profile from backend /auth/me
    let backendUser = null;
    try {
      backendUser = await authService.getMe();
    } catch {
      // Fallback if /auth/me is temporarily unreachable
    }

    const role = roleOverride || backendUser?.role || (email.toLowerCase().includes('admin') ? USER_ROLES.ADMIN : USER_ROLES.VIEWER);

    const userData = {
      id: backendUser?.id || 1,
      email: backendUser?.email || email,
      name: backendUser?.name || email.split('@')[0].replace('.', ' ').toUpperCase(),
      role: role,
      department_id: backendUser?.department_id || (role === USER_ROLES.ADMIN ? null : 1),
    };

    // 3. Persist session
    authService.setSession(accessToken, userData);
    setToken(accessToken);
    setUser(userData);

    return { token: accessToken, user: userData };
  };

  /**
   * Register and automatically authenticate new user
   */
  const signup = async (userData) => {
    // 1. Call backend registration endpoint
    const data = await authService.register(userData);
    const accessToken = data.access_token;
    const regUser = data.user;

    localStorage.setItem('token', accessToken);

    const userProfile = {
      id: regUser.id,
      email: regUser.email,
      name: regUser.name || regUser.email.split('@')[0],
      role: regUser.role,
      department_id: regUser.department_id || (regUser.role === USER_ROLES.ADMIN ? null : 1),
    };

    authService.setSession(accessToken, userProfile);
    setToken(accessToken);
    setUser(userProfile);

    return { token: accessToken, user: userProfile };
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
    signup,
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
