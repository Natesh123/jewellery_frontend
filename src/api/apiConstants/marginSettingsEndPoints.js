const MARGIN_SETTINGS_BASE = '/margin-settings';

export const marginSettingsEndPoints = {
    CREATE: `${MARGIN_SETTINGS_BASE}/`,
    READALL: `${MARGIN_SETTINGS_BASE}/`,
    UPDATE: `${MARGIN_SETTINGS_BASE}/:id`,
    UPDATE_BY_ROLEID: `${MARGIN_SETTINGS_BASE}/:role_id`,
    READ_BY_ROLEID: `${MARGIN_SETTINGS_BASE}/:role_id`
};