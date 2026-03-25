// src/api/services/productService.js

import api from '../apiConfig/apiClient';
import { productEndpoints } from '../apiConstants';

export const createProduct = async (productData) => {
  try {
    const response = await api.post(productEndpoints.CREATE, productData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getProducts = async (page = 1, pageSize = 10, filters = {}) => {
  try {
    const response = await api.get(productEndpoints.READALL, {
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

export const getAllProducts = async () => {
  try {
    const response = await api.get(productEndpoints.READALLNOLIMIT);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getProductById = async (id) => {
  try {
    const response = await api.get(productEndpoints.READBYID.replace(':id', id));
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateProduct = async (id, productData) => {
  try {
    const response = await api.put(
      productEndpoints.UPDATE.replace(':id', id),
      productData
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteProduct = async (id) => {
  try {
    const response = await api.delete(productEndpoints.DELETE.replace(':id', id));
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getStatusOptions = async () => {
  try {
    const response = await api.get(productEndpoints.GET_STATUS_OPTIONS);
    return response;
  } catch (error) {
    throw error;
  }
};

export const getMetalOptions = async () => {
  try {
    const response = await api.get(productEndpoints.GET_METAL_OPTIONS);
    return response;
  } catch (error) {
    throw error;
  }
};

export const getCategoryOptions = async () => {
  try {
    const response = await api.get(productEndpoints.GET_CATEGORY_OPTIONS);
    return response;
  } catch (error) {
    throw error;
  }
};

export const getSubProductOptions = async () => {
  try {
    const response = await api.get(productEndpoints.GET_SUBPRODUCT_OPTIONS);
    return response;
  } catch (error) {
    throw error;
  }
};