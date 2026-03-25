import apiClient from './apiClient';

export const get = async (url, config = {}) => {
  try {
    return await apiClient.get(url, config);
  } catch (error) {
    throw error;
  }
};

export const post = async (url, data, config = {}) => {
  try {
    return await apiClient.post(url, data, config);
  } catch (error) {
    throw error;
  }
};

export const put = async (url, data, config = {}) => {
  try {
    return await apiClient.put(url, data, config);
  } catch (error) {
    throw error;
  }
};

export const del = async (url, config = {}) => {
  try {
    return await apiClient.delete(url, config);
  } catch (error) {
    throw error;
  }
};

export default {
  get,
  post,
  put,
  delete: del,
};