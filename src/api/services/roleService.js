import api from '../apiConfig/apiClient';
import { roleEndpoints } from '../apiConstants';

export const createRole = async (roleData) => {
  try {
    const response = await api.post(roleEndpoints.CREATE, roleData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getRoles = async (page = 1, limit = 10, filters = {}) => {
  try {
    const params = {
      page,
      limit,
      ...filters
    };
    
    const response = await api.get(roleEndpoints.READALL, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getRoleById = async (id) => {
  try {
    const endpoint = roleEndpoints.READBYID.replace(':id', id);
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateRole = async (id, roleData) => {
  try {
    const endpoint = roleEndpoints.UPDATE.replace(':id', id);
    const response = await api.put(endpoint, roleData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteRole = async (id) => {
  try {
    const endpoint = roleEndpoints.DELETE.replace(':id', id);
    const response = await api.delete(endpoint);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const searchRoles = async (query) => {
  try {
    const response = await api.get(roleEndpoints.SEARCH, {
      params: { query }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const filterRolesByStatus = async (status) => {
  try {
    const response = await api.get(roleEndpoints.FILTER_STATUS, {
      params: { status }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};