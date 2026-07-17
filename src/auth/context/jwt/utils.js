import { paths } from 'src/routes/paths';

import axios, { endpoints } from 'src/utils/axios';

import { STORAGE_KEY, REFRESH_TOKEN_KEY } from './constant';

// ----------------------------------------------------------------------

export function jwtDecode(token) {
  try {
    if (!token) return null;

    const parts = token.split('.');
    if (parts.length < 2) {
      throw new Error('Invalid token!');
    }

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(base64));

    return decoded;
  } catch (error) {
    console.error('Error decoding token:', error);
    throw error;
  }
}

// ----------------------------------------------------------------------

export function isValidToken(accessToken) {
  if (!accessToken) {
    return false;
  }

  try {
    const decoded = jwtDecode(accessToken);

    if (!decoded || !('exp' in decoded)) {
      return false;
    }

    const currentTime = Date.now() / 1000;

    return decoded.exp > currentTime;
  } catch (error) {
    console.error('Error during token validation:', error);
    return false;
  }
}

// ----------------------------------------------------------------------

export function tokenExpired(exp) {
  const currentTime = Date.now();
  const timeLeft = exp * 1000 - currentTime;

  // Trigger refresh 5 minutes (300000 seconds) before expiry
  const refreshTime = Math.max(timeLeft - 300000, 0); // Ensure it's not negative

  setTimeout(() => {
    try {
      refreshAccessToken();
    } catch (error) {
      console.error('Error during token refresh:', error);

      alert('Token expired!');
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      window.location.href = paths.auth.jwt.signIn;

      throw error;
    }
  }, refreshTime);
}

// ----------------------------------------------------------------------

export async function setSession(accessToken, refreshToken) {
  try {
    if (accessToken) {
      localStorage.setItem(STORAGE_KEY, accessToken);

      if (refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      }

      axios.defaults.headers.common.Authorization = `Bearer ${accessToken}`;

      const decodedToken = jwtDecode(accessToken); // ~3 days

      if (decodedToken && 'exp' in decodedToken) {
        tokenExpired(decodedToken.exp);
      } else {
        throw new Error('Invalid access token!');
      }
    } else {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      delete axios.defaults.headers.common.Authorization;
    }
  } catch (error) {
    console.error('Error during set session:', error);
    throw error;
  }
}

// ----------------------------------------------------------------------

export async function refreshAccessToken() {
  try {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

    if (!refreshToken) {
      throw new Error('Refresh token not found');
    }

    const res = await axios.post(endpoints.auth.refresh, { refresh: refreshToken });

    const { access } = res.data;

    if (!access) {
      throw new Error('Access token not returned');
    }

    setSession(access, refreshToken); // Update session with new access token
    return access;
  } catch (error) {
    console.error('Error refreshing access token:', error);

    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    window.location.href = paths.auth.jwt.signIn;

    throw error;
  }
}
