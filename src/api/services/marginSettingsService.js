import api from '../apiConfig/apiClient';
import { marginSettingsEndPoints } from '../apiConstants'

export const createMarginSettings = async (values) => {
  try {
    const response = await api.post(marginSettingsEndPoints.CREATE, values);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export const getMarginSettingsByRoleId = async (id) => {
  try {
    const endpoint = marginSettingsEndPoints.READ_BY_ROLEID.replace(':role_id', id);
    console.log(endpoint, 'endpoint');
    const response = await api.get(endpoint);
    return response;
  } catch (error) {
    throw error;
  }
}

export const getAllMarginSettings = async () => {
  try {
    const response = await api.get(marginSettingsEndPoints.READALL);
    return response;
  } catch (error) {
    throw error;
  }
};

export const updateMarginSettingsByRoleId = async (id, formData) => {
  try {
    const endpoint = marginSettingsEndPoints.UPDATE_BY_ROLEID.replace(':role_id', id);
    const response = await api.put(endpoint, formData);
    return response.data;
  } catch (error) {
    throw error;
  }
};