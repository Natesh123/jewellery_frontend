import api from '../apiConfig/apiClient';
import { customerBankEndpoints } from '../apiConstants';

export const createBankAccount = async (customerId, bankData) => {
  try {
    const formData = new FormData();
    
    // Append bank account fields
    formData.append('customer_id', customerId);
    formData.append('bank_name', bankData.bank_name);
    formData.append('account_number', bankData.account_number);
    formData.append('ifsc_code', bankData.ifsc_code);
    formData.append('branch_name', bankData.branch_name);
    formData.append('account_type', bankData.account_type);
    formData.append('is_primary', bankData.is_primary);
    
    // Append documents
    if (bankData.documents && bankData.documents.length > 0) {
      bankData.documents.forEach((doc, index) => {
        if (doc instanceof File) {
          formData.append(`documents`, doc);
        }
      });
    }

    const response = await api.post(
      customerBankEndpoints.CREATE, 
      formData, 
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getBankAccountsByCustomer = async (customerId) => {
  try {
    const endpoint = customerBankEndpoints.READBYCUSTOMER.replace(':customerId', customerId);
    const response = await api.get(endpoint);
    return response;
  } catch (error) {
    throw error;
  }
};

export const getBankAccountById = async (id) => {
  try {
    const endpoint = customerBankEndpoints.READBYID.replace(':id', id);
    const response = await api.get(endpoint);
    return response;
  } catch (error) {
    throw error;
  }
};

export const updateBankAccount = async (id, bankData) => {
  try {
    const formData = new FormData();
    
    // Append updated fields
    formData.append('bank_name', bankData.bank_name);
    formData.append('account_number', bankData.account_number);
    formData.append('ifsc_code', bankData.ifsc_code);
    formData.append('branch_name', bankData.branch_name);
    formData.append('account_type', bankData.account_type);
    formData.append('is_primary', bankData.is_primary);
    
    // Append new documents
    if (bankData.newDocuments && bankData.newDocuments.length > 0) {
      bankData.newDocuments.forEach((doc, index) => {
        if (doc instanceof File) {
          formData.append(`documents`, doc);
        }
      });
    }
    
    // Append document IDs to remove
    if (bankData.documentsToRemove && bankData.documentsToRemove.length > 0) {
      formData.append('documentsToRemove', JSON.stringify(bankData.documentsToRemove));
    }

    const endpoint = customerBankEndpoints.UPDATE.replace(':id', id);
    const response = await api.put(endpoint, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteBankAccount = async (id) => {
  try {
    const endpoint = customerBankEndpoints.DELETE.replace(':id', id);
    const response = await api.delete(endpoint);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const searchBankAccounts = async (query) => {
  try {
    const response = await api.get(customerBankEndpoints.SEARCH, {
      params: { query }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const filterBankAccountsByBank = async (bankName) => {
  try {
    const response = await api.get(customerBankEndpoints.FILTER_BANK, {
      params: { bankName }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const setPrimaryBankAccount = async (id) => {
  try {
    const endpoint = customerBankEndpoints.PRIMARY.replace(':id', id);
    const response = await api.patch(endpoint);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAllBankAccounts = async () => {
  try {
    const endpoint = customerBankEndpoints.GETALLBANKACCOUNTS;
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    throw error;
  }
};