import { post } from '../apiConfig/httpMethods';
import { authEndpoints } from '../apiConstants';

export const adminLogin = async (credentials) => {
  try {
    const response = await post(authEndpoints.LOGIN, credentials);
    const userData = response.data;

    if (!userData.token) {
      throw new Error('Authentication failed: No token received');
    }

    localStorage.setItem('adminToken', userData.token);
    console.log('Login successful:', userData);
    return userData;
  } catch (error) {
    console.log('Login error:', error);
    const errorMsg = error.response?.data?.message || 
                     error.message || 
                     'Login failed';
    throw new Error(errorMsg);
  }
};
export const resetPassword = async (data) => {
  try {
    await post(authEndpoints.RESETPASSWORD,data);
  } catch (error) {
    console.error('Logout error:', error);
  }
};

export const adminLogout = async () => {
  try {
    await post(authEndpoints.LOGOUT);
    localStorage.removeItem('adminToken');
  } catch (error) {
    console.error('Logout error:', error);
  }
};