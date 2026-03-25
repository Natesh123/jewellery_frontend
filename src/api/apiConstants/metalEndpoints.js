// apiConstants.js
const METAL_BASE = '/metals';

export const metalEndpoints = {
  CREATE: `${METAL_BASE}/`,
  READBYID: `${METAL_BASE}/:id`,
  READALL: `${METAL_BASE}/`,
  UPDATE: `${METAL_BASE}/:id`,
  DELETE: `${METAL_BASE}/:id`,
  SEARCH: `${METAL_BASE}/search`,
  GET_STATUS_OPTIONS: `${METAL_BASE}/status-options`,
  GET_METAL_OPTIONS: `${METAL_BASE}/metal-options`,
  GET_METAL_COUNT: `${METAL_BASE}/count`
};