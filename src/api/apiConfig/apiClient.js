import axios from 'axios';
import { handleApiError } from '../../utils/errorHandler';

// export const API_BASE_URL = 'http://localhost:5000/api';
export const PRINT_BASE_URL = 'http://localhost:7826/';

// export const API_BASE_URL = 'https://r9kj46l6-5000.inc1.devtunnels.ms/api';
// export const API_BASE_URL = 'https://amayagoldpoint.in/api';
export const API_BASE_URL = 'http://localhost:5000/api';


const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json', // Default content type
  },
});

// Request interceptor for auth token and content type handling
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // If the request contains FormData, set the appropriate content type
  if (config.data instanceof FormData) {
    config.headers['Content-Type'] = 'multipart/form-data';
  }

  return config;
});

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    return handleApiError(error);
  }
);

// Helper function to convert object to FormData
export const objectToFormData = (obj, formData = new FormData(), parentKey = '') => {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      const formKey = parentKey ? `${parentKey}[${key}]` : key;

      if (value instanceof File || value instanceof Blob) {
        formData.append(formKey, value);
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        objectToFormData(value, formData, formKey);
      } else if (Array.isArray(value)) {
        value.forEach((item, index) => {
          const arrayKey = `${formKey}[${index}]`;
          if (item instanceof File || item instanceof Blob) {
            formData.append(arrayKey, item);
          } else if (typeof item === 'object' && item !== null) {
            objectToFormData(item, formData, arrayKey);
          } else {
            formData.append(arrayKey, item);
          }
        });
      } else {
        formData.append(formKey, value);
      }
    }
  }
  return formData;
};

export default apiClient;