// apiConstants.js
const BRANCH_BASE = '/branches';

export const branchEndpoints = {
  CREATE: `${BRANCH_BASE}/`,
  READBYID: `${BRANCH_BASE}/:id`,
  READALL: `${BRANCH_BASE}/`,
  UPDATE: `${BRANCH_BASE}/:id`,
  DELETE: `${BRANCH_BASE}/:id`,
  SEARCH: `${BRANCH_BASE}/search`,
  FILTER_STATE: `${BRANCH_BASE}/filter/state`,
  FILTER_COMPANY: `${BRANCH_BASE}/filter/company`,
  GET_COMPANIES: '/companies' ,
    READBYCOMID: `${BRANCH_BASE}/get-by-company/:companyId`
};