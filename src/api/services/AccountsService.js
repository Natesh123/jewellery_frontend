import api from '../apiConfig/apiClient';
import { accountsEndpoints } from '../apiConstants';

export const createMasterGroup = async (data) => {
  try {
    const response =await api.post(accountsEndpoints.CREATE_MASTER,data);
    return response
  } catch (error) {
    console.error('Logout error:', error);
  }
};

export const getMasterGroup = async (data) => {
    try {
        const response = await api.get(accountsEndpoints.READ_MASTER, {
            params: data 
        });
        return response; 
    } catch (error) {
        console.error('Get master group error:', error);
        throw error; 
    }
};

export const createAccountHead = async (data) => {
    try {
      const response =await api.post(accountsEndpoints.CREATE_ACCOUNT_HEAD,data);
      return response
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  
  export const getAllAccountHeads = async (data) => {
      try {
          const response = await api.get(accountsEndpoints.READ_ACCOUNT_HEAD, {
              params: data 
          });
          return response; 
      } catch (error) {
          console.error('Get master group error:', error);
          throw error; 
      }
  };

  export const createReceipt = async (data) => {
    try {
      const response =await api.post(accountsEndpoints.CREATE_RECEIPT,data);
      return response
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  
  export const getAllReceipts = async (data) => {
      try {
          const response = await api.get(accountsEndpoints.READ_RECEIPT);
          return response; 
      } catch (error) {
          console.error('Get master group error:', error);
          throw error; 
      }
  };

  export const createState = async (data) => {
    try {
      const response = await api.post(accountsEndpoints.CREATE_STATE, data);
      return response;
    } catch (error) {
      console.error('Create state error:', error);
      throw error;
    }
  };
  
  export const getAllState = async (data) => {
    try {
      const response = await api.get(accountsEndpoints.GET_STATE, {
        params: data 
      });
      return response; 
    } catch (error) {
      console.error('Get states error:', error);
      throw error; 
    }
  };