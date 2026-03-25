const ACCOUNTS = '/accounts';

export const accountsEndpoints = {
  CREATE_MASTER: `${ACCOUNTS}/create_master`,
  READ_MASTER: `${ACCOUNTS}/get_master`,
  CREATE_RECEIPT: `${ACCOUNTS}/create_receipt`,
  READ_RECEIPT: `${ACCOUNTS}/get_receipt`,
  CREATE_ACCOUNT_HEAD: `${ACCOUNTS}/create_account_head`,
  READ_ACCOUNT_HEAD: `${ACCOUNTS}/get_account_head`,
  CREATE_STATE: `${ACCOUNTS}/create_state`,
  GET_STATE: `${ACCOUNTS}/get_state`,
};