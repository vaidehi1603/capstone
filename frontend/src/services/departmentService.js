import apiClient from './api';

export const departmentService = {
  /**
   * Fetch all departments
   * GET /api/v1/departments/
   */
  getDepartments: async (skip = 0, limit = 100) => {
    const response = await apiClient.get('/departments/', {
      params: { skip, limit },
    });
    return response.data;
  },

  /**
   * Create a new department (Admin only)
   * POST /api/v1/departments/
   */
  createDepartment: async (departmentData) => {
    const response = await apiClient.post('/departments/', departmentData);
    return response.data;
  },
};
