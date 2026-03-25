const QUOTATION_BASE = '/quotations';

export const quotationEndpoints = {
  CREATE: `${QUOTATION_BASE}/customer/:customerId`,
  GETALL: `${QUOTATION_BASE}`,
  GETALLMCXRATE: `${QUOTATION_BASE}/mcx_rates_all`,
  READBYID: `${QUOTATION_BASE}/:id`,
  UPDATE: `${QUOTATION_BASE}/:id`,
  UPDATEMCXRATE: `${QUOTATION_BASE}/mcx_rates/:id`,
  DELETE: `${QUOTATION_BASE}/:id`,
  GENERATE_PDF: `${QUOTATION_BASE}/:id/generate-pdf`,
  SEARCH: `${QUOTATION_BASE}/search`,
  FILTER: `${QUOTATION_BASE}/filter`,
  MCX_RATES: `${QUOTATION_BASE}/mcx-rates`,
  REQUEST_APPROVAL: `${QUOTATION_BASE}/:quotationId/request-approval`,
  APPROVE_MARGIN: `${QUOTATION_BASE}/approvals/:approvalId/approve`,
  REJECT_MARGIN: `${QUOTATION_BASE}/approvals/:approvalId/reject`,
  PENDING_APPROVALS: `${QUOTATION_BASE}/approvals/pending`,
  APPROVAL_HISTORY: `${QUOTATION_BASE}/:quotationId/approval-history`
};