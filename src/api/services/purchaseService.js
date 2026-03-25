import api from '../apiConfig/apiClient';
import { purchaseEndpoints } from '../apiConstants';

export const createPurchase = async (formData) => {
  try {
    const response = await api.post(
      purchaseEndpoints.CREATE,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response;
  } catch (error) {
    throw error;
  }
};

// api/services/purchaseService.js
export const getPurchases = async (params = {}) => {
  try {
    const response = await api.get(purchaseEndpoints.GETALL, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAllPurchasesRegional = async () => {
  try {
    const response = await api.get(purchaseEndpoints.GETALLREGIONAL);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getPurchaseById = async (id) => {
  try {
    const response = await api.get(purchaseEndpoints.READBYID.replace(':id', id));
    return response;
  } catch (error) {
    throw error;
  }
};

export const getQuatationCodeById = async (id) => {
  try {
    const response = await api.get(purchaseEndpoints.QREADBYID.replace(':id', id));
    return response;
  } catch (error) {
    throw error;
  }
};

export const updatePurchase = async (id, formData) => {
  try {
    const response = await api.put(
      purchaseEndpoints.UPDATE.replace(':id', id),
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const getAllQuotationsRegionaForPurchases = async () => {
  try {
    const response = await api.get(purchaseEndpoints.GETALLREGIONAL);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAllPurchasesAccounts = async () => {
  try {
    const response = await api.get(purchaseEndpoints.GETALLACCOUNTS);
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const updatePurchaseRegional = async (id, formData) => {
  try {
    const response = await api.put(
      purchaseEndpoints.GETALLREGIONAL_UPDATE.replace(':id', id),
      formData
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updatePurchaseAccountsStatus = async (id, formData) => {
  try {
    const response = await api.put(
      purchaseEndpoints.GETALLACCOUNTS_UPDATE.replace(':id', id),
      formData
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deletePurchase = async (id) => {
  try {
    const response = await api.delete(purchaseEndpoints.DELETE.replace(':id', id));
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const verifyAadhar = async (data) => {
  try {
    const response = await api.post(purchaseEndpoints.VERIFY_AADHAR, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const sendAadharOtp = async (data) => {
  try {
    const response = await api.post(purchaseEndpoints.SEND_AADHAR_OTP, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const generateBarcode = async (purchaseId) => {
  try {
    const response = await api.get(purchaseEndpoints.GENERATE_BARCODE.replace(':id', purchaseId));
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const downloadBarcode = async (purchaseId) => {
  try {
    const response = await api.get(purchaseEndpoints.DOWNLOAD_BARCODE.replace(':id', purchaseId), {
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const searchPurchases = async (query) => {
  try {
    const response = await api.get(purchaseEndpoints.SEARCH, { params: { query } });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const filterPurchases = async (filters) => {
  try {
    const response = await api.get(purchaseEndpoints.FILTER, { params: filters });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const downloadPurchaseBill = async (id) => {
  try {
    const response = await api.get(purchaseEndpoints.DOWNLOAD_BILL.replace(':id', id), {
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};