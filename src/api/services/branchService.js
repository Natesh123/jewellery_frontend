// branchServices.js
import api from '../apiConfig/apiClient';
import { branchEndpoints } from '../apiConstants';

export const createBranch = async (branchData) => {
  try {
    const formData = new FormData();
    
    // Append branch fields
    formData.append('company_id', branchData.company_id);
    formData.append('company_name', branchData.company_name);
    formData.append('branch_name', branchData.branch_name);
    formData.append('branch_id', branchData.branch_id);
    formData.append('address1', branchData.address1);
    formData.append('address2', branchData.address2 || '');
    formData.append('area', branchData.area);
    formData.append('city', branchData.city);
    formData.append('pincode', branchData.pincode);
    formData.append('district', branchData.district);
    formData.append('state', branchData.state);
    formData.append('state_code', branchData.state_code);
    formData.append('phoneno', branchData.phoneno);
    formData.append('email', branchData.email);
    
    // Append documents
    if (branchData.documents && branchData.documents.length > 0) {
      branchData.documents.forEach((doc, index) => {
        if (doc instanceof File) {
          formData.append(`documents`, doc);
        } else if (doc.originFileObj) {
          formData.append(`documents`, doc.originFileObj);
        }
      });
    }

    const response = await api.post(branchEndpoints.CREATE, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getBranches = async (page = 1, limit = 10, filters = {}) => {
  try {
    const params = {
      page,
      limit,
      ...filters
    };
    
    const response = await api.get(branchEndpoints.READALL, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getBranchById = async (id) => {
  try {
    const endpoint = branchEndpoints.READBYID.replace(':id', id);
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getBranchByCompanyId = async (id) => {
  try {
    const endpoint = branchEndpoints.READBYCOMID.replace(':companyId', id);
    const response = await api.get(endpoint);
    return response;
  } catch (error) {
    throw error;
  }
};

export const updateBranch = async (id, branchData) => {
  try {
    const formData = new FormData();
    
    // Append updated fields
    formData.append('company_id', branchData.company_id);
    formData.append('company_name', branchData.company_name);
    formData.append('branch_name', branchData.branch_name);
    formData.append('branch_id', branchData.branch_id);
    formData.append('address1', branchData.address1);
    formData.append('address2', branchData.address2 || '');
    formData.append('area', branchData.area);
    formData.append('city', branchData.city);
    formData.append('pincode', branchData.pincode);
    formData.append('district', branchData.district);
    formData.append('state', branchData.state);
    formData.append('state_code', branchData.state_code);
    formData.append('phoneno', branchData.phoneno);
    formData.append('email', branchData.email);
    
    // Append new documents
    if (branchData.newDocuments && branchData.newDocuments.length > 0) {
      branchData.newDocuments.forEach((doc, index) => {
        if (doc instanceof File) {
          formData.append(`documents`, doc);
        } else if (doc.originFileObj) {
          formData.append(`documents`, doc.originFileObj);
        }
      });
    }
    
    // Append document IDs to remove
    if (branchData.documentsToRemove && branchData.documentsToRemove.length > 0) {
      formData.append('documentsToRemove', JSON.stringify(branchData.documentsToRemove));
    }

    const endpoint = branchEndpoints.UPDATE.replace(':id', id);
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

export const deleteBranch = async (id) => {
  try {
    const endpoint = branchEndpoints.DELETE.replace(':id', id);
    const response = await api.delete(endpoint);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const searchBranches = async (query) => {
  try {
    const response = await api.get(branchEndpoints.SEARCH, {
      params: { query }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const filterBranchesByState = async (state) => {
  try {
    const response = await api.get(branchEndpoints.FILTER_STATE, {
      params: { state }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const filterBranchesByCompany = async (companyId) => {
  try {
    const response = await api.get(branchEndpoints.FILTER_COMPANY, {
      params: { companyId }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getCompanies = async () => {
  try {
    const response = await api.get(branchEndpoints.GET_COMPANIES);
    return response.data;
  } catch (error) {
    throw error;
  }
};