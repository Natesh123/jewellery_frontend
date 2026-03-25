const SUBPRODUCT_BASE = '/sub-products';

export const subProductEndpoints = {
  CREATE: `${SUBPRODUCT_BASE}/`,
  READBYID: `${SUBPRODUCT_BASE}/:id`,
  READALL: `${SUBPRODUCT_BASE}/`,
  READALLNOLIMIT: `${SUBPRODUCT_BASE}/no-limit`,
  UPDATE: `${SUBPRODUCT_BASE}/:id`,
  DELETE: `${SUBPRODUCT_BASE}/:id`,
  SEARCH: `${SUBPRODUCT_BASE}/search`,
  GET_STATUS_OPTIONS: `${SUBPRODUCT_BASE}/options/status-options`,
  GET_PRODUCT_OPTIONS: `${SUBPRODUCT_BASE}/options/product-options`,
};