import api from '../apiConfig/apiClient';
import { pledgeItemsEndpoints } from '../apiConstants';

const createPledge = async (pledgeData) => {
  try {
    const response = await api.post(pledgeItemsEndpoints.CREATE, pledgeData);
    return response.data;
  } catch (error) {
    console.error('Error creating pledge:', error.response?.data || error.message);
    throw error;
  }
};

const getOfficeExecutive = async () => {
  try {
    const response = await api.get(pledgeItemsEndpoints.EXECUTIVE);
    return response.data;
  } catch (error) {
    console.error('Error creating pledge:', error.response?.data || error.message);
    throw error;
  }
};

const getAllUpdateManager = async () => {
  try {
    const response = await api.get(pledgeItemsEndpoints.MANAGER);
    return response.data;
  } catch (error) {
    console.error('Error creating pledge:', error.response?.data || error.message);
    throw error;
  }
};

const getPledges = async (page, limit, filters = {}) => {
  try {
    const response = await api.get(pledgeItemsEndpoints.READALLLIST, {
      params: {
        page,
        limit,
        ...filters
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching pledges:', error.response?.data || error.message);
    throw error;
  }
};

const updatePledge = async (pledgeId, updateData) => {
  try {
    const response = await api.put(
      pledgeItemsEndpoints.UPDATE.replace(':id', pledgeId),
      updateData
    );
    return response.data;
  } catch (error) {
    console.error('Error updating pledge:', error.response?.data || error.message);
    throw error;
  }
};


const updateMoneyRequest = async (pledgeId, updateData) => {
  try {
    const response = await api.put(
      pledgeItemsEndpoints.MONEY_REQUEST.replace(':id', pledgeId),
      updateData
    );
    return response.data;
  } catch (error) {
    console.error('Error updating pledge:', error.response?.data || error.message);
    throw error;
  }
};

const updateSalesExecutive = async (pledgeId, updateData) => {
  try {
    const response = await api.put(
      pledgeItemsEndpoints.ASSIGN_SALES_EXECUTIVE.replace(':id', pledgeId),
      updateData
    );
    return response.data;
  } catch (error) {
    console.error('Error updating pledge:', error.response?.data || error.message);
    throw error;
  }
};

const assigneExecutive = async (pledgeId, updateData) => {
  try {
    const response = await api.put(
      pledgeItemsEndpoints.ASSIGN.replace(':id', pledgeId),
      updateData
    );
    return response.data;
  } catch (error) {
    console.error('Error updating pledge:', error.response?.data || error.message);
    throw error;
  }
};

const assigneRegigonalApproval = async (pledgeId, updateData) => {
  try {
    const response = await api.put(
      pledgeItemsEndpoints.ASSIGNRegional.replace(':id', pledgeId),
      updateData
    );
    return response.data;
  } catch (error) {
    console.error('Error updating pledge:', error.response?.data || error.message);
    throw error;
  }
};

const assignAccountsApproval = async (pledgeId, updateData) => {
  try {
    const response = await api.put(
      pledgeItemsEndpoints.ACCOUNTSAPPROVAL_REQUEST.replace(':id', pledgeId),
      updateData
    );
    return response.data;
  } catch (error) {
    console.error('Error updating pledge:', error.response?.data || error.message);
    throw error;
  }
};

const updateExecutive = async (pledgeId, updateData) => {
  try {
    const response = await api.put(
      pledgeItemsEndpoints.STATUS.replace(':id', pledgeId),
      updateData
    );
    return response.data;
  } catch (error) {
    console.error('Error updating pledge:', error.response?.data || error.message);
    throw error;
  }
};
const updateAccountRequest = async (pledgeId, updateData) => {
  try {
    const response = await api.put(
      pledgeItemsEndpoints.ACCOUNTS_REQUEST.replace(':id', pledgeId),
      updateData
    );
    return response.data;
  } catch (error) {
    console.error('Error updating pledge:', error.response?.data || error.message);
    throw error;
  }
};

const updateCollectionRequest = async (pledgeId, updateData) => {
  try {
    const response = await api.put(
      pledgeItemsEndpoints.COLLECTION_REQUEST.replace(':id', pledgeId),
      updateData
    );
    return response.data;
  } catch (error) {
    console.error('Error updating pledge:', error.response?.data || error.message);
    throw error;
  }
};

const updateBankCollectionRequest = async (pledgeId, updateData) => {
  try {
    const response = await api.put(
      pledgeItemsEndpoints.BANK_COLLECTION_REQUEST.replace(':id', pledgeId),
      updateData
    );
    return response.data;
  } catch (error) {
    console.error('Error updating pledge:', error.response?.data || error.message);
    throw error;
  }
};

const updateFinanceInstituteRequest = async (pledgeId, updateData) => {
  try {
    const response = await api.put(
      pledgeItemsEndpoints.FINANCE_INSTITUTE_REQUEST.replace(':id', pledgeId),
      updateData
    );
    return response.data;
  } catch (error) {
    console.error('Error updating pledge:', error.response?.data || error.message);
    throw error;
  }
};

const updategoldcollectRequest = async (pledgeId, updateData) => {
  try {
    const response = await api.put(
      pledgeItemsEndpoints.GOLD_COLLECT_REQUEST.replace(':id', pledgeId),
      updateData
    );
    return response.data;
  } catch (error) {
    console.error('Error updating pledge:', error.response?.data || error.message);
    throw error;
  }
};

const updateManageApprovalRequest = async (pledgeId, updateData) => {
  try {
    const response = await api.put(
      pledgeItemsEndpoints.MANAGERAPPROVALREQUEST.replace(':id', pledgeId),
      updateData
    );
    return response.data;
  } catch (error) {
    console.error('Error updating pledge:', error.response?.data || error.message);
    throw error;
  }
};

const updateManagerApprovalRequest = async (pledgeId, updateData) => {
  try {
    const response = await api.put(
      pledgeItemsEndpoints.MANGER_APPROVAL_REQUEST.replace(':id', pledgeId),
      updateData
    );
    return response.data;
  } catch (error) {
    console.error('Error updating pledge:', error.response?.data || error.message);
    throw error;
  }
};

const getPledgeById = async (pledgeId) => {
  try {
    const response = await api.get(
      pledgeItemsEndpoints.READBYID.replace(':id', pledgeId)
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching pledge:', error.response?.data || error.message);
    throw error;
  }
};

const getAllPledges = async (page = 1, limit = 10) => {
  try {
    const response = await api.get(pledgeItemsEndpoints.READALL(page, limit));
    return response.data;
  } catch (error) {
    console.error('Error fetching pledges:', error.response?.data || error.message);
    throw error;
  }
};

const getAllOfficePledges = async (page = 1, limit = 10) => {
  try {
    const response = await api.get(pledgeItemsEndpoints.READOFFIEALL(page, limit));
    return response.data;
  } catch (error) {
    console.error('Error fetching pledges:', error.response?.data || error.message);
    throw error;
  }
};

const getAllAccountsPledges = async (page = 1, limit = 10) => {
  try {
    const response = await api.get(pledgeItemsEndpoints.READACCOUNTSALL(page, limit));
    return response.data;
  } catch (error) {
    console.error('Error fetching pledges:', error.response?.data || error.message);
    throw error;
  }
};

const getAllBankCollectionPledges = async (page = 1, limit = 10) => {
  try {
    const response = await api.get(pledgeItemsEndpoints.READBANKCOLLECTIONALL(page, limit));
    return response.data;
  } catch (error) {
    console.error('Error fetching pledges:', error.response?.data || error.message);
    throw error;
  }
};

const getAllGoldCollectPledges = async (page = 1, limit = 10) => {
  try {
    const response = await api.get(pledgeItemsEndpoints.READGOLDCOLLECTALL(page, limit));
    return response.data;
  } catch (error) {
    console.error('Error fetching pledges:', error.response?.data || error.message);
    throw error;
  }
};

const getAllMangerApprovalPledges = async (page = 1, limit = 10) => {
  try {
    const response = await api.get(pledgeItemsEndpoints.READMANAGERAPPROVEALL(page, limit));
    return response.data;
  } catch (error) {
    console.error('Error fetching pledges:', error.response?.data || error.message);
    throw error;
  }
};

const getAllFinanceInstitutePledges = async (page = 1, limit = 10) => {
  try {
    const response = await api.get(pledgeItemsEndpoints.READFINANCEINSTITUTEALL(page, limit));
    return response.data;
  } catch (error) {
    console.error('Error fetching pledges:', error.response?.data || error.message);
    throw error;
  }
};


const getAllCollectionPledges = async (page = 1, limit = 10) => {
  try {
    const response = await api.get(pledgeItemsEndpoints.READCOLLECTIONALL(page, limit));
    return response.data;
  } catch (error) {
    console.error('Error fetching pledges:', error.response?.data || error.message);
    throw error;
  }
};

const getAllMoneyRequestPledges = async (page = 1, limit = 10) => {
  try {
    const response = await api.get(pledgeItemsEndpoints.READMONEYREQUESTALL(page, limit));
    return response.data;
  } catch (error) {
    console.error('Error fetching pledges:', error.response?.data || error.message);
    throw error;
  }
};
const getAllManagerPledges = async (page = 1, limit = 10) => {
  try {
    const response = await api.get(pledgeItemsEndpoints.READMANGERALL(page, limit));
    return response.data;
  } catch (error) {
    console.error('Error fetching pledges:', error.response?.data || error.message);
    throw error;
  }
};

const getAllManagerPledges1 = async (page = 1, limit = 10) => {
  try {
    const response = await api.get(pledgeItemsEndpoints.READMANGERALL1(page, limit));
    return response.data;
  } catch (error) {
    console.error('Error fetching pledges:', error.response?.data || error.message);
    throw error;
  }
};

const getAllRegionalManagerPledges = async (page = 1, limit = 10) => {
  try {
    const response = await api.get(pledgeItemsEndpoints.READREGIONALMANGERALL(page, limit));
    return response.data;
  } catch (error) {
    console.error('Error fetching pledges:', error.response?.data || error.message);
    throw error;
  }
};

const getAllAccountsApprovalPledges = async (page = 1, limit = 10) => {
  try {
    const response = await api.get(pledgeItemsEndpoints.READACCOUNTSAPPROVALALL(page, limit));
    return response.data;
  } catch (error) {
    console.error('Error fetching pledges:', error.response?.data || error.message);
    throw error;
  }
};

const pledgeService = {
  createPledge,
  updatePledge,
  getPledgeById,
  getAllPledges,
  updateExecutive, assigneExecutive,
  getOfficeExecutive,getAllOfficePledges,getAllManagerPledges,
  getAllUpdateManager,
  getAllMoneyRequestPledges,
  updateMoneyRequest,
  getAllAccountsPledges,
  updateAccountRequest,
  getAllCollectionPledges,
  updateCollectionRequest,
  getAllBankCollectionPledges,
  updateBankCollectionRequest,
  getAllFinanceInstitutePledges,
  updateFinanceInstituteRequest,
  getAllGoldCollectPledges,
  updategoldcollectRequest,
  updateManagerApprovalRequest,
  getAllRegionalManagerPledges,
  assigneRegigonalApproval,
  getAllAccountsApprovalPledges,
  assignAccountsApproval,
  updateSalesExecutive,
  getAllMangerApprovalPledges,
  updateManageApprovalRequest,
  getAllManagerPledges1,
  getPledges
};

export default pledgeService;