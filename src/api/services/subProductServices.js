import api from '../apiConfig/apiClient';
import { subProductEndpoints } from '../apiConstants';

export const createSubProduct = async (subProductData) => {
  try {
    const response = await api.post(subProductEndpoints.CREATE, subProductData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getSubProducts = async (page = 1, pageSize = 100000, filters = {}) => {
  try {
    const response = await api.get(subProductEndpoints.READALL, {
      params: {
        page,
        limit: pageSize,
        ...filters
      }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAllSubProducts = async () => {
  try {
    const response = await api.get(subProductEndpoints.READALLNOLIMIT);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getSubProductById = async (id) => {
  try {
    const response = await api.get(subProductEndpoints.READBYID.replace(':id', id));
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateSubProduct = async (id, subProductData) => {
  try {
    const response = await api.put(
      subProductEndpoints.UPDATE.replace(':id', id),
      subProductData
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteSubProduct = async (id) => {
  try {
    const response = await api.delete(subProductEndpoints.DELETE.replace(':id', id));
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const searchSubProducts = async (query) => {
  try {
    const response = await api.get(subProductEndpoints.SEARCH, {
      params: { query }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getStatusOptions = async () => {
  try {
    const response = await api.get(subProductEndpoints.GET_STATUS_OPTIONS);
    return response;
  } catch (error) {
    throw error;
  }
};

export const getProductOptions = async () => {
  try {
    const response = await api.get(subProductEndpoints.GET_PRODUCT_OPTIONS);
    return response;
  } catch (error) {
    throw error;
  }
};