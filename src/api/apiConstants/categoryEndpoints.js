const CATEGORY_BASE = '/categories';

export const categoryEndpoints = {
  CREATE: `${CATEGORY_BASE}/`,
  READBYID: `${CATEGORY_BASE}/:id`,
  READALL: `${CATEGORY_BASE}/`,
  UPDATE: `${CATEGORY_BASE}/:id`,
  DELETE: `${CATEGORY_BASE}/:id`,
  SEARCH: `${CATEGORY_BASE}/search`,
  GET_STATUS_OPTIONS: `${CATEGORY_BASE}/options/status`,
  GET_METAL_OPTIONS: `${CATEGORY_BASE}/options/metal-options`,
  GET_TAX_OPTIONS: `${CATEGORY_BASE}/options/tax-options`,
  GET_NEXT_CODE: `${CATEGORY_BASE}/next-code`,
  GENERATE_NAME: `${CATEGORY_BASE}/generate-name`
};