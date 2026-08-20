import apiClient from './api';

export const analyticsService = {
  /**
   * Fetch live campus overview analytics from backend
   * GET /api/v1/analytics/dashboard?mode=VESIT_ACTUAL
   */
  getDashboardOverview: async (mode = 'VESIT_ACTUAL') => {
    const response = await apiClient.get('/analytics/dashboard', {
      params: { mode }
    });
    return response.data;
  },

  /**
   * Fetch official VESIT monthly electricity timeline (2022-2026)
   */
  getVesitHistory: async (year = null, wing = 'ALL') => {
    const params = {};
    if (year) params.year = year;
    if (wing && wing !== 'ALL') params.wing = wing;
    const response = await apiClient.get('/analytics/vesit/history', { params });
    return response.data;
  },

  /**
   * Fetch official VESIT annual carbon trend (2022-2026) with YoY % comparisons
   */
  getVesitAnnualTrends: async () => {
    const response = await apiClient.get('/analytics/vesit/annual-trends');
    return response.data;
  },

  /**
   * Fetch official VESIT electrical appliance inventory & energy estimates
   */
  getVesitAppliances: async () => {
    const response = await apiClient.get('/analytics/vesit/appliances');
    return response.data;
  },
};

