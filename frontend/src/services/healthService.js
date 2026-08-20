import apiClient from './api';

export const healthService = {
  /**
   * Check backend API server health
   * GET /api/v1/health
   */
  checkHealth: async () => {
    try {
      const response = await apiClient.get('/health');
      return response.data;
    } catch (error) {
      return { success: false, message: error.message || 'Backend unreachable' };
    }
  },

  /**
   * Check backend PostgreSQL database connection health
   * GET /api/v1/health/database
   */
  checkDatabaseHealth: async () => {
    try {
      const response = await apiClient.get('/health/database');
      return response.data;
    } catch (error) {
      return { success: false, message: error.message || 'Database unreachable' };
    }
  }
};
