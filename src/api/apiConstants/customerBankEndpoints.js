const CUSTOMER_BASE = '/cusBank/bank-accounts';


export const customerBankEndpoints = {
  CREATE: `${CUSTOMER_BASE}`,
  READBYID: `${CUSTOMER_BASE}/:id`,
  READBYCUSTOMER: `${CUSTOMER_BASE}/customer/:customerId`,
  UPDATE: `${CUSTOMER_BASE}/:id`,
  DELETE: `${CUSTOMER_BASE}/:id`,
  SEARCH: `${CUSTOMER_BASE}/search`,
  FILTER_BANK: `${CUSTOMER_BASE}/filter/bank`,
  PRIMARY: `${CUSTOMER_BASE}/:id/set-primary`,
  GETALLBANKACCOUNTS: `${CUSTOMER_BASE}/`,
};