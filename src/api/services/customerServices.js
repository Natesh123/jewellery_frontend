import api from '../apiConfig/apiClient';
import { customerEndpoints } from '../apiConstants';

export const createCustomer = async (customerData) => {
  try {
    const formData = new FormData();
    
    // Append customer fields
    formData.append('customer_name', customerData.customer_name);
    formData.append('customer_id', customerData.customer_id);
    formData.append('aadhar_no', customerData.aadhar_no);
    formData.append('pan_no', customerData.pan_no);
    formData.append('address_1', customerData.address_1);
    formData.append('address_2', customerData.address_2 || '');
    formData.append('area', customerData.area);
    formData.append('city', customerData.city);
    formData.append('pincode', customerData.pincode);
    formData.append('district', customerData.district);
    formData.append('state', customerData.state);
    formData.append('state_code', customerData.state_code);
    formData.append('phoneno', customerData.phoneno);
    formData.append('phoneno2', customerData.phoneno2);
    formData.append('office_address', customerData.office_address || '');
    formData.append('reference_details', customerData.reference_details || '');
    formData.append('remarks', customerData.remarks || '');
    formData.append('has_bank_account', customerData.has_bank_account);
    formData.append('aadhar_verified', customerData.aadhar_verified);
    
    // Append files if they exist
    if (customerData.customer_photo) {
      formData.append('customer_photo', customerData.customer_photo);
    }
    if (customerData.aadhar_photo) {
      formData.append('aadhar_photo', customerData.aadhar_photo);
    }
    if (customerData.pan_photo) {
      formData.append('pan_photo', customerData.pan_photo);
    }

    const response = await api.post(customerEndpoints.CREATE, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getCustomers = async (page = 1, limit = 10, filters = {}) => {
  try {
    const params = {
      page,
      limit,
      ...filters
    };
    
    const response = await api.get(customerEndpoints.READALL, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getCustomerById = async (id) => {
  try {
    const endpoint = customerEndpoints.READBYID.replace(':id', id);
    const response = await api.get(endpoint);
    return response;
  } catch (error) {
    throw error;
  }
};

export const updateCustomer = async (id, customerData) => {
  try {
    const formData = new FormData();
    
    // Append updated fields
    formData.append('customer_name', customerData.customer_name);
    formData.append('customer_id', customerData.customer_id);
    formData.append('aadhar_no', customerData.aadhar_no);
    formData.append('pan_no', customerData.pan_no);
    formData.append('address_1', customerData.address_1);
    formData.append('address_2', customerData.address_2 || '');
    formData.append('area', customerData.area);
    formData.append('city', customerData.city);
    formData.append('pincode', customerData.pincode);
    formData.append('district', customerData.district);
    formData.append('state', customerData.state);
    formData.append('state_code', customerData.state_code);
    formData.append('phoneno', customerData.phoneno);
    formData.append('phoneno2', customerData.phoneno2);
    formData.append('office_address', customerData.office_address || '');
    formData.append('reference_details', customerData.reference_details || '');
    formData.append('remarks', customerData.remarks || '');
    formData.append('has_bank_account', customerData.has_bank_account);
    formData.append('aadhar_verified', customerData.aadhar_verified);
    
    // Append new files if they exist
    if (customerData.customer_photo instanceof File) {
      formData.append('customer_photo', customerData.customer_photo);
    }
    if (customerData.aadhar_photo instanceof File) {
      formData.append('aadhar_photo', customerData.aadhar_photo);
    }
    if (customerData.pan_photo instanceof File) {
      formData.append('pan_photo', customerData.pan_photo);
    }

    const endpoint = customerEndpoints.UPDATE.replace(':id', id);
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

export const deleteCustomer = async (id) => {
  try {
    const endpoint = customerEndpoints.DELETE.replace(':id', id);
    const response = await api.delete(endpoint);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const searchCustomers = async (query) => {
  try {
    const response = await api.get(customerEndpoints.SEARCH, {
      params: { query }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const filterCustomersByState = async (state) => {
  try {
    const response = await api.get(customerEndpoints.FILTER_STATE, {
      params: { state }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const filterCustomersByBankAccount = async (hasAccount) => {
  try {
    const response = await api.get(customerEndpoints.FILTER_BANK_ACCOUNT, {
      params: { hasAccount }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const generateAadharOTP = async (aadharNo) => {
  try {
    const response = await api.post(customerEndpoints.GENERATE_OTP, { aadhar_no: aadharNo });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const verifyAadharOTP = async (aadharNo, otp) => {
  try {
    const response = await api.post(customerEndpoints.VERIFY_AADHAR, { 
      aadhar_no: aadharNo, 
      otp 
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getStatesList = async () => {
  try {
    const response = await api.get(customerEndpoints.STATES_LIST);
    return response.data;
  } catch (error) {
    throw error;
  }
};