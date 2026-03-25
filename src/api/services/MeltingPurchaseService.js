import api from '../apiConfig/apiClient';
import { melting_purchase } from '../apiConstants';

export const createMeltingPurchase = async (pledgeData) => {
  try {
    const response = await api.post(melting_purchase.CREATE, pledgeData);
    return response.data;
  } catch (error) {
    console.error('Error creating pledge:', error.response?.data || error.message);
    throw error;
  }
};

export const createMeltProducts = async (pledgeData) => {
  try {
    const response = await api.post(melting_purchase.CREATE + "create_melt", pledgeData);
    return response.data;
  } catch (error) {
    console.error('Error creating pledge:', error.response?.data || error.message);
    throw error;
  }
};

export const getMeltProducts = async (params = {}) => {
  try {
    const response = await api.get(melting_purchase.CREATE + "create_melts", { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};


export const getAllMeltReceiptProducts = async (params = {}) => {
  try {
    const response = await api.get(melting_purchase.CREATE + "create_melts_receipt", { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};
// Add this to your MeltingPurchaseService if not exists
export const updateMeltProduct = async (id, data) => {
  try {
    const response = await api.put(`${melting_purchase.CREATE}create_melts_update/${id}`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};


// In your purchaseService.js
export const getMeltingPurchase = async (params = {}) => {
  try {
    const response = await api.get(melting_purchase.READ, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAllSmith = async (params = {}) => {
  try {
    const response = await api.get(melting_purchase.CREATE + "all_smith", { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAllMeltReceiptPurchases = async (params = {}) => {
  try {
    const response = await api.get(melting_purchase.READRECEIPT, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};


export const getAllkMeltingPurchases = async (params = {}) => {
  try {
    const response = await api.get(melting_purchase.READ_ACCOUNTS, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getMeltingSalesPayments = async (params = {}) => {
  try {
    const response = await api.get(melting_purchase.GET_SALES_PAYMENT, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createSalesPayment = async (id, data) => {
  try {
    const response = await api.put(`${melting_purchase.CREATE}create_sales_payments/${id}`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updatePurchaseAccountsStatus = async (id, formData) => {
  try {
    const response = await api.put(
      melting_purchase.GETALLACCOUNTS_UPDATE.replace(':accounts_id', id),
      formData
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updatePurchaseMeltStatus = async (id, formData) => {
  try {
    const response = await api.put(
      melting_purchase.GETALLMElt_UPDATE.replace(':id', id),
      formData
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateMeltDetails = async (id, formData) => {
  try {
    const response = await api.put(
      melting_purchase.UPDATE_MELT_DETAILS.replace(':id', id),
      formData
    );

    return response.data;
  } catch (error) {
    throw error;
  }
}

export const updateMeltWages = async (id, formData) => {
  try {
    const response = await api.put(
      melting_purchase.UPDATE_MELT_WAGES.replace(':id', id),
      formData
    );

    return response.data;
  } catch (error) {
    throw error;
  }
}

export const getMeltingWages = async (params = {}) => {
  try {
    const response = await api.get(melting_purchase.WAGES, { params });
    return response;
  } catch (error) {
    throw error;
  }
};

export const updateMeltingWages = async (data) => {
  try {
    const response = await api.post(melting_purchase.WAGES, data);
    return response;
  } catch (error) {
    throw error;
  }
};