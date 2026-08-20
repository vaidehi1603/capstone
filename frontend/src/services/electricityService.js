import apiClient from './api';

export const electricityService = {
  /**
   * Fetch electricity activity data records
   * GET /api/v1/electricity/
   */
  getElectricityData: async (skip = 0, limit = 100) => {
    const response = await apiClient.get('/electricity/', {
      params: { skip, limit },
    });
    return response.data;
  },

  /**
   * Create electricity activity record (Admin / Maintenance)
   * Automatically triggers synchronous backend Scope 2 carbon calculation
   * POST /api/v1/electricity/
   */
  createElectricityData: async (payload) => {
    const response = await apiClient.post('/electricity/', payload);
    return response.data;
  },
};
