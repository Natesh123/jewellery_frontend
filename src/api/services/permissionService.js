import api from '../apiConfig/apiClient';
import { permissionEndpoints } from '../apiConstants';

export const createRolePermission = async (permissionData) => {
  try {
    const response = await api.post(permissionEndpoints.CREATE, permissionData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAllRolePermissions = async (page = 1, limit = 10, filters = {}) => {
  try {
    const params = {
      page,
      limit,
      ...filters
    };
    
    const response = await api.get(permissionEndpoints.READALL, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getRolePermissionById = async (id) => {
  try {
    const endpoint = permissionEndpoints.READBYID.replace(':id', id);
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateRolePermission = async (id, permissionData) => {
  try {
    const endpoint = permissionEndpoints.UPDATE.replace(':id', id);
    const response = await api.put(endpoint, permissionData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteRolePermission = async (id) => {
  try {
    const endpoint = permissionEndpoints.DELETE.replace(':id', id);
    const response = await api.delete(endpoint);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const searchRolePermissions = async (query) => {
  try {
    const response = await api.get(permissionEndpoints.SEARCH, {
      params: { query }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getPermissionsByRole = async (roleId) => {
  try {
    const endpoint = permissionEndpoints.GET_BY_ROLE.replace(':roleId', roleId);
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    throw error;
  }
};