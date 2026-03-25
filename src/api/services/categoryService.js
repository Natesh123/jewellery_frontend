import api from '../apiConfig/apiClient';
import { categoryEndpoints } from '../apiConstants';

export const createCategory = async (formData) => {
  try {
    const response = await api.post(categoryEndpoints.CREATE, formData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getCategories = async (page = 1, limit = 10, filters = {}) => {
  try {
    const params = {
      page,
      limit,
      ...filters
    };
    
    const response = await api.get(categoryEndpoints.READALL, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getCategoryById = async (id) => {
  try {
    const endpoint = categoryEndpoints.READBYID.replace(':id', id);
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateCategory = async (id, formData) => {
  try {
    const endpoint = categoryEndpoints.UPDATE.replace(':id', id);
    const response = await api.put(endpoint, formData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteCategory = async (id) => {
  try {
    const endpoint = categoryEndpoints.DELETE.replace(':id', id);
    const response = await api.delete(endpoint);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const searchCategories = async (query) => {
  try {
    const response = await api.get(categoryEndpoints.SEARCH, {
      params: { query }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getStatusOptions = async () => {
  try {
    const response = await api.get(categoryEndpoints.GET_STATUS_OPTIONS);
    return response;
  } catch (error) {
    throw error;
  }
};

export const getMetalOptions = async () => {
  try {
    const response = await api.get(categoryEndpoints.GET_METAL_OPTIONS);
    return response;
  } catch (error) {
    throw error;
  }
};

export const getTaxOptions = async () => {
  try {
    const response = await api.get(categoryEndpoints.GET_TAX_OPTIONS);
    return response;
  } catch (error) {
    throw error;
  }
};

export const getNextCategoryCode = async (metalId, taxType) => {
  try {
    const response = await api.get(categoryEndpoints.GET_NEXT_CODE, {
      params: { metalId, taxType }
    });
    return response;
  } catch (error) {
    throw error;
  }
};

export const generateCategoryName = async (metalId, taxType) => {
  try {
    const response = await api.get(categoryEndpoints.GENERATE_NAME, {
      params: { metalId, taxType }
    });
    return response;
  } catch (error) {
    throw error;
  }
};