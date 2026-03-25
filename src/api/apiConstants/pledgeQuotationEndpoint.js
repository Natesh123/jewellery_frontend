const PLEDGE_QUOTATION_BASE = '/pledge_quotations';

export const pledgeQuotationEndpoints = {
  CREATE: `${PLEDGE_QUOTATION_BASE}/customer/:customerId`,
  GETALL: `${PLEDGE_QUOTATION_BASE}`,
  GETFinalALL: `${PLEDGE_QUOTATION_BASE}/final_quotation`,
  GETALLQUOTATION: `${PLEDGE_QUOTATION_BASE}/purchase_quotation`,
  REGIONAL_MANAGER_PURCHASE: `${PLEDGE_QUOTATION_BASE}/regional-manager/${localStorage.getItem("userId")}`,
  GETALLMCXRATE: `${PLEDGE_QUOTATION_BASE}/mcx_rates_all`,
  READBYID: `${PLEDGE_QUOTATION_BASE}/:id`,
  READBYIDFINAL: `${PLEDGE_QUOTATION_BASE}/final_quotation/:id`,
  UPDATE: `${PLEDGE_QUOTATION_BASE}/:id`,
  UPDATEMCXRATE: `${PLEDGE_QUOTATION_BASE}/mcx_rates/:id`,
  DELETE: `${PLEDGE_QUOTATION_BASE}/:id`,
  GENERATE_PDF: `${PLEDGE_QUOTATION_BASE}/:id/generate-pdf`,
  SEARCH: `${PLEDGE_QUOTATION_BASE}/search`,
  FILTER: `${PLEDGE_QUOTATION_BASE}/filter`,
  MCX_RATES: `${PLEDGE_QUOTATION_BASE}/mcx-rates`,
  REQUEST_APPROVAL: `${PLEDGE_QUOTATION_BASE}/:quotationId/request-approval`,
  APPROVE_MARGIN: `${PLEDGE_QUOTATION_BASE}/approvals/:approvalId/approve`,
  REJECT_MARGIN: `${PLEDGE_QUOTATION_BASE}/approvals/:approvalId/reject`,
  PENDING_APPROVALS: `${PLEDGE_QUOTATION_BASE}/approvals/pending`,
  APPROVAL_HISTORY: `${PLEDGE_QUOTATION_BASE}/:quotationId/approval-history`
};