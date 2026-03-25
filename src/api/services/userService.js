import api from '../apiConfig/apiClient';
import { userEndpoints } from '../apiConstants';

export const createUser = async (formData) => {
  try {
    const response = await api.post(userEndpoints.CREATE, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getUsers = async (page = 1, limit = 10, filters = {}) => {
  try {
    const params = {
      page,
      limit,
      ...filters
    };
    
    const response = await api.get(userEndpoints.READALL, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getUserById = async (id) => {
  try {
    const endpoint = userEndpoints.READBYID.replace(':id', id);
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateUser = async (id, formData) => {
  try {
    const endpoint = userEndpoints.UPDATE.replace(':id', id);
    const response = await api.put(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteUser = async (id) => {
  try {
    const endpoint = userEndpoints.DELETE.replace(':id', id);
    const response = await api.delete(endpoint);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const searchUsers = async (query) => {
  try {
    const response = await api.get(userEndpoints.SEARCH, {
      params: { query }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getRoles = async (page = 1, limit = 10) => {
  try {
    const response = await api.get(userEndpoints.GET_ROLES, {
      params: { page, limit }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getCompanies = async (page = 1, limit = 10) => {
  try {
    const response = await api.get(userEndpoints.GET_COMPANIES, {
      params: { page, limit }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getBranchByCompanyId = async (companyId) => {
  try {
    const endpoint = userEndpoints.GET_BRANCHES_BY_COMPANY.replace(':companyId', companyId);
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getUserCount = async () => {
  try {
    const response = await api.get(userEndpoints.GET_USER_COUNT);
    return response.data;
  } catch (error) {
    throw error;
  }
};