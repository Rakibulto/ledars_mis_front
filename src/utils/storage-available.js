// ----------------------------------------------------------------------

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function localStorageAvailable() {
  try {
    const key = '__some_random_key_you_are_not_going_to_use__';
    window.localStorage.setItem(key, key);
    window.localStorage.removeItem(key);
    return true;
  } catch (error) {
    return false;
  }
}

// ----------------------------------------------------------------------

export function localStorageGetItem(key, defaultValue = '') {
  const storageAvailable = localStorageAvailable();

  let value;

  if (storageAvailable) {
    value = localStorage.getItem(key) || defaultValue;
  }

  return value;
}

// export function HandleSavePathnameToLocalStorage() {
//   const pathname = usePathname();
//   console.log('HandleSavePathnameToLocalStorage - Current pathname:', pathname);

//   useEffect(() => {
//     if (typeof window !== 'undefined' && pathname !== '/auth/jwt/sign-in' && pathname !== '/') {
//       localStorage.setItem('lastVisitedPath', pathname);
//     }
//   }, [pathname]);

//   return null;
// }

export function HandleSavePathnameToLocalStorage() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // build full URL (without domain)
    const queryString = searchParams.toString();
    const { hash } = window.location; // if #

    const fullPath = queryString ? `${pathname}?${queryString}${hash}` : `${pathname}${hash}`;

    // skip  route
    if (pathname !== '/auth/jwt/sign-in' && pathname !== '/') {
      sessionStorage.setItem('lastVisitedPath', fullPath);
    }

    // console.log('Saved full path:', fullPath);
  }, [pathname, searchParams]);

  return null;
}
export function getLastVisitedPath(defaultValue = null) {
  if (typeof window === 'undefined') return defaultValue;

  try {
    return sessionStorage.getItem('lastVisitedPath') || defaultValue;
  } catch (err) {
    return defaultValue;
  }
}

export function RemoveSavedPathname() {
  const currentPathname = usePathname();

  // console.log('Current pathname:', currentPathname);

  useEffect(() => {
    if (currentPathname === '/dashboard' || currentPathname === '/') {
      sessionStorage.removeItem('lastVisitedPath');
    }
  }, [currentPathname]);

  return null;
}
