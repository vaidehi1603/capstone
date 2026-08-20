import apiClient from './api';

export const authService = {
  /**
   * Login with email and password via OAuth2 password flow
   * Backend endpoint: POST /api/v1/auth/login/access-token
   * Expected format: application/x-www-form-urlencoded with 'username' and 'password'
   */
  login: async (email, password) => {
    const params = new URLSearchParams();
    params.append('username', email.trim());
    params.append('password', password);

    const response = await apiClient.post('/auth/login/access-token', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data; // { access_token, token_type }
  },

  /**
   * Store token and user details in localStorage
   */
  setSession: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },

  /**
   * Clear session
   */
  clearSession: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  /**
   * Get currently cached user from localStorage
   */
  getCurrentUser: () => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  /**
   * Get active token
   */
  getToken: () => {
    return localStorage.getItem('token');
  },

  /**
   * Check if token exists
   */
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  }
};
