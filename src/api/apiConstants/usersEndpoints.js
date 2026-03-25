// apiConstants.js
const USER_BASE = '/users';

export const userEndpoints = {
  CREATE: `${USER_BASE}/`,
  READBYID: `${USER_BASE}/:id`,
  READALL: `${USER_BASE}/`,
  UPDATE: `${USER_BASE}/:id`,
  DELETE: `${USER_BASE}/:id`,
  SEARCH: `${USER_BASE}/search`,
  GET_ROLES: '/roles',
  GET_COMPANIES: '/companies',
  GET_BRANCHES_BY_COMPANY: '/branches/get-by-company/:companyId',
  GET_USER_COUNT: `${USER_BASE}/count`
};