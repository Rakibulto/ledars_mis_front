import dayjs from 'dayjs';
import useSWR, { mutate } from 'swr';
import { useMemo, useEffect } from 'react';

import axios, { fetcher, endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

const swrOptions = {
  revalidateIfStale: true,
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  refreshWhenOffline: false,
  dedupingInterval: 10000, // Prevent duplicate requests within 10 seconds
  errorRetryCount: 2, // Retry failed requests up to 2 times
  errorRetryInterval: 10000, // Wait 10 seconds before retrying
};

// ----------------------------------------------------------------------

export function useGetAttendances(page = 1, pageSize = 30, filters = {}) {
  const { user } = useAuthContext();

  // Determine based on user role
  let url = null;

  if (user) {
    const isAdmin = user.role === 'Admin' || user.role === 'Supervisor';

    // Build query parameters
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('page_size', pageSize);

    // Add filter parameters
    if (filters.employee) {
      params.append('employee', filters.employee);
    }
    if (filters.status && filters.status !== 'all') {
      params.append('attendance_status', filters.status);
    }
    if (filters.startDate) {
      params.append('start_date', dayjs(filters.startDate).format('YYYY-MM-DD'));
    }
    if (filters.endDate) {
      params.append('end_date', dayjs(filters.endDate).format('YYYY-MM-DD'));
    }
    if (filters.keyword) {
      params.append('keyword', filters.keyword);
    }

    // Can view all attendance data
    if (isAdmin) {
      url = `${endpoints.attendance.list}&${params.toString()}`;
    }
    // Only fetch own attendance data
    else if (user.employee_id) {
      url = `${endpoints.attendance.byEmployeeId(user.employee_id)}&${params.toString()}`;
    }
  }

  const { data, error, isLoading, isValidating } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      attendances: data?.results || [],
      attendancesLoading: isLoading,
      attendancesError: error,
      attendancesValidating: isValidating,
      attendancesEmpty: !isLoading && !data?.results?.length,
      pagination: {
        count: data?.count || 0,
        next: data?.next,
        previous: data?.previous,
        currentPage: page,
        pageSize,
      },
    }),
    [data, error, isLoading, isValidating, page, pageSize]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

export function useGetEmployeeAttendance(employeeId, startDate, endDate, forceReload = 0) {
  let url = employeeId ? endpoints.attendance.reportByEmployeeId(employeeId) : null;

  if (url && startDate && endDate) {
    const startDateObj = dayjs(startDate);
    const endDateObj = dayjs(endDate);

    if (startDateObj.isValid() && endDateObj.isValid()) {
      const params = new URLSearchParams();
      params.append('start_date', startDateObj.format('YYYY-MM-DD'));
      params.append('end_date', endDateObj.format('YYYY-MM-DD'));
      url = `${url}/?${params.toString()}`;
    } else {
      // If dates are invalid, return null to prevent API call
      url = null;
    }
  }

  const { data, isLoading, error, isValidating } = useSWR(
    url ? [url, forceReload] : null, // Include forceReload in the key
    ([link]) => fetcher(link), // Extract only the URL for fetcher
    swrOptions
  );

  // Manually trigger revalidation when forceReload changes
  useEffect(() => {
    if (forceReload > 0 && url) {
      mutate(url);
    }
  }, [forceReload, url]);

  const memoizedValue = useMemo(
    () => ({
      attendances: data || [],
      attendancesLoading: isLoading,
      attendancesError: error,
      attendancesValidating: isValidating,
      attendancesEmpty: !isLoading && !data?.length,
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

export function useGetAttendanceReport({
  timePeriod,
  selectedDate,
  departmentFilter,
  designationFilter,
  keywordFilter,
  showOvertimeOnly,
  branch,
  lateIn,
  onLeave,
  absent,
  present,
  earlyOut,
}) {
  const queryParams = new URLSearchParams();

  if (timePeriod === 'today') {
    const today = dayjs().format('YYYY-MM-DD');
    queryParams.append('start_date', today);
    queryParams.append('end_date', today);
  } else if (timePeriod === 'yesterday') {
    const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
    queryParams.append('start_date', yesterday);
    queryParams.append('end_date', yesterday);
  } else if (timePeriod === 'dateRange' && selectedDate) {
    const dateObj = dayjs(selectedDate);
    if (dateObj.isValid()) {
      const formattedDate = dateObj.format('YYYY-MM-DD');
      queryParams.append('start_date', formattedDate);
      queryParams.append('end_date', formattedDate);
    }
  }

  if (departmentFilter) queryParams.append('department', departmentFilter);
  if (designationFilter) queryParams.append('designation', designationFilter);
  if (keywordFilter) queryParams.append('keywords', keywordFilter);
  if (showOvertimeOnly) queryParams.append('overtime_only', 'true');
  if (lateIn) queryParams.append('late_in', 'true');
  if (onLeave) queryParams.append('on_leave', 'true');
  if (absent) queryParams.append('absent', 'true');
  if (present) queryParams.append('present', 'true');
  if (earlyOut) queryParams.append('early_out', 'true');
  if (branch) queryParams.append('branch', branch);

  const queryString = queryParams.toString();

  const url = `${endpoints.attendance.report}${queryString ? `?${queryString}` : ''}`;

  const { data, error, isLoading, isValidating } = useSWR(url, fetcher, swrOptions);

  const { tableData, pagination } = useMemo(() => {
    if (!data || !Array.isArray(data)) {
      return { tableData: [], pagination: { total_count: 0 } };
    }

    const flattenedData = [];
    let totalCount = 0;

    data.forEach((employeeData) => {
      const { employee_info, attendance } = employeeData;

      if (Array.isArray(attendance)) {
        attendance.forEach((record) => {
          flattenedData.push({
            id: `${employee_info.employeeId}-${record.date}-${record.check_in || ''}`,
            user_info: employee_info,
            ...record,
          });
        });

        totalCount += attendance.length;
      }
    });

    return {
      tableData: flattenedData,
      pagination: {
        total_count: totalCount,
      },
    };
  }, [data]);

  return {
    tableData,
    pagination,
    isLoading,
    rawData: data,
    isError: !!error,
    mutate,
  };
}

// ----------------------------------------------------------------------

export function useGetMonthlyAttendanceReport({
  timePeriod,
  selectedYear,
  selectedMonth,
  departmentFilter,
  designationFilter,
  keywordFilter,
  branchFilter,
  lateIn,
  onLeave,
  absent,
  present,
  earlyOut,
  page = 1,
  startDate,
  endDate,
  cutoffDay = null,
}) {
  const queryParams = new URLSearchParams();

  // Add pagination parameters
  queryParams.append('page', page);
  queryParams.append('page_size', '100');
  queryParams.append('pagination', 'true');

  const effectiveCutoffDay = cutoffDay || 25;

  if (startDate && endDate) {
    queryParams.append('start_date', dayjs(startDate).format('YYYY-MM-DD'));
    queryParams.append('end_date', dayjs(endDate).format('YYYY-MM-DD'));
  } else if (!timePeriod && selectedYear && selectedMonth) {
    const currentMonth = dayjs(`${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`);
    const prevMonth = currentMonth.subtract(1, 'month');
    const daysInPrevMonth = prevMonth.daysInMonth();
    const startDay = Math.min(effectiveCutoffDay + 1, daysInPrevMonth);
    const start = prevMonth.date(startDay).format('YYYY-MM-DD');
    const daysInCurrentMonth = currentMonth.daysInMonth();
    const endDay = Math.min(effectiveCutoffDay, daysInCurrentMonth);
    const end = currentMonth.date(endDay).format('YYYY-MM-DD');
    queryParams.append('start_date', start);
    queryParams.append('end_date', end);
  } else if (timePeriod === 'thisMonth' && selectedYear && selectedMonth) {
    const currentMonth = dayjs(`${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`);
    const prevMonth = currentMonth.subtract(1, 'month');
    const daysInPrevMonth = prevMonth.daysInMonth();
    const startDay = Math.min(effectiveCutoffDay + 1, daysInPrevMonth);
    const start = prevMonth.date(startDay).format('YYYY-MM-DD');
    const end = dayjs().format('YYYY-MM-DD');
    queryParams.append('start_date', start);
    queryParams.append('end_date', end);
  } else if (timePeriod === 'lastMonth' && selectedYear && selectedMonth) {
    const prevMonth = dayjs(
      `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`
    ).subtract(1, 'month');
    const prevPrevMonth = prevMonth.subtract(1, 'month');
    const daysInPrevPrevMonth = prevPrevMonth.daysInMonth();
    const startDay = Math.min(effectiveCutoffDay + 1, daysInPrevPrevMonth);
    const start = prevPrevMonth.date(startDay).format('YYYY-MM-DD');
    const daysInPrevMonth = prevMonth.daysInMonth();
    const endDay = Math.min(effectiveCutoffDay, daysInPrevMonth);
    const end = prevMonth.date(endDay).format('YYYY-MM-DD');
    queryParams.append('start_date', start);
    queryParams.append('end_date', end);
  } else if (timePeriod === 'last7Days') {
    const last7DaysEnd = dayjs().format('YYYY-MM-DD');
    const last7DaysStart = dayjs().subtract(6, 'day').format('YYYY-MM-DD');
    queryParams.append('start_date', last7DaysStart);
    queryParams.append('end_date', last7DaysEnd);
  } else if (timePeriod === 'last15Days') {
    const last15DaysEnd = dayjs().format('YYYY-MM-DD');
    const last15DaysStart = dayjs().subtract(14, 'day').format('YYYY-MM-DD');
    queryParams.append('start_date', last15DaysStart);
    queryParams.append('end_date', last15DaysEnd);
  } else if (timePeriod === 'last30Days') {
    const last30DaysEnd = dayjs().format('YYYY-MM-DD');
    const last30DaysStart = dayjs().subtract(29, 'day').format('YYYY-MM-DD');
    queryParams.append('start_date', last30DaysStart);
    queryParams.append('end_date', last30DaysEnd);
  }

  if (departmentFilter) queryParams.append('department', departmentFilter);
  if (designationFilter) queryParams.append('designation', designationFilter);
  if (keywordFilter) queryParams.append('keywords', keywordFilter);
  if (branchFilter) queryParams.append('branch', branchFilter);
  if (lateIn) queryParams.append('late_in', 'true');
  if (onLeave) queryParams.append('on_leave', 'true');
  if (absent) queryParams.append('absent', 'true');
  if (present) queryParams.append('present', 'true');
  if (earlyOut) queryParams.append('early_out', 'true');

  const queryString = queryParams.toString();

  const url =
    cutoffDay === null && !startDate && !endDate
      ? null
      : `${endpoints.attendance.report}${queryString ? `?${queryString}` : ''}`;

  const { data, error, isLoading, isValidating } = useSWR(url, fetcher, swrOptions);

  const { tableData, pagination } = useMemo(() => {
    let normalizedData = [];
    let paginationInfo = {
      total_count: 0,
      page: page || 1,
      next: null,
      previous: null,
    };

    // Handle paginated response from backend
    if (data && typeof data === 'object' && data.results && Array.isArray(data.results)) {
      normalizedData = data.results;
      paginationInfo = {
        total_count: data.count || 0,
        page: data.page || page || 1,
        next: data.next,
        previous: data.previous,
      };
    }
    // Handle legacy non-paginated response
    else if (Array.isArray(data)) {
      normalizedData = data;
      paginationInfo.total_count = data.length;
    } else if (
      data &&
      typeof data === 'object' &&
      data.employee_info &&
      Array.isArray(data.attendance)
    ) {
      normalizedData = [data];
      paginationInfo.total_count = 1;
    }

    return {
      tableData: normalizedData,
      pagination: paginationInfo,
    };
  }, [data, page]);

  return {
    tableData,
    pagination,
    isLoading,
    isValidating,
    rawData: data,
    isError: !!error,
    mutate,
  };
}

// ----------------------------------------------------------------------

export async function createAttendanceAdjustment(data) {
  try {
    const res = await axios.post(endpoints.attendance.adjustment, data);

    mutate(endpoints.attendance.approvalByEmployee(data?.employee));

    return res.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

// ----------------------------------------------------------------------

export async function updateAttendanceAdjustment(id, data) {
  try {
    const res = await axios.patch(endpoints.attendance.adjustmentUpdate(id), data);

    if (data?.employee) {
      mutate(endpoints.attendance.approvalByEmployee(data.employee));
    }
    await mutate((key) => typeof key === 'string' && key.includes(endpoints.attendance.approval));

    return res.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

// ----------------------------------------------------------------------

export async function deleteAttendanceAdjustment(id, employeeId) {
  try {
    const res = await axios.delete(endpoints.attendance.adjustmentUpdate(id));

    if (employeeId) {
      mutate(endpoints.attendance.approvalByEmployee(employeeId));
    }
    mutate(endpoints.attendance.approval);

    return res.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

// ----------------------------------------------------------------------

export function useGetAttendanceAdjustments(options = {}) {
  const { id, page = 1, pageSize = 10 } = options;

  const { user } = useAuthContext();

  const isSupervisor = user?.role === 'Supervisor';
  const isAdmin = user?.role === 'Admin';

  const params = new URLSearchParams();
  params.append('pagination', 'true');
  params.append('page', page);
  params.append('page_size', pageSize);

  const baseUrl = id
    ? endpoints.attendance.approvalByEmployee(id)
    : isAdmin
      ? endpoints.attendance.approval
      : isSupervisor
        ? endpoints.attendance.approvalBySupervisor(user?.id)
        : endpoints.attendance.approvalByEmployee(user?.id);

  const separator = baseUrl.includes('?') ? '&' : '?';
  const url = `${baseUrl}${separator}${params.toString()}`;

  const {
    data,
    error,
    isLoading,
    isValidating,
    mutate: mutateKey,
  } = useSWR(url, fetcher, swrOptions);

  const filteredApprovals = useMemo(() => {
    if (!Array.isArray(data?.results)) return [];

    // Group by adjustment_request
    const grouped = {};
    const order = [];
    data.results.forEach((item) => {
      const key = item.adjustment_request;
      if (!grouped[key]) {
        grouped[key] = {
          ...item,
          approvers: [],
        };
        order.push(key);
      }
      grouped[key].approvers.push({
        approver: item.approver,
        approver_name: item.approver_name,
        comments: item.comments,
        action_date: item.action_date,
        status: item.status,
      });
    });
    return order.map((key) => {
      const { approver, approver_name, comments, action_date, status, ...rest } = grouped[key];
      return rest;
    });
  }, [data]);

  return useMemo(
    () => ({
      approvals: filteredApprovals,
      approvalsLoading: isLoading,
      approvalsError: error,
      approvalsValidating: isValidating,
      approvalsEmpty: !isLoading && !filteredApprovals?.length,
      pagination: {
        count: data?.count || 0,
        next: data?.next,
        previous: data?.previous,
        page: data?.page || page,
      },
      refetch: mutateKey,
    }),
    [filteredApprovals, error, isLoading, isValidating, data, page, mutateKey]
  );
}

export function useGetAttendanceApprovals({ id, params = {} }) {
  const { user } = useAuthContext();

  const isSupervisor = user?.role === 'Supervisor';
  const isAdmin = user?.role === 'Admin';

  const baseUrl = id
    ? endpoints.attendance.approvalByEmployee(id)
    : isAdmin
      ? endpoints.attendance.approval
      : isSupervisor
        ? endpoints.attendance.approvalBySupervisor(user?.id)
        : endpoints.attendance.approvalByEmployee(user?.id);

  // Build URL with params
  const queryString = Object.keys(params).length > 0 ? new URLSearchParams(params).toString() : '';
  const separator = baseUrl.includes('?') ? '&' : '?';
  const url = queryString ? `${baseUrl}${separator}${queryString}` : baseUrl;

  const { data, error, isLoading, isValidating } = useSWR(url, fetcher, swrOptions);

  const filteredApprovals = useMemo(() => {
    // Handle paginated response
    if (data?.results) {
      return data.results;
    }

    // Handle non-paginated response (when id is provided and no pagination params)
    if (id && Array.isArray(data)) {
      // Group by adjustment_request, collect all approvers/comments/action_date per request
      const grouped = {};
      const order = [];
      data.forEach((item) => {
        const key = item.adjustment_request;
        if (!grouped[key]) {
          grouped[key] = {
            ...item,
            approvers: [],
          };
          order.push(key); // Track order of first appearance
        }
        grouped[key].approvers.push({
          approver: item.approver,
          approver_name: item.approver_name,
          comments: item.comments,
          action_date: item.action_date,
          status: item.status,
        });
      });
      // Remove duplicate top-level approver/comments/action_date fields
      return order.map((key) => {
        const { approver, approver_name, comments, action_date, status, ...rest } = grouped[key];
        return rest;
      });
    }
    return data || [];
  }, [data, id]);

  return useMemo(
    () => ({
      approvals: filteredApprovals,
      approvalsLoading: isLoading,
      approvalsError: error,
      approvalsValidating: isValidating,
      approvalsEmpty: !isLoading && !filteredApprovals?.length,
      pagination: {
        count: data?.count || 0,
        next: data?.next,
        previous: data?.previous,
        current_page: data?.current_page,
        total_pages: data?.total_pages,
      },
    }),
    [filteredApprovals, error, isLoading, isValidating, data]
  );
}

export function useGetAttendanceApproval({ id }) {
  const url = id ? endpoints.attendance.approvalById(id) : null;

  const { data, error, isLoading, isValidating } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      approval: data || {},
      approvalLoading: isLoading,
      approvalError: error,
      approvalValidating: isValidating,
      approvalEmpty: !isLoading && !data?.length,
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

export async function updateAttendanceApproval(id, { status, comments, userId }, params = {}) {
  try {
    const res = await axios.patch(endpoints.attendance.updateApproval(id), {
      status,
      comments,
    });

    const queryString =
      Object.keys(params).length > 0 ? new URLSearchParams(params).toString() : '';
    const approvalUrl = queryString
      ? `${endpoints.attendance.approval}?${queryString}`
      : endpoints.attendance.approval;

    if (userId) {
      const supervisorUrl = queryString
        ? `${endpoints.attendance.approvalBySupervisor(userId)}&${queryString}`
        : endpoints.attendance.approvalBySupervisor(userId);
      mutate(supervisorUrl);
    }

    mutate(approvalUrl);
    await mutate((key) => typeof key === 'string' && key.includes(endpoints.attendance.approval));

    return res.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function createAttendance(data) {
  try {
    const res = await axios.post(endpoints.attendance.create, data);

    // Mutate all attendance list endpoints (with any query parameters)
    await mutate((key) => typeof key === 'string' && key.includes(endpoints.attendance.list));

    return res.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function updateAttendance(id, data) {
  try {
    const res = await axios.patch(endpoints.attendance.updateDelete(id), data);

    // Mutate all attendance list endpoints (with any query parameters)
    await mutate((key) => typeof key === 'string' && key.includes(endpoints.attendance.list));

    return res.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function deleteAttendance(id) {
  try {
    const res = await axios.delete(endpoints.attendance.updateDelete(id));

    // Mutate all attendance list endpoints (with any query parameters)
    await mutate((key) => typeof key === 'string' && key.includes(endpoints.attendance.list));

    return res.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

// ----------------------------------------------------------------------

export function useEmployeeTimestamps(employeeId, date) {
  // Convert DD-MM-YYYY to YYYY-MM-DD if needed
  let formattedDate = date;
  if (date && /^\d{2}-\d{2}-\d{4}$/.test(date)) {
    formattedDate = dayjs(date, 'DD-MM-YYYY').format('YYYY-MM-DD');
  }

  const url =
    !!employeeId && !!formattedDate
      ? endpoints.attendance.timestamps(employeeId, formattedDate)
      : null;

  const { data, error, isLoading } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(() => {
    let timestamps = [];
    if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0].timestamps)) {
      const [{ timestamps: ts }] = data;
      timestamps = ts;
    }

    return {
      fetchedTimestamps: timestamps,
      raw: data,
      isLoading,
      error,
    };
  }, [data, error, isLoading]);

  return memoizedValue;
}

export function useUserAttendanceByDate(userId, selectedDate) {
  // Format date to YYYY-MM-DD for API
  const formattedDate = dayjs(selectedDate).format('YYYY-MM-DD');

  const url = userId
    ? `${endpoints.attendance.reportByDate(userId, formattedDate, formattedDate)}`
    : null;

  const { data, error, isLoading } = useSWR(url, fetcher);

  const attendanceData = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return {
        hasData: false,
        employeeInfo: {},
        checkIn: null,
        checkOut: null,
        isLate: false,
        lateBy: null,
        earlyOutBy: null,
        status: 'Not Found',
        remarks: null,
        date: formattedDate,
      };
    }

    const employeeInfo = data[0]?.employee_info || {};
    const attendance = data[0]?.attendance?.[0] || {};

    return {
      hasData: !!attendance?.date,
      employeeInfo,
      checkIn: attendance?.check_in || null,
      checkOut: attendance?.check_out || null,
      isLate: !!attendance?.is_late,
      lateBy: attendance?.late_by || null,
      earlyOutBy: attendance?.early_out_by || null,
      status: attendance?.status || 'Not Found',
      remarks: attendance?.remarks || null,
      date: attendance?.date || formattedDate,
    };
  }, [data, formattedDate]);

  return {
    attendanceData,
    isLoading,
    isError: !!error,
  };
}

export function useGetAttendanceByDate(employeeId, date) {
  // Convert DD-MM-YYYY to YYYY-MM-DD if needed
  let formattedDate = date;
  if (date && /^\d{2}-\d{2}-\d{4}$/.test(date)) {
    formattedDate = dayjs(date, 'DD-MM-YYYY').format('YYYY-MM-DD');
  } else {
    const dateObj = dayjs(date);
    formattedDate = dateObj.isValid() ? dateObj.format('YYYY-MM-DD') : null;
  }

  const url =
    employeeId && formattedDate
      ? endpoints.attendance.reportByDate(employeeId, formattedDate, formattedDate)
      : null;

  const { data, error, isLoading, mutate: refetch } = useSWR(url, fetcher, swrOptions);

  const attendanceData = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return {
        employeeInfo: {},
        attendance: null,
        hasData: false,
      };
    }

    const employeeInfo = data[0]?.employee_info || {};
    const attendance = data[0]?.attendance?.[0] || null;

    return {
      employeeInfo,
      attendance,
      hasData: !!attendance,
    };
  }, [data]);

  return {
    attendanceData,
    isLoading,
    isError: !!error,
    refetch,
  };
}

// ----------------------------------------------------------------------

export function useGetAttendanceShift(employeeId, date) {
  let formattedDate = date;
  if (date && /^\d{2}-\d{2}-\d{4}$/.test(date)) {
    formattedDate = dayjs(date, 'DD-MM-YYYY').format('YYYY-MM-DD');
  } else {
    const dateObj = dayjs(date);
    formattedDate = dateObj.isValid() ? dateObj.format('YYYY-MM-DD') : null;
  }

  const url =
    employeeId && formattedDate
      ? `${endpoints.attendance.shift}?employee=${employeeId}&date=${formattedDate}`
      : null;

  const { data, error, isLoading, mutate: refetch } = useSWR(url, fetcher, swrOptions);

  return {
    shiftData: data || {},
    isLoading,
    isError: !!error,
    error,
    refetch,
  };
}
