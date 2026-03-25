export const handleApiError = (error) => {
  if (error.response) {
    const { status, data } = error.response;
    
    switch (status) {
      case 401:
        localStorage.removeItem('adminToken');
        window.location.href = '/login';
        break;
      case 403:
        throw new Error(data.message || 'Forbidden access');
      case 404:
        throw new Error(data.message || 'Resource not found');
      case 500:
        throw new Error(data.message || 'Internal server error');
      default:
        throw new Error(data.message || 'Request failed');
    }
  } else if (error.request) {
    // Request was made but no response received
    throw new Error('Network error - no response from server');
  } else {
    // Something happened in setting up the request
    throw new Error(error.message || 'Request setup error');
  }
};