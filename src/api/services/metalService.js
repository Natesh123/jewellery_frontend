import api from '../apiConfig/apiClient';
import { metalEndpoints } from '../apiConstants';

export const createMetal = async (formData) => {
  try {
    const response = await api.post(metalEndpoints.CREATE, formData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getMetals = async (page = 1, limit = 10, filters = {}) => {
  try {
    const params = {
      page,
      limit,
      ...filters
    };
    
    const response = await api.get(metalEndpoints.READALL, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getMetalById = async (id) => {
  try {
    const endpoint = metalEndpoints.READBYID.replace(':id', id);
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateMetal = async (id, formData) => {
  try {
    const endpoint = metalEndpoints.UPDATE.replace(':id', id);
    const response = await api.put(endpoint, formData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteMetal = async (id) => {
  try {
    const endpoint = metalEndpoints.DELETE.replace(':id', id);
    const response = await api.delete(endpoint);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const searchMetals = async (query) => {
  try {
    const response = await api.get(metalEndpoints.SEARCH, {
      params: { query }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getStatusOptions = async () => {
  try {
    const response = await api.get(metalEndpoints.GET_STATUS_OPTIONS);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getMetalOptions = async () => {
  try {
    const response = await api.get(metalEndpoints.GET_METAL_OPTIONS);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getMetalCount = async () => {
  try {
    const response = await api.get(metalEndpoints.GET_METAL_COUNT);
    return response.data;
  } catch (error) {
    throw error;
  }
};