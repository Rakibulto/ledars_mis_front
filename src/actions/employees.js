import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axios, { fetcher, endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

const swrOptions = {
  revalidateIfStale: true,
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  refreshWhenOffline: false,
  dedupingInterval: 10000, // Prevent duplicate requests within 10 seconds
  focusThrottleInterval: 10000, // Throttle focus revalidations to 10 seconds
  errorRetryCount: 2, // Retry failed requests up to 2 times
  errorRetryInterval: 10000, // Wait 10 seconds before retrying
};

// ----------------------------------------------------------------------

export function useGetEmployees(params = {}, enabled = true) {
  const { user } = useAuthContext();

  // Check if user has view_user permission or is admin/superuser
  const hasViewUserPermission =
    user?.role === 'Admin' ||
    (Array.isArray(user?.user_permissions_list) &&
      user.user_permissions_list.some((perm) => perm.codename === 'view_employee'));

  // Build query string from params
  const queryString = Object.keys(params).length > 0 ? new URLSearchParams(params).toString() : '';

  // If no view permission, fetch only current user's data
  const url = enabled
    ? hasViewUserPermission
      ? queryString
        ? `${endpoints.employee.list}?${queryString}`
        : endpoints.employee.list
      : user?.id
        ? endpoints.employee.details(user.id)
        : null
    : null;

  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(() => {
    // If user doesn't have view permission, wrap single employee data in array
    const employeesData = hasViewUserPermission ? data?.results || data || [] : data ? [data] : [];

    return {
      employees: employeesData,
      employeesLoading: isLoading,
      employeesError: error,
      employeesValidating: isValidating,
      employeesEmpty: !isLoading && !employeesData.length,
      pagination: data
        ? {
            count: data.count,
            total_pages: data.total_pages,
            current_page: data.current_page,
            page_size: data.page_size,
            next: data.next,
            previous: data.previous,
          }
        : null,
      statusCounts: data?.status_counts || {},
    };
  }, [data, error, isLoading, isValidating, hasViewUserPermission]);

  return memoizedValue;
}

// ----------------------------------------------------------------------

export function useGetSimpleEmployees(enabled = true) {
  const { user } = useAuthContext();

  // Check if user has view_user permission or is admin/superuser
  const hasViewUserPermission =
    user?.role === 'Admin' ||
    (Array.isArray(user?.user_permissions_list) &&
      user.user_permissions_list.some((perm) => perm.codename === 'view_employee'));

  // If no view permission, fetch only current user's data
  const url = enabled
    ? hasViewUserPermission
      ? endpoints.employee.simple
      : user?.id
        ? endpoints.employee.details(user.id)
        : null
    : null;

  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(() => {
    // If user doesn't have view permission, wrap single employee data in array
    const employeesData = hasViewUserPermission ? data?.results || data || [] : data ? [data] : [];

    return {
      employees: employeesData,
      employeesLoading: isLoading,
      employeesError: error,
      employeesValidating: isValidating,
      employeesEmpty: !isLoading && !employeesData.length,
      pagination: data
        ? {
            count: data.count,
            total_pages: data.total_pages,
            current_page: data.current_page,
            page_size: data.page_size,
            next: data.next,
            previous: data.previous,
          }
        : null,
      statusCounts: data?.status_counts || {},
    };
  }, [data, error, isLoading, isValidating, hasViewUserPermission]);

  return memoizedValue;
}

// ----------------------------------------------------------------------

export function useGetEmployee(id) {
  const url = id ? endpoints.employee.details(id) : null;

  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      employee: data || {},
      employeeLoading: isLoading,
      employeeError: error,
      employeeValidating: isValidating,
      employeeEmpty: !isLoading && !data,
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

export async function createEmployee(data) {
  try {
    // Always use FormData for consistent handling of profile pictures and signatures
    const formData = new FormData();

    // Process all fields
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        if ((key === 'profile_picture' || key === 'signature') && value instanceof File) {
          formData.append(key, value);
        } else if (
          (key === 'profile_picture' || key === 'signature') &&
          typeof value === 'string'
        ) {
          formData.delete(key);
        } else if (Array.isArray(value) || typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value);
        }
      }
    });

    const res = await axios.post(endpoints.employee.list, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    await mutate(endpoints.employee.list);

    return res.data;
  } catch (error) {
    throw new Error(error || 'Failed to create employee');
  }
}

// ----------------------------------------------------------------------

export async function updateEmployee(id, data) {
  try {
    let res;
    const hasProfilePicture = data.profile_picture instanceof File;
    const hasSignature = data.signature instanceof File;

    // If either profile_picture or signature is a File, upload via FormData first
    if (hasProfilePicture || hasSignature) {
      const formData = new FormData();

      if (hasProfilePicture) {
        formData.append('profile_picture', data.profile_picture);
      }
      if (hasSignature) {
        formData.append('signature', data.signature);
      }

      await axios.patch(endpoints.employee.details(id), formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Second API call: Send all other data as JSON (excluding file fields)
      const payload = { ...data };
      delete payload.profile_picture;
      delete payload.signature;

      res = await axios.patch(endpoints.employee.details(id), payload, {
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      // If both are strings (URL or empty) or not provided
      // Make single API call with JSON data, excluding file fields
      const payload = { ...data };
      if (typeof payload.profile_picture === 'string') {
        delete payload.profile_picture;
      }
      if (typeof payload.signature === 'string') {
        delete payload.signature;
      }
      res = await axios.patch(endpoints.employee.details(id), payload, {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await mutate(endpoints.employee.details(id));
    await mutate(endpoints.employee.list);

    return res.data;
  } catch (error) {
    const errorMessage = error || 'Failed to update employee';
    throw new Error(errorMessage);
  }
}

// ----------------------------------------------------------------------

// ----------------------------------------------------------------------

export async function createUser(data) {
  try {
    const res = await axios.post(endpoints.auth.create, data);
    mutate((key) => typeof key === 'string' && key.startsWith(endpoints.employee.list));
    return res.data;
  } catch (error) {
    console.error('API Error Details:', error);
    const errorMessage = error || 'Failed to create user';
    throw errorMessage;
  }
}

// ----------------------------------------------------------------------

export function useGetUsers() {
  const url = endpoints.auth.create;

  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      users: data || [],
      usersLoading: isLoading,
      usersError: error,
      usersValidating: isValidating,
      usersEmpty: !isLoading && !data?.length,
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

export function useGetUser({ id }) {
  const url = endpoints.auth.updatePassword(id);

  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      user: data || {},
      userLoading: isLoading,
      userError: error,
      userValidating: isValidating,
      userEmpty: !isLoading && !data,
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

export function useGetFilteredUsers({ role1 = 'Admin', role2 = 'Supervisor' } = {}) {
  const url = endpoints.auth.filterByRole(role1, role2);

  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(() => {
    const normalizedUsers = Array.isArray(data) ? data : data ? [data] : [];
    return {
      users: normalizedUsers,
      usersLoading: isLoading,
      usersError: error,
      usersValidating: isValidating,
      usersEmpty: !isLoading && !normalizedUsers.length,
    };
  }, [data, error, isLoading, isValidating]);

  return memoizedValue;
}

// ----------------------------------------------------------------------

export function useGetSupervisors() {
  const { user } = useAuthContext();

  // Check for view_supervisorlevel permission
  const hasViewSupervisorLevel = Array.isArray(user?.user_permissions_list)
    ? user.user_permissions_list.some((perm) => perm.codename === 'view_supervisorlevel')
    : false;

  const url =
    user?.role === 'Admin' || hasViewSupervisorLevel ? endpoints.employee.supervisor : null;

  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      supervisors: data || [],
      supervisorsLoading: isLoading,
      supervisorsError: error,
      supervisorsValidating: isValidating,
      supervisorsEmpty: !isLoading && !data?.length,
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

export async function updateUserRole(userId, roleId, roles = []) {
  const roleObj = roles.find((r) => r.id === roleId);
  const isSuperuser = false;

  const url = endpoints.auth.updateUser(userId);

  const res = await axios.patch(url, { role: roleId, is_superuser: isSuperuser });

  await mutate(endpoints.employee.list);
  await mutate(endpoints.employee.details(userId));

  return res.data;
}

// ----------------------------------------------------------------------

export async function updateUsername(userId, username) {
  const url = endpoints.auth.updateUser(userId);

  const res = await axios.patch(url, { username });

  await mutate(endpoints.employee.list);
  await mutate(endpoints.employee.details(userId));

  return res.data;
}

// ----------------------------------------------------------------------

export async function setPassword(currentPassword, newPassword) {
  try {
    const params = {
      current_password: currentPassword,
      new_password: newPassword,
      re_new_password: newPassword,
    };

    const res = await axios.post(endpoints.auth.setPassword, params);

    return res.data;
  } catch (error) {
    console.error('Error updating password:', error);
    throw error;
  }
}
