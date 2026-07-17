import useSWR, { mutate } from 'swr';
import { useRef, useMemo, useEffect } from 'react';

import { fDateTime } from 'src/utils/format-time';
import axios, { fetcher, endpoints } from 'src/utils/axios';

import { toast } from 'src/components/snackbar';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

const swrOptions = {
  revalidateIfStale: true,
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  refreshInterval: 2 * 60000, // Poll every 2 minutes for new notifications
  refreshWhenOffline: false,
  dedupingInterval: 10000, // Prevent duplicate requests within 10 seconds
  focusThrottleInterval: 10000, // Throttle focus revalidations to 10 seconds
  errorRetryCount: 2, // Retry failed requests up to 2 times
  errorRetryInterval: 10000, // Wait 10 seconds before retrying
};

// ----------------------------------------------------------------------

export function useGetNotifications(page = 1, pageSize = 30, filters = {}) {
  const { user } = useAuthContext();
  const previousNotifications = useRef([]);
  const initialLoadDone = useRef(false);

  // Build query parameters
  const queryParams = new URLSearchParams({
    page,
    page_size: pageSize,
  });

  // Add filter parameters
  if (filters.status === 'unread') {
    queryParams.append('status', 'Unread');
  } else if (filters.status === 'read') {
    queryParams.append('status', 'Read');
  }

  // Add type filters
  if (filters.type && filters.type !== 'all') {
    queryParams.append('type', filters.type);
  }

  const baseUrl =
    user?.role !== 'Admin' ? endpoints.notification.byUser(user?.id) : endpoints.notification.list;
  const url = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}${queryParams.toString()}`;

  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, swrOptions);

  useEffect(() => {
    if (!data || isLoading) return;

    const currentNotifications = data?.results || [];

    // Only show toast for new notifications after initial load on first page
    if (initialLoadDone.current && page === 1) {
      const prevNotificationsIds = new Set(previousNotifications.current.map((n) => n.id));
      const newNotifications = currentNotifications.filter(
        (notification) => !prevNotificationsIds.has(notification.id)
      );

      if (newNotifications.length > 0) {
        const latestNotification = newNotifications[0];

        // Use the notification title if present, otherwise fallback
        const title =
          latestNotification.title && latestNotification.title.trim() !== ''
            ? latestNotification.title
            : 'New Notification';

        // Details for the toast
        const details = [
          latestNotification.remarks && latestNotification.remarks.trim() !== ''
            ? latestNotification.remarks
            : null,
          latestNotification.created_at ? `At: ${fDateTime(latestNotification.created_at)}` : null,
        ]
          .filter(Boolean)
          .join('\n');

        toast.info(title, {
          description: details,
        });

        if (newNotifications.length > 1) {
          toast.info(`${newNotifications.length - 1} more notifications`, {
            description: 'Check your notification panel',
          });
        }
      }
    }

    // Mark initial load as done after first effect run
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
    }

    previousNotifications.current = currentNotifications;
  }, [data, isLoading, page]);

  // Force a refresh every minute to ensure we don't miss anything
  useEffect(() => {
    const intervalId = setInterval(() => {
      mutate(endpoints.notification.list);
    }, 60000);

    return () => clearInterval(intervalId);
  }, []);

  const memoizedValue = useMemo(
    () => ({
      notification: data?.results || [],
      notificationLoading: isLoading,
      notificationError: error,
      notificationValidating: isValidating,
      notificationEmpty: !isLoading && !data?.results?.length,
      notificationCount: data?.count || 0,
      notificationUnreadCount: data?.unread_count || 0,
      notificationPage: data?.page || 1,
      notificationPageSize: pageSize,
      notificationNext: data?.next || null,
      notificationPrevious: data?.previous || null,
    }),
    [data, error, isLoading, isValidating, pageSize]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

export async function markAllNotificationsAsRead() {
  try {
    await axios.get(endpoints.notification.markAllAsRead);

    await mutate(endpoints.notification.list);
  } catch (error) {
    console.error('Failed to mark notifications as read', error);
    throw error;
  }
}
