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

export const createOpeningBalance = async (data) => {
    try {
        const response = await api.post(accountsEndpoints.CREATE_OPENING_BALANCE, data);
        return response;
    } catch (error) {
        console.error('Create opening balance error:', error);
        throw error;
    }
};

export const getAllOpeningBalances = async (data) => {
    try {
        const response = await api.get(accountsEndpoints.READ_OPENING_BALANCE, {
            params: data
        });
        return response;
    } catch (error) {
        console.error('Get opening balances error:', error);
        throw error;
    }
};

export const updateOpeningBalance = async (id, data) => {
    try {
        const response = await api.put(`${accountsEndpoints.UPDATE_OPENING_BALANCE}/${id}`, data);
        return response;
    } catch (error) {
        console.error('Update opening balance error:', error);
        throw error;
    }
};

export const deleteOpeningBalance = async (id) => {
    try {
        const response = await api.delete(`${accountsEndpoints.DELETE_OPENING_BALANCE}/${id}`);
        return response;
    } catch (error) {
        console.error('Delete opening balance error:', error);
        throw error;
    }
};

export const createOpeningStock = async (data) => {
    try {
        const response = await api.post(accountsEndpoints.CREATE_OPENING_STOCK, data);
        return response;
    } catch (error) {
        console.error('Create opening stock error:', error);
        throw error;
    }
};

export const getAllOpeningStocks = async (data) => {
    try {
        const response = await api.get(accountsEndpoints.READ_OPENING_STOCK, {
            params: data
        });
        return response;
    } catch (error) {
        console.error('Get opening stocks error:', error);
        throw error;
    }
};

export const updateOpeningStock = async (id, data) => {
    try {
        const response = await api.put(`${accountsEndpoints.UPDATE_OPENING_STOCK}/${id}`, data);
        return response;
    } catch (error) {
        console.error('Update opening stock error:', error);
        throw error;
    }
};

export const deleteOpeningStock = async (id) => {
    try {
        const response = await api.delete(`${accountsEndpoints.DELETE_OPENING_STOCK}/${id}`);
        return response;
    } catch (error) {
        console.error('Delete opening stock error:', error);
        throw error;
    }
};