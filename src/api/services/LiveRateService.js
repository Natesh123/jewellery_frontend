import api from '../apiConfig/apiClient';
import { LiveRateEndPoints } from '../apiConstants';

export const getLiveRate = async () => {
  try {    
    const response = await api.get(LiveRateEndPoints.READALL);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateLiveRate = async (id, formData) => {
  try {
    const endpoint = LiveRateEndPoints.UPDATE.replace(':id', id);
    const response = await api.put(endpoint, formData);
    return response.data;
  } catch (error) {
    throw error;
  }
};