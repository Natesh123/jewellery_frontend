import api from '../apiConfig/apiClient';
import { purityEndpoints } from '../apiConstants';

export const createPurity = async (formData) => {
  try {
    const response = await api.post(purityEndpoints.CREATE, formData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getPurities = async (page = 1, limit = 10, filters = {}) => {
  try {
    const params = {
      page,
      limit,
      ...filters
    };
    
    const response = await api.get(purityEndpoints.READALL, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getPurityById = async (id) => {
  try {
    const endpoint = purityEndpoints.READBYID.replace(':id', id);
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updatePurity = async (id, formData) => {
  try {
    const endpoint = purityEndpoints.UPDATE.replace(':id', id);
    const response = await api.put(endpoint, formData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deletePurity = async (id) => {
  try {
    const endpoint = purityEndpoints.DELETE.replace(':id', id);
    const response = await api.delete(endpoint);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const searchPurities = async (query) => {
  try {
    const response = await api.get(purityEndpoints.SEARCH, {
      params: { query }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getStatusOptions = async () => {
  try {
    const response = await api.get(purityEndpoints.GET_STATUS_OPTIONS);
    return response || []; // Ensure we always return an array
  } catch (error) {
    console.error('Error getting status options:', error);
    return []; // Return empty array on error
  }
};

export const getMetalOptions = async () => {
  try {
    const response = await api.get(purityEndpoints.GET_METAL_OPTIONS);
    return response || []; // Ensure we always return an array
  } catch (error) {
    console.error('Error getting metal options:', error);
    return []; // Return empty array on error
  }
};

export const getPurityStandards = async () => {
  try {
    const response = await api.get(purityEndpoints.GET_PURITY_STANDARDS);
    return response || []; // Ensure we always return an array
  } catch (error) {
    console.error('Error getting purity standards:', error);
    return []; // Return empty array on error
  }
};



export const getPurityCount = async () => {
  try {
    const response = await api.get(purityEndpoints.GET_PURITY_COUNT);
    return response.data || { count: 0 }; // Ensure we always return an object
  } catch (error) {
    console.error('Error getting purity count:', error);
    return { count: 0 }; // Return default count on error
  }
};