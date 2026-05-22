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
  CREATE_OPENING_BALANCE: `${ACCOUNTS}/create_opening_balance`,
  READ_OPENING_BALANCE: `${ACCOUNTS}/get_opening_balance`,
  UPDATE_OPENING_BALANCE: `${ACCOUNTS}/update_opening_balance`,
  DELETE_OPENING_BALANCE: `${ACCOUNTS}/delete_opening_balance`,
  CREATE_OPENING_STOCK: `${ACCOUNTS}/create_opening_stock`,
  READ_OPENING_STOCK: `${ACCOUNTS}/get_opening_stock`,
  UPDATE_OPENING_STOCK: `${ACCOUNTS}/update_opening_stock`,
  DELETE_OPENING_STOCK: `${ACCOUNTS}/delete_opening_stock`,
};