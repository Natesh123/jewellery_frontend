const MELTING_PURCHASE_ENDPOINT = '/melting_purchase';

export const melting_purchase = {
    CREATE: `${MELTING_PURCHASE_ENDPOINT}/`,
    CREATE_SALES_PAYMENT: `${MELTING_PURCHASE_ENDPOINT}/create_sales_payments/:id`,
    GET_SALES_PAYMENT: `${MELTING_PURCHASE_ENDPOINT}/sales_payments/`,
    READ: `${MELTING_PURCHASE_ENDPOINT}/read/`,
    READRECEIPT: `${MELTING_PURCHASE_ENDPOINT}/read_receipt/`,
    READ_ACCOUNTS: `${MELTING_PURCHASE_ENDPOINT}/acctounts_melt/`,
    GETALLACCOUNTS_UPDATE: `${MELTING_PURCHASE_ENDPOINT}/accounts/:accounts_id/${localStorage.getItem("userBranchId")}`,
    GETALLMElt_UPDATE: `${MELTING_PURCHASE_ENDPOINT}/melt/:id/${localStorage.getItem("userBranchId")}`,
    UPDATE: `${MELTING_PURCHASE_ENDPOINT}/:id`,
    UPDATE_MELT_DETAILS: `${MELTING_PURCHASE_ENDPOINT}/melt_details/:id`,
    UPDATE_MELT_WAGES: `${MELTING_PURCHASE_ENDPOINT}/melt_wages/:id`,
    WAGES: `${MELTING_PURCHASE_ENDPOINT}/wages/`
}