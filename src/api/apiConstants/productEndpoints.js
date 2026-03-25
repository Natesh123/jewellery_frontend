// src/api/endpoints/productEndpoints.js

const PRODUCT_BASE = '/products';

export const productEndpoints = {
  CREATE: `${PRODUCT_BASE}/`,
  READBYID: `${PRODUCT_BASE}/:id`,
  READALL: `${PRODUCT_BASE}/`,
  READALLNOLIMIT: `${PRODUCT_BASE}/no-limit`,
  UPDATE: `${PRODUCT_BASE}/:id`,
  DELETE: `${PRODUCT_BASE}/:id`,
  SEARCH: `${PRODUCT_BASE}/search`,
  GET_STATUS_OPTIONS: `${PRODUCT_BASE}/options/status-options`,
  GET_METAL_OPTIONS: `${PRODUCT_BASE}/options/metal-options`,
  GET_CATEGORY_OPTIONS: `${PRODUCT_BASE}/options/category-options`,
  GET_SUBPRODUCT_OPTIONS: `${PRODUCT_BASE}/options/subproduct-options`,
};