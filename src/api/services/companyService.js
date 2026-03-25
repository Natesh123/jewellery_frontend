import api from '../apiConfig/apiClient';
import { companyEndpoints } from '../apiConstants';

export const createCompany = async (companyData) => {
  try {
    const formData = new FormData();
    
    // Append company fields
    formData.append('company_name', companyData.company_name);
    formData.append('company_code', companyData.company_code);
    formData.append('gst_no', companyData.gst_no);
    formData.append('address1', companyData.address1);
    formData.append('address2', companyData.address2 || '');
    formData.append('area', companyData.area);
    formData.append('city', companyData.city);
    formData.append('pincode', companyData.pincode);
    formData.append('district', companyData.district);
    formData.append('state', companyData.state);
    formData.append('state_code', companyData.state_code);
    formData.append('phoneno', companyData.phoneno);
    formData.append('email', companyData.email);
    formData.append('turnover', companyData.turnover);
    
    // Append documents
    if (companyData.documents && companyData.documents.length > 0) {
      companyData.documents.forEach((doc, index) => {
        if (doc instanceof File) {
          formData.append(`documents`, doc);
        } else if (doc.originFileObj) {
          formData.append(`documents`, doc.originFileObj);
        }
      });
    }

    console.log('Creating company with data:', formData);
    

    const response = await api.post(companyEndpoints.CREATE, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getCompanies = async (page = 1, limit = 10, filters = {}) => {
  try {
    const params = {
      page,
      limit,
      ...filters
    };
    
    const response = await api.get(companyEndpoints.READALL, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getCompanyById = async (id) => {
  try {
    const endpoint = companyEndpoints.READBYID.replace(':id', id);
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateCompany = async (id, companyData) => {
  try {
    const formData = new FormData();
    
    // Append updated fields
    formData.append('company_name', companyData.company_name);
    
    formData.append('company_code', companyData.company_code);
    formData.append('gst_no', companyData.gst_no);
    formData.append('address1', companyData.address1);
    formData.append('address2', companyData.address2 || '');
    formData.append('area', companyData.area);
    formData.append('city', companyData.city);
    formData.append('pincode', companyData.pincode);
    formData.append('district', companyData.district);
    formData.append('state', companyData.state);
    formData.append('state_code', companyData.state_code);
    formData.append('phoneno', companyData.phoneno);
    formData.append('email', companyData.email);
    formData.append('turnover', companyData.turnover);
    
    // Append new documents
    if (companyData.newDocuments && companyData.newDocuments.length > 0) {
      companyData.newDocuments.forEach((doc, index) => {
        if (doc instanceof File) {
          formData.append(`documents`, doc);
        } else if (doc.originFileObj) {
          formData.append(`documents`, doc.originFileObj);
        }
      });
    }
    
    // Append document IDs to remove
    if (companyData.documentsToRemove && companyData.documentsToRemove.length > 0) {
      formData.append('documentsToRemove', JSON.stringify(companyData.documentsToRemove));
    }

    const endpoint = companyEndpoints.UPDATE.replace(':id', id);
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

export const deleteCompany = async (id) => {
  try {
    const endpoint = companyEndpoints.DELETE.replace(':id', id);
    const response = await api.delete(endpoint);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const searchCompanies = async (query) => {
  try {
    const response = await api.get(companyEndpoints.SEARCH, {
      params: { query }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const filterCompaniesByState = async (state) => {
  try {
    const response = await api.get(companyEndpoints.FILTER_STATE, {
      params: { state }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const filterCompaniesByTurnover = async (turnover) => {
  try {
    const response = await api.get(companyEndpoints.FILTER_TURNOVER, {
      params: { turnover }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};