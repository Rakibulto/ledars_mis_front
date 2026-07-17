'use client';

import axios, { endpoints } from 'src/utils/axios';

import { setSession } from './utils';
import { STORAGE_KEY } from './constant';
import { clearSession } from './auth-provider';

/** **************************************
 * Sign in
 *************************************** */
export const signInWithPassword = async ({ email, password }) => {
  try {
    const params = { email, password };

    const res = await axios.post(endpoints.auth.signIn, params);

    const { access, refresh } = res.data;

    if (!access || !refresh) {
      throw new Error('Access or refresh token not found in response');
    }

    setSession(access, refresh);
  } catch (error) {
    clearSession();
    console.error('Error during sign in:', error);
    throw error;
  }
};

/** **************************************
 * Sign up
 *************************************** */
export const signUp = async ({ email, password, firstName, lastName }) => {
  const params = {
    email,
    password,
    firstName,
    lastName,
  };

  try {
    const res = await axios.post(endpoints.auth.signUp, params);

    const { accessToken } = res.data;

    if (!accessToken) {
      throw new Error('Access token not found in response');
    }

    localStorage.setItem(STORAGE_KEY, accessToken);
  } catch (error) {
    console.error('Error during sign up:', error);
    throw error;
  }
};

/** **************************************
 * Sign out
 *************************************** */
export const signOut = async () => {
  try {
    await setSession(null);
    clearSession();
  } catch (error) {
    console.error('Error during sign out:', error);
    throw error;
  }
};

/** **************************************
 * Request password reset
 *************************************** */
export const requestPasswordReset = async ({ email }) => {
  try {
    const res = await axios.post(endpoints.auth.requestPasswordReset, { email });
    return res.data;
  } catch (error) {
    console.error('Error during password reset request:', error);
    throw error;
  }
};

/** **************************************
 * Reset password with code
 *************************************** */
export const resetPassword = async ({ email, code, password }) => {
  try {
    // Send request to backend API to reset password
    const res = await axios.post(endpoints.auth.resetPassword, {
      email,
      code,
      password,
    });

    return res.data;
  } catch (error) {
    console.error('Error during password reset:', error);
    throw error;
  }
};

/** **************************************
 * Confirm password reset with code
 *************************************** */
export const resetPasswordConfirm = async ({ uid, token, new_password }) => {
  try {
    const res = await axios.post(endpoints.auth.resetPasswordConfirm, {
      uid,
      token,
      new_password,
    });

    return res.data;
  } catch (error) {
    console.error('Error during password reset confirmation:', error);
    throw error;
  }
};
