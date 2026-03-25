// apiConstants.js
const PERMISSION_BASE = '/role-permissions';

export const permissionEndpoints = {
  CREATE: `${PERMISSION_BASE}/`,
  READBYID: `${PERMISSION_BASE}/:id`,
  READALL: `${PERMISSION_BASE}/`,
  UPDATE: `${PERMISSION_BASE}/:id`,
  DELETE: `${PERMISSION_BASE}/:id`,
  SEARCH: `${PERMISSION_BASE}/search`,
  GET_BY_ROLE: `${PERMISSION_BASE}/by-role/:roleId`
};