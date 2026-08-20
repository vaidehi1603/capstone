import apiClient from './api';

export const analyticsService = {
  /**
   * Fetch live campus overview analytics from backend
   * GET /api/v1/analytics/dashboard
   * Allowed roles: ADMIN, VIEWER
   */
  getDashboardOverview: async () => {
    const response = await apiClient.get('/analytics/dashboard');
    return response.data;
  },
};
