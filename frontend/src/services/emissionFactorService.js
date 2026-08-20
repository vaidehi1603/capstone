import apiClient from './api';

export const emissionFactorService = {
  /**
   * Fetch all registered carbon emission factors
   * GET /api/v1/emission-factors/
   */
  getEmissionFactors: async (skip = 0, limit = 100) => {
    const response = await apiClient.get('/emission-factors/', {
      params: { skip, limit },
    });
    return response.data;
  },

  /**
   * Create new emission factor (Admin only)
   * POST /api/v1/emission-factors/
   */
  createEmissionFactor: async (payload) => {
    const response = await apiClient.post('/emission-factors/', payload);
    return response.data;
  },
};
