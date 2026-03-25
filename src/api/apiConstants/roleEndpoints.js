// apiConstants.js
const ROLE_BASE = '/roles';

export const roleEndpoints = {
  CREATE: `${ROLE_BASE}/`,
  READBYID: `${ROLE_BASE}/:id`,
  READALL: `${ROLE_BASE}/`,
  UPDATE: `${ROLE_BASE}/:id`,
  DELETE: `${ROLE_BASE}/:id`,
  SEARCH: `${ROLE_BASE}/search`,
  FILTER_STATUS: `${ROLE_BASE}/filter/status`
};