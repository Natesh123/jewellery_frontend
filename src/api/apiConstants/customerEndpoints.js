const CUSTOMER_BASE = '/customers';

export const customerEndpoints = {
  CREATE: `${CUSTOMER_BASE}/`,
  READBYID: `${CUSTOMER_BASE}/:id`,
  READALL: `${CUSTOMER_BASE}/`,
  UPDATE: `${CUSTOMER_BASE}/:id`,
  DELETE: `${CUSTOMER_BASE}/:id`,
  SEARCH: `${CUSTOMER_BASE}/search`,
  FILTER_STATE: `${CUSTOMER_BASE}/filter/state`,
  FILTER_BANK_ACCOUNT: `${CUSTOMER_BASE}/filter/bank-account`,
  VERIFY_AADHAR: `${CUSTOMER_BASE}/verify-aadhar`,
  GENERATE_OTP: `${CUSTOMER_BASE}/generate-otp`,
  STATES_LIST: '/states'
};