'use client';

import { useMemo, useEffect, useCallback } from 'react';

import { useSetState } from 'src/hooks/use-set-state';

import axios, { endpoints } from 'src/utils/axios';

import { AuthContext } from '../auth-context';
import { STORAGE_KEY, REFRESH_TOKEN_KEY } from './constant';
import { jwtDecode, setSession, isValidToken, tokenExpired, refreshAccessToken } from './utils';

// ----------------------------------------------------------------------

export function AuthProvider({ children }) {
  const { state, setState } = useSetState({
    user: null,
    loading: true,
  });

  const checkUserSession = useCallback(async () => {
    try {
      const accessToken = localStorage.getItem(STORAGE_KEY);
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

      if (accessToken && isValidToken(accessToken)) {
        setSession(accessToken, refreshToken);

        const decodedToken = jwtDecode(accessToken);
        if (decodedToken && 'exp' in decodedToken) {
          tokenExpired(decodedToken.exp); // Start the refresh timer before token expires
        }

        const res = await axios.get(endpoints.auth.me);

        const { id, employee_id, username, email, role, profile_picture, user_permissions_list } =
          res.data;

        setState({
          user: {
            id,
            employee_id,
            username,
            email,
            role,
            profile_picture,
            user_permissions_list,
            accessToken,
          },
          loading: false,
        });
      } else if (refreshToken) {
        // Attempt to refresh token
        const newAccessToken = await refreshAccessToken();

        const res = await axios.get(endpoints.auth.me);

        const { id, employee_id, username, email, role, profile_picture, user_permissions_list } =
          res.data;

        setState({
          user: {
            id,
            employee_id,
            username,
            email,
            role,
            profile_picture,
            user_permissions_list,
            accessToken: newAccessToken,
          },
          loading: false,
        });
      } else {
        clearSession();
        setState({ user: null, loading: false });
      }
    } catch (error) {
      console.error(error);
      clearSession();
      setState({ user: null, loading: false });
    }
  }, [setState]);

  useEffect(() => {
    checkUserSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----------------------------------------------------------------------

  const checkAuthenticated = state.user ? 'authenticated' : 'unauthenticated';

  const status = state.loading ? 'loading' : checkAuthenticated;

  const memoizedValue = useMemo(
    () => ({
      user: state.user
        ? {
            ...state.user,
            id: state.user.id ?? null,
            role: state.user?.role ?? 'Employee',
          }
        : null,
      checkUserSession,
      loading: status === 'loading',
      authenticated: status === 'authenticated',
      unauthenticated: status === 'unauthenticated',
    }),
    [checkUserSession, state.user, status]
  );

  return <AuthContext.Provider value={memoizedValue}>{children}</AuthContext.Provider>;
}

export const clearSession = () => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem('attendanceDialogShown');
  delete axios.defaults.headers.common.Authorization;
};
