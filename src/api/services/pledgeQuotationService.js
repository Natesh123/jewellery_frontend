import api from '../apiConfig/apiClient';
import { pledgeQuotationEndpoints } from '../apiConstants';

export const createQuotation = async (customerId, formData) => {
  try {
    const response = await api.post(
      pledgeQuotationEndpoints.CREATE.replace(':customerId', customerId),
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getPledgeQuotations = async () => {
  try {
    const response = await api.get(pledgeQuotationEndpoints.GETALL);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAllFinalQuotations = async (params = {}) => {
  try {
    // Build query string from parameters
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.search) queryParams.append('search', params.search);
    if (params.metal) queryParams.append('metal', params.metal);
    if (params.status) queryParams.append('status', params.status);
    if (params.start_date) queryParams.append('start_date', params.start_date);
    if (params.end_date) queryParams.append('end_date', params.end_date);
    
    const queryString = queryParams.toString();
    const url = queryString 
      ? `${pledgeQuotationEndpoints.GETFinalALL}?${queryString}`
      : pledgeQuotationEndpoints.GETFinalALL;
    
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching quotations:', error);
    throw error;
  }
};



export const getAllQuotationsForPurchase = async () => {
  try {
    const response = await api.get(pledgeQuotationEndpoints.GETALLQUOTATION);
    return response.data;
  } catch (error) {
    throw error;
  }
};






export const getMCXRatesAll = async () => {
  try {
    const response = await api.get(pledgeQuotationEndpoints.GETALLMCXRATE);
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const updateMCXRateData = async (id, formData) => {
  try {
    const endpoint = pledgeQuotationEndpoints.UPDATEMCXRATE.replace(':id', id);
    const response = await api.put(endpoint, formData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteMCXRateData = async (id) => {
  try {
    const endpoint = pledgeQuotationEndpoints.UPDATEMCXRATE.replace(':id', id);
    const response = await api.delete(endpoint);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getPledgeQuotationById = async (id) => {
  try {
    const endpoint = pledgeQuotationEndpoints.READBYID.replace(':id', id);
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getPledgeFinalQuotationById = async (id) => {
  try {
    const endpoint = pledgeQuotationEndpoints.READBYIDFINAL.replace(':id', id);
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateQuotation = async (id, formData) => {
  try {
    const endpoint = pledgeQuotationEndpoints.UPDATE.replace(':id', id);
    const response = await api.put(endpoint, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteQuotation = async (id) => {
  try {
    const endpoint = pledgeQuotationEndpoints.DELETE.replace(':id', id);
    const response = await api.delete(endpoint);
    return response.data;
  } catch (error) {
    throw error;
  }
};






export const generateQuotationPDF = async (id) => {
  const endpoint = pledgeQuotationEndpoints.GENERATE_PDF.replace(':id', id);

  try {
    const response = await api.get(endpoint, {
      responseType: 'blob',
      validateStatus: status => status < 500,
    });

    // Check if response is valid
    if (!response) {
      throw new Error('No PDF data received');
    }

    const pdfBlob = new Blob([response], { type: 'application/pdf' });
    const pdfUrl = URL.createObjectURL(pdfBlob);

    // Try to open in new tab first
    const newWindow = window.open(pdfUrl, '_blank');
    if (!newWindow) {
      // Fallback to download
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `quotation_${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup after download
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(pdfUrl);
      }, 100);
    } else {
      // Cleanup after window closes (best effort)
      newWindow.onload = () => {
        setTimeout(() => URL.revokeObjectURL(pdfUrl), 5000);
      };
    }
  } catch (error) {
    console.error('PDF handling error:', error);
    throw error;
  }
};









export const searchQuotations = async (query) => {
  try {
    const response = await api.get(pledgeQuotationEndpoints.SEARCH, {
      params: { query }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const filterQuotations = async (filters) => {
  try {
    const response = await api.get(pledgeQuotationEndpoints.FILTER, {
      params: filters
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getMCXRates = async () => {
  try {
    const response = await api.get(pledgeQuotationEndpoints.MCX_RATES);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Margin Approval Functions
export const requestMarginApproval = async (quotationId, userId, { old_margin, new_margin, reason }) => {
  try {
    const response = await api.post(
      pledgeQuotationEndpoints.REQUEST_APPROVAL.replace(':quotationId', quotationId),
      {
        requested_by: userId,
        old_margin,
        new_margin,
        reason
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const approveMarginChange = async (approvalId, approverId, approvalNotes) => {
  try {
    const response = await api.put(
      pledgeQuotationEndpoints.APPROVE_MARGIN.replace(':approvalId', approvalId),
      {
        approved_by: approverId,
        approval_notes: approvalNotes
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const rejectMarginChange = async (approvalId, approverId, rejectionReason) => {
  try {
    const response = await api.put(
      pledgeQuotationEndpoints.REJECT_MARGIN.replace(':approvalId', approvalId),
      {
        approved_by: approverId,
        rejection_reason: rejectionReason
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getPendingApprovals = async () => {
  try {
    const response = await api.get(pledgeQuotationEndpoints.PENDING_APPROVALS);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getApprovalHistory = async (quotationId) => {
  try {
    const response = await api.get(
      pledgeQuotationEndpoints.APPROVAL_HISTORY.replace(':quotationId', quotationId)
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};