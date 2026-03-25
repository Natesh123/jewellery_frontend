const PURCHASE_BASE = '/purchases';

export const purchaseEndpoints = {
  CREATE: `${PURCHASE_BASE}`,
  GETALL: `${PURCHASE_BASE}`,
  GETALLREGIONAL: `${PURCHASE_BASE}/regional-manager/${localStorage.getItem("userId")}/${localStorage.getItem("userBranchId")}`,
  GETALLREGIONAL_UPDATE: `${PURCHASE_BASE}/regional-manager/:id/${localStorage.getItem("userBranchId")}`,
  GETALLACCOUNTS: `${PURCHASE_BASE}/accounts/${localStorage.getItem("userId")}/${localStorage.getItem("userBranchId")}`,
  GETALLACCOUNTS_UPDATE: `${PURCHASE_BASE}/accounts/:id/${localStorage.getItem("userBranchId")}`,
  READBYID: `${PURCHASE_BASE}/:id`,
  UPDATE: `${PURCHASE_BASE}/:id`,
  DELETE: `${PURCHASE_BASE}/:id`,
  VERIFY_AADHAR: `${PURCHASE_BASE}/verify-aadhar`,
  SEND_AADHAR_OTP: `${PURCHASE_BASE}/send-aadhar-otp`,
  GENERATE_BARCODE: `${PURCHASE_BASE}/:id/generate-barcode`,
  DOWNLOAD_BARCODE: `${PURCHASE_BASE}/:id/download-barcode`,
  SEARCH: `${PURCHASE_BASE}/search`,
  FILTER: `${PURCHASE_BASE}/filter`,
  PAYMENT_METHODS: `${PURCHASE_BASE}/payment-methods`,
  RECORD_PAYMENT: `${PURCHASE_BASE}/:id/record-payment`,
  PAYMENT_HISTORY: `${PURCHASE_BASE}/:id/payment-history`,
  QREADBYID: `${PURCHASE_BASE}/qua/:id`,
  DOWNLOAD_BILL: `${PURCHASE_BASE}/:id/download-bill`,
};