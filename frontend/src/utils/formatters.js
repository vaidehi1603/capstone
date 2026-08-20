/**
 * Format numbers with commas and fixed decimals
 */
export const formatNumber = (val, decimals = 1) => {
  if (val === null || val === undefined || isNaN(val)) return '0.0';
  return Number(val).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

/**
 * Format kgCO2e to appropriate units (kgCO2e or Metric Tons CO2e)
 */
export const formatCarbon = (kgCo2e) => {
  if (kgCo2e === null || kgCo2e === undefined || isNaN(kgCo2e)) return '0.0 kg CO₂e';
  const val = Number(kgCo2e);
  if (val >= 1000) {
    return `${formatNumber(val / 1000, 2)} t CO₂e`;
  }
  return `${formatNumber(val, 1)} kg CO₂e`;
};

/**
 * Format timestamp to user readable date
 */
export const formatDate = (isoString, includeTime = false) => {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return String(isoString);
    
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {})
    };
    return d.toLocaleDateString('en-US', options);
  } catch {
    return String(isoString);
  }
};

/**
 * Extract human readable error string from Axios/FastAPI error object
 */
export const extractErrorMessage = (error) => {
  if (!error) return 'An unexpected error occurred.';
  if (typeof error === 'string') return error;
  
  if (error.response) {
    const data = error.response.data;
    if (data) {
      if (typeof data.detail === 'string') {
        return data.detail;
      }
      if (Array.isArray(data.detail)) {
        // FastAPI Pydantic 422 error list
        return data.detail.map(item => `${item.loc?.join('.') || 'Field'}: ${item.msg}`).join(', ');
      }
      if (data.message) {
        return data.message;
      }
    }
    if (error.response.status === 401) return 'Your session has expired. Please log in again.';
    if (error.response.status === 403) return 'You do not have permission to perform this action.';
    if (error.response.status === 404) return 'The requested resource was not found.';
    if (error.response.status === 500) return 'Internal server error occurred on the backend.';
  }

  if (error.message === 'Network Error') {
    return 'Cannot connect to backend server. Make sure FastAPI is running on http://localhost:8000.';
  }

  return error.message || 'An unexpected error occurred.';
};
