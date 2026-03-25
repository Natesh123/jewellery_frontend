const AUTH_BASE = '/admin';

export const authEndpoints = {
  LOGIN: `${AUTH_BASE}/login`,
  LOGOUT: `${AUTH_BASE}/logout`,
  RESETPASSWORD: `${AUTH_BASE}/reset-password`,
  PROFILE: `${AUTH_BASE}/me`,
  REFRESH_TOKEN: `${AUTH_BASE}/refresh`,
};