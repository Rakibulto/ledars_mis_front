'use client';

import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axios, { fetcher, endpoints } from 'src/utils/axios';

const swrOptions = {
  revalidateIfStale: true,
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  refreshWhenOffline: false,
  dedupingInterval: 10000,
  focusThrottleInterval: 10000,
  errorRetryCount: 2,
  errorRetryInterval: 10000,
};

// ----------------------------------------------------------------------
// MEETINGS
// ----------------------------------------------------------------------

export function useGetMeetings() {
  const url = endpoints.meetingManagement.meetings;

  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      datas: data || [],
      datasLoading: isLoading,
      datasError: error,
      datasValidating: isValidating,
      datasEmpty: !isLoading && !data?.results?.length && !Array.isArray(data)?.length,
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

export function useGetMeeting(id) {
  const url = id ? endpoints.meetingManagement.meetingById(id) : null;
  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      data: data || {},
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      dataEmpty: !isLoading && !data,
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

export async function createMeeting(data) {
  try {
    const res = await axios.post(endpoints.meetingManagement.meetings, data);

    await mutate(endpoints.meetingManagement.meetings);

    return res.data;
  } catch (error) {
    console.error('Error creating meeting:', error);
    throw error;
  }
}

export async function updateMeeting(id, data) {
  try {
    const res = await axios.patch(endpoints.meetingManagement.meetingById(id), data);

    await mutate(endpoints.meetingManagement.meetingById(id));
    await mutate(endpoints.meetingManagement.meetings);

    return res.data;
  } catch (error) {
    console.error('Error updating meeting:', error);
    throw error;
  }
}

export async function deleteMeeting(id) {
  try {
    const res = await axios.delete(endpoints.meetingManagement.meetingById(id));

    await mutate(endpoints.meetingManagement.meetings);

    return res.data;
  } catch (error) {
    console.error('Error deleting meeting:', error);
    throw error;
  }
}
