'use client';

import dayjs from 'dayjs';
import useSWR, { mutate } from 'swr';
import { useMemo, useState, useEffect } from 'react';

import axios, { fetcher, endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

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
// LEAVE POLICIES
// ----------------------------------------------------------------------
export function useGetLeavePoliciesByEmployee(employeeId) {
  const url = employeeId ? endpoints.leave.policiesByEmployee(employeeId) : null;

  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      data: data || [],
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      dataEmpty: !isLoading && !data?.length,
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------
// LEAVE REQUESTS
// ----------------------------------------------------------------------
export function useGetApprovalByRequestId(id) {
  const url = id ? endpoints.leave.approvalByRequestId(id) : null;

  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      data: data || [],
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      dataEmpty: !isLoading && !data?.length,
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

export function useGetLeaveRequests(employeeId, timePeriod, flag = false, supervisor = false) {
  const { user } = useAuthContext();
  const isAdmin = user?.role === 'Admin';

  let url = supervisor
    ? endpoints.leave.requestBySupervisor(user?.employee_id)
    : flag && employeeId
      ? endpoints.leave.requestByEmployeeId(employeeId)
      : isAdmin
        ? endpoints.leave.request
        : user?.employee_id
          ? endpoints.leave.requestByEmployeeId(user?.employee_id)
          : null;

  // Add today filter
  if (url && timePeriod === 'today') {
    url += `?today=true`;
  }

  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, swrOptions);

  // State to track which page's data we've fetched approval details for
  const [currentPage, setCurrentPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(30);
  const [approvalStatusMap, setApprovalStatusMap] = useState({});
  const [leaveBalances, setLeaveBalances] = useState([]);

  // Get the current page data
  const currentPageData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    const start = currentPage * rowsPerPage;
    const end = start + rowsPerPage;
    return data.slice(start, end);
  }, [data, currentPage, rowsPerPage]);

  // Fetch approval status only for current page items
  useEffect(() => {
    let isMounted = true;
    async function fetchApprovalStatus() {
      if (!currentPageData || currentPageData.length === 0) return;

      const results = await Promise.all(
        currentPageData.map(async (req) => {
          // Check if we already have the data
          if (approvalStatusMap[req.id]) return [req.id, approvalStatusMap[req.id]];

          try {
            const res = await fetcher(endpoints.leave.approvalByRequestId(req.id));
            return [req.id, res || []];
          } catch (err) {
            console.error(`Error fetching approval for request ${req.id}:`, err);
            return [req.id, []];
          }
        })
      );

      if (isMounted) {
        const newMap = Object.fromEntries(results);
        setApprovalStatusMap((prev) => ({ ...prev, ...newMap }));
      }
    }
    fetchApprovalStatus();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPageData]);

  // Get unique employee IDs from current page
  const uniqueEmployeeIds = useMemo(
    () => [...new Set(currentPageData.map((req) => req.employee_id))],
    [currentPageData]
  );

  // Fetch leave balances only for current page employees
  useEffect(() => {
    let isMounted = true;
    async function fetchBalances() {
      if (!Array.isArray(uniqueEmployeeIds) || uniqueEmployeeIds.length === 0) {
        return;
      }
      const results = await Promise.all(
        uniqueEmployeeIds.map((empId) =>
          fetcher(endpoints.leave.balanceByYear(empId, new Date().getFullYear())).catch(() => [])
        )
      );
      if (isMounted) {
        const newBalances = [].concat(...results);
        setLeaveBalances((prev) => {
          // Merge with existing, avoiding duplicates
          const merged = [...prev];
          newBalances.forEach((newBal) => {
            const existingIndex = merged.findIndex(
              (b) =>
                b.employee_id === newBal.employee_id && b.leave_type_name === newBal.leave_type_name
            );
            if (existingIndex === -1) {
              merged.push(newBal);
            } else {
              merged[existingIndex] = newBal;
            }
          });
          return merged;
        });
      }
    }
    fetchBalances();
    return () => {
      isMounted = false;
    };
  }, [uniqueEmployeeIds]);

  const memoizedValue = useMemo(
    () => ({
      datas:
        data && Array.isArray(data)
          ? data.map((req) => {
              // Find applied leave balance for this employee and leave type
              const appliedBalance = leaveBalances.find(
                (b) =>
                  b.employee_id === req.employee_id && b.leave_type_name === req.leave_policy_name
              );
              return {
                ...req,
                approval_status_tracking: (approvalStatusMap?.[req.id] || []).map((a) => ({
                  id: a.id,
                  approver: a.approver,
                  approver_name: a.approver_name,
                  level: a.level,
                  status: a.status,
                  comments: a.comments,
                  updated_at: a.updated_at,
                })),
                applied_leave_balance: appliedBalance
                  ? {
                      leave_policy_id: appliedBalance.leave_policy_id,
                      total_allowed: appliedBalance.total_allowed,
                      used: appliedBalance.used,
                      pending: appliedBalance.pending,
                      remaining: appliedBalance.remaining,
                    }
                  : null,
              };
            })
          : [],
      datasLoading: isLoading,
      datasError: error,
      datasValidating: isValidating,
      datasEmpty: !isLoading && !data?.length,
      // Expose pagination helpers
      setCurrentPage,
      setRowsPerPage,
      currentPage,
      rowsPerPage,
    }),
    [
      data,
      approvalStatusMap,
      leaveBalances,
      error,
      isLoading,
      isValidating,
      currentPage,
      rowsPerPage,
    ]
  );

  return memoizedValue;
}

export function useGetLeaveRequest(id) {
  const url = id ? endpoints.leave.requestById(id) : null;

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

export async function createLeaveRequest(data, employeeId) {
  const year = new Date().getFullYear();

  try {
    const res = await axios.post(endpoints.leave.request, data);

    await mutate(endpoints.leave.request);

    if (employeeId) {
      await mutate(endpoints.leave.requestByEmployeeId(employeeId));
    }

    await mutate(endpoints.leave.balanceByYear(employeeId, year));

    return res.data;
  } catch (error) {
    console.error('Error creating leave request:', error);
    throw error;
  }
}

export async function updateLeaveRequest(id, data) {
  const year = new Date().getFullYear();

  try {
    const res = await axios.patch(endpoints.leave.requestById(id), data);

    await mutate(endpoints.leave.request);
    await mutate(endpoints.leave.requestById(id));
    await mutate(endpoints.leave.requestByEmployeeId(res?.data?.employee_id));
    await mutate(endpoints.leave.approvalByRequestId(id));
    await mutate(endpoints.leave.balanceByYear(res?.data?.employee_id, year));

    return res.data;
  } catch (error) {
    console.error('Error updating leave request:', error);
    throw error;
  }
}

export async function deleteLeaveRequest(id, employeeId) {
  const year = new Date().getFullYear();

  try {
    const res = await axios.delete(endpoints.leave.requestById(id));

    await mutate(endpoints.leave.request);

    if (employeeId) {
      await mutate(endpoints.leave.requestByEmployeeId(employeeId));
    }

    await mutate(endpoints.leave.approvalByRequestId(id));
    await mutate(endpoints.leave.balanceByYear(employeeId, year));

    return res.data;
  } catch (error) {
    console.error('Error deleting leave request:', error);
    throw error;
  }
}

// ----------------------------------------------------------------------
// LEAVE APPROVALS
// ----------------------------------------------------------------------
export function useGetLeaveApprovals({ id }) {
  const url = id ? endpoints.leave.approvalByEmployee(id) : endpoints.leave.approval;

  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, swrOptions);

  // State to track pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(30);
  const [approvalsByRequest, setApprovalsByRequest] = useState({});
  const [leaveBalances, setLeaveBalances] = useState([]);

  // Get the current page data
  const currentPageData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    const start = currentPage * rowsPerPage;
    const end = start + rowsPerPage;
    return data.slice(start, end);
  }, [data, currentPage, rowsPerPage]);

  // Fetch approval lists only for current page items
  useEffect(() => {
    let isMounted = true;
    async function fetchApprovalsByRequest() {
      if (!currentPageData || currentPageData.length === 0) return;

      const uniqueRequestIds = [...new Set(currentPageData.map((a) => a.leave_request))];

      const results = await Promise.all(
        uniqueRequestIds.map(async (reqId) => {
          // Check if we already have the data
          if (approvalsByRequest[reqId]) return [reqId, approvalsByRequest[reqId]];

          try {
            const res = await fetcher(endpoints.leave.approvalByRequestId(reqId));
            return [reqId, res || []];
          } catch (err) {
            console.error(`Error fetching approvals for request ${reqId}:`, err);
            return [reqId, []];
          }
        })
      );

      if (isMounted) {
        const newMap = Object.fromEntries(results);
        setApprovalsByRequest((prev) => ({ ...prev, ...newMap }));
      }
    }
    fetchApprovalsByRequest();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPageData]);

  // Get unique employee IDs from current page
  const uniqueEmployeeIds = useMemo(
    () => [...new Set(currentPageData.map((a) => a.employee_id))],
    [currentPageData]
  );

  // Fetch leave balances only for current page employees
  useEffect(() => {
    let isMounted = true;
    async function fetchBalances() {
      if (!Array.isArray(uniqueEmployeeIds) || uniqueEmployeeIds.length === 0) {
        return;
      }
      const results = await Promise.all(
        uniqueEmployeeIds.map((empId) =>
          fetcher(endpoints.leave.balanceByYear(empId, new Date().getFullYear())).catch(() => [])
        )
      );
      if (isMounted) {
        const newBalances = [].concat(...results);
        setLeaveBalances((prev) => {
          // Merge with existing, avoiding duplicates
          const merged = [...prev];
          newBalances.forEach((newBal) => {
            const existingIndex = merged.findIndex(
              (b) =>
                b.employee_id === newBal.employee_id && b.leave_type_name === newBal.leave_type_name
            );
            if (existingIndex === -1) {
              merged.push(newBal);
            } else {
              merged[existingIndex] = newBal;
            }
          });
          return merged;
        });
      }
    }
    fetchBalances();
    return () => {
      isMounted = false;
    };
  }, [uniqueEmployeeIds]);

  // Attach approvalsByRequest and applied leave balance to each row
  const datasWithApprovals = useMemo(
    () =>
      data && Array.isArray(data)
        ? data.map((req) => {
            // Find applied leave balance for this employee and leave type
            const appliedBalance = leaveBalances.find(
              (b) =>
                b.employee_id === req.employee_id && b.leave_type_name === req.leave_request_name
            );
            return {
              ...req,
              approval_status_tracking: (approvalsByRequest?.[req.leave_request] || []).map(
                (a) => ({
                  id: a.id,
                  approver: a.approver,
                  approver_name: a.approver_name,
                  level: a.level,
                  status: a.status,
                  comments: a.comments,
                  updated_at: a.updated_at,
                })
              ),
              applied_leave_balance: appliedBalance
                ? {
                    leave_policy_id: appliedBalance.leave_policy_id,
                    total_allowed: appliedBalance.total_allowed,
                    used: appliedBalance.used,
                    pending: appliedBalance.pending,
                    remaining: appliedBalance.remaining,
                  }
                : null,
            };
          })
        : [],
    [data, approvalsByRequest, leaveBalances]
  );

  const memoizedValue = useMemo(
    () => ({
      datas: datasWithApprovals,
      datasLoading: isLoading,
      datasError: error,
      datasValidating: isValidating,
      datasEmpty: !isLoading && !data?.length,
      // Expose pagination helpers
      setCurrentPage,
      setRowsPerPage,
      currentPage,
      rowsPerPage,
    }),
    [datasWithApprovals, error, isLoading, isValidating, data?.length, currentPage, rowsPerPage]
  );

  return memoizedValue;
}

export function useGetLeaveApproval(id) {
  const url = id ? endpoints.leave.approvalById(id) : null;

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

export async function updateLeaveApproval(id, data, currentUserId, leaveRequest) {
  try {
    const res = await axios.patch(endpoints.leave.approvalById(id), data);
    const responseData = res?.data || {};

    const approverId =
      currentUserId ||
      responseData.approver_id ||
      (typeof responseData.approver === 'number' || typeof responseData.approver === 'string'
        ? responseData.approver
        : responseData.approver?.id);
    const leaveRequestId = leaveRequest || responseData.leave_request;

    const mutateKeys = [endpoints.leave.approvalById(id), endpoints.leave.approval];

    if (approverId) {
      mutateKeys.push(endpoints.leave.approvalByEmployee(approverId));
    }

    if (leaveRequestId) {
      mutateKeys.push(endpoints.leave.approvalByRequestId(leaveRequestId));
    }

    await Promise.all(mutateKeys.map((key) => mutate(key, undefined, { revalidate: true })));

    return responseData;
  } catch (error) {
    console.error('Error updating leave approval:', error);
    throw error;
  }
}

export async function deleteLeaveApproval(id) {
  try {
    const res = await axios.delete(endpoints.leave.approvalById(id));

    await mutate(endpoints.leave.approval);

    return res.data;
  } catch (error) {
    console.error('Error deleting leave approval:', error);
    throw error;
  }
}

// ----------------------------------------------------------------------
// LEAVE BALANCE
// ----------------------------------------------------------------------
export function useGetLeaveBalance(filters = {}) {
  const { user } = useAuthContext();

  let url =
    user?.role === 'Supervisor'
      ? endpoints.leave.balanceBySupervisor(user?.employee_id)
      : endpoints.leave.balance;

  // append date filters if provided
  const params = [];
  if (filters.from_date) params.push(`from_date=${filters.from_date}`);
  if (filters.to_date) params.push(`to_date=${filters.to_date}`);
  if (params.length) {
    url += `?${params.join('&')}`;
  }

  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      data: data || [],
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      dataEmpty: !isLoading && !data,
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

export function useGetLeaveBalanceByYear(employeeId, filteredYear) {
  const year = filteredYear || new Date().getFullYear();
  const url = employeeId && year ? endpoints.leave.balanceByYear(employeeId, year) : null;

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

// ----------------------------------------------------------------------
// COMPENSATORY LEAVE
// ----------------------------------------------------------------------
export function useGetCompensatoryLeave(employeeId) {
  const firstDayOfMonth = dayjs().startOf('month').format('YYYY-MM-DD');

  const url = employeeId ? endpoints.leave.compensatory(employeeId, firstDayOfMonth) : null;

  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      data: data || [],
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      dataEmpty: !isLoading && !data?.length,
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}
