const COMPANY_BASE = '/companies';

export const companyEndpoints = {
  CREATE: `${COMPANY_BASE}/`,
  READBYID: `${COMPANY_BASE}/:id`,
  READALL: `${COMPANY_BASE}/`,
  UPDATE: `${COMPANY_BASE}/:id`,
  DELETE: `${COMPANY_BASE}/:id`,
  SEARCH: `${COMPANY_BASE}/search`,
  FILTER_STATE: `${COMPANY_BASE}/filter/state`,
  FILTER_TURNOVER: `${COMPANY_BASE}/filter/turnover`
};