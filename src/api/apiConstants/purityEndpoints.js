const PURITY_BASE = '/purities';

export const purityEndpoints = {
  CREATE: `${PURITY_BASE}/`,
  READBYID: `${PURITY_BASE}/:id`,
  READALL: `${PURITY_BASE}/`,
  UPDATE: `${PURITY_BASE}/:id`,
  DELETE: `${PURITY_BASE}/:id`,
  SEARCH: `${PURITY_BASE}/search`,
  GET_STATUS_OPTIONS: `${PURITY_BASE}/options/status-options`,
  GET_METAL_OPTIONS: `${PURITY_BASE}/options/metal-options`,
  GET_PURITY_STANDARDS: `${PURITY_BASE}/options/purity-standards`,
  GET_PURITY_COUNT: `${PURITY_BASE}/count`
};