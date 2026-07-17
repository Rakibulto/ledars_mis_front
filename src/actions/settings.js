import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axios, { fetcher, endpoints } from 'src/utils/axios';

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

// === DEPARTMENTS ===
export function useGetDepartments(enabled = true) {
  const url = enabled ? endpoints.settings.departments : null;

  const { data, error, isLoading } = useSWR(url, fetcher, swrOptions);

  return useMemo(
    () => ({
      departments: data || [],
      departmentsLoading: isLoading,
      departmentsError: error,
      departmentsEmpty: !isLoading && !data?.length,
    }),
    [data, error, isLoading]
  );
}

export async function createDepartment(data) {
  const res = await axios.post(endpoints.settings.departments, data);

  await mutate(endpoints.settings.departments);

  return res.data;
}

export async function updateDepartment(id, data) {
  const res = await axios.patch(endpoints.settings.departmentById(id), data);

  await mutate(endpoints.settings.departments);
  await mutate(endpoints.settings.departmentById(id));

  return res.data;
}

export async function deleteDepartment(id) {
  const res = await axios.delete(endpoints.settings.departmentById(id));

  await mutate(endpoints.settings.departments);

  return res.data;
}

// === DESIGNATIONS ===
export function useGetDesignations(enabled = true) {
  const url = enabled ? endpoints.settings.designation : null;

  const { data, error, isLoading } = useSWR(url, fetcher, swrOptions);

  return useMemo(
    () => ({
      designations: data || [],
      designationsLoading: isLoading,
      designationsError: error,
      designationsEmpty: !isLoading && !data?.length,
    }),
    [data, error, isLoading]
  );
}

export async function createDesignation(data) {
  const res = await axios.post(endpoints.settings.designation, data);

  await mutate(endpoints.settings.designation);

  return res.data;
}

export async function updateDesignation(id, data) {
  const res = await axios.patch(endpoints.settings.designationById(id), data);

  await mutate(endpoints.settings.designation);
  await mutate(endpoints.settings.designationById(id));

  return res.data;
}

export async function deleteDesignation(id) {
  const res = await axios.delete(endpoints.settings.designationById(id));

  await mutate(endpoints.settings.designation);

  return res.data;
}

// === BRANCHES ===
export function useGetBranches(enabled = true) {
  const url = enabled ? endpoints.settings.branch : null;

  const { data, error, isLoading } = useSWR(url, fetcher, swrOptions);

  return useMemo(
    () => ({
      branches: data || [],
      branchesLoading: isLoading,
      branchesError: error,
      branchesEmpty: !isLoading && !data?.length,
    }),
    [data, error, isLoading]
  );
}

export async function createBranch(data) {
  const res = await axios.post(endpoints.settings.branch, data);

  await mutate(endpoints.settings.branch);

  return res.data;
}

export async function updateBranch(id, data) {
  const res = await axios.patch(endpoints.settings.branchById(id), data);

  await mutate(endpoints.settings.branch);
  await mutate(endpoints.settings.branchById(id));

  return res.data;
}

export async function deleteBranch(id) {
  const res = await axios.delete(endpoints.settings.branchById(id));

  await mutate(endpoints.settings.branch);

  return res.data;
}

// === GRADES ===
export function useGetGrades(enabled = true) {
  const url = enabled ? endpoints.settings.grade : null;

  const { data, error, isLoading } = useSWR(url, fetcher, swrOptions);

  return useMemo(
    () => ({
      grades: data || [],
      gradesLoading: isLoading,
      gradesError: error,
      gradesEmpty: !isLoading && !data?.length,
    }),
    [data, error, isLoading]
  );
}

export async function createGrade(data) {
  const res = await axios.post(endpoints.settings.grade, data);

  await mutate(endpoints.settings.grade);

  return res.data;
}

export async function updateGrade(id, data) {
  const res = await axios.patch(endpoints.settings.gradeById(id), data);

  await mutate(endpoints.settings.grade);
  await mutate(endpoints.settings.gradeById(id));

  return res.data;
}

export async function deleteGrade(id) {
  const res = await axios.delete(endpoints.settings.gradeById(id));

  await mutate(endpoints.settings.grade);

  return res.data;
}

// === SHIFTS ===
export function useGetShifts() {
  const url = endpoints.settings.shift;

  const { data, error, isLoading } = useSWR(url, fetcher, swrOptions);

  return useMemo(
    () => ({
      shifts: data || [],
      shiftsLoading: isLoading,
      shiftsError: error,
      shiftsEmpty: !isLoading && !data?.length,
    }),
    [data, error, isLoading]
  );
}

export async function createShift(data) {
  const res = await axios.post(endpoints.settings.shiftCreate, data);

  await mutate(endpoints.settings.shift);

  return res.data;
}

export async function updateShift(id, data) {
  const res = await axios.patch(endpoints.settings.shiftById(id), data);

  await mutate(endpoints.settings.shift);
  await mutate(endpoints.settings.shiftById(id));

  return res.data;
}

export async function deleteShift(id) {
  const res = await axios.delete(endpoints.settings.shiftById(id));

  await mutate(endpoints.settings.shift);

  return res.data;
}

// === ROLES ===
export function useGetRoles() {
  const url = endpoints.settings.roles;

  const { data, error, isLoading } = useSWR(url, fetcher, swrOptions);

  return useMemo(
    () => ({
      roles: data || [],
      rolesLoading: isLoading,
      rolesError: error,
      rolesEmpty: !isLoading && !data?.length,
    }),
    [data, error, isLoading]
  );
}

export async function createRole(data) {
  const res = await axios.post(endpoints.settings.roles, data);

  await mutate(endpoints.settings.roles);

  return res.data;
}

export async function updateRole(id, data) {
  const res = await axios.patch(endpoints.settings.roleById(id), data);

  await mutate(endpoints.settings.roles);
  await mutate(endpoints.settings.roleById(id));

  return res.data;
}

export async function deleteRole(id) {
  const res = await axios.delete(endpoints.settings.roleById(id));

  await mutate(endpoints.settings.roles);

  return res.data;
}

// === LEAVE GROUPS ===
export function useGetLeaveGroups(enabled = true) {
  const url = enabled ? endpoints.settings.leaveGroup : null;

  const { data, error, isLoading } = useSWR(url, fetcher, swrOptions);

  return useMemo(
    () => ({
      leaveGroups: data || [],
      leaveGroupsLoading: isLoading,
      leaveGroupsError: error,
      leaveGroupsEmpty: !isLoading && !data?.length,
    }),
    [data, error, isLoading]
  );
}

export async function createLeaveGroup(data) {
  const res = await axios.post(endpoints.settings.leaveGroup, data);

  await mutate(endpoints.settings.leaveGroup);

  return res.data;
}

export async function updateLeaveGroup(id, data) {
  const res = await axios.patch(endpoints.settings.leaveGroupById(id), data);

  await mutate(endpoints.settings.leaveGroup);
  await mutate(endpoints.settings.leaveGroupById(id));

  return res.data;
}

export async function deleteLeaveGroup(id) {
  const res = await axios.delete(endpoints.settings.leaveGroupById(id));

  await mutate(endpoints.settings.leaveGroup);

  return res.data;
}

// === LEAVE POLICIES ===
export function useGetLeavePolicies() {
  const url = endpoints.settings.leavePolicy;

  const { data, error, isLoading } = useSWR(url, fetcher, swrOptions);

  return useMemo(
    () => ({
      leavePolicies: data || [],
      leavePoliciesLoading: isLoading,
      leavePoliciesError: error,
      leavePoliciesEmpty: !isLoading && !data?.length,
    }),
    [data, error, isLoading]
  );
}

export async function createLeavePolicy(data) {
  const res = await axios.post(endpoints.settings.leavePolicy, data);

  await mutate(endpoints.settings.leavePolicy);

  return res.data;
}

export async function updateLeavePolicy(id, data) {
  const res = await axios.patch(endpoints.settings.leavePolicyById(id), data);

  await mutate(endpoints.settings.leavePolicy);
  await mutate(endpoints.settings.leavePolicyById(id));

  return res.data;
}

export async function deleteLeavePolicy(id) {
  const res = await axios.delete(endpoints.settings.leavePolicyById(id));

  await mutate(endpoints.settings.leavePolicy);

  return res.data;
}

// === PRE-APPROVED IPs ===
export function useGetPreapprovedIps() {
  const url = endpoints.settings.ipList;

  const { data, error, isLoading } = useSWR(url, fetcher, swrOptions);

  return useMemo(
    () => ({
      preapprovedIps: data || [],
      preapprovedIpsLoading: isLoading,
      preapprovedIpsError: error,
      preapprovedIpsEmpty: !isLoading && !data?.length,
    }),
    [data, error, isLoading]
  );
}

export async function createPreapprovedIp(data) {
  const res = await axios.post(endpoints.settings.ipCreate, data);

  await mutate(endpoints.settings.ipList);

  return res.data;
}

export async function updatePreapprovedIp(id, data) {
  const res = await axios.patch(endpoints.settings.ipById(id), { id, ...data });

  await mutate(endpoints.settings.ipList);
  await mutate(endpoints.settings.ipById(id));

  return res.data;
}

export async function deletePreapprovedIp(id) {
  const res = await axios.delete(endpoints.settings.ipById(id));

  await mutate(endpoints.settings.ipList);

  return res.data;
}

// === SUPERVISOR LEVELS ===
export function useGetSupervisorLevels() {
  const url = endpoints.settings.supervisorLevel;

  const { data, error, isLoading } = useSWR(url, fetcher, swrOptions);

  return useMemo(
    () => ({
      supervisorLevels: data || [],
      supervisorLevelsLoading: isLoading,
      supervisorLevelsError: error,
      supervisorLevelsEmpty: !isLoading && !data?.length,
    }),
    [data, error, isLoading]
  );
}

export async function createSupervisorLevel(data, employeeId) {
  const res = await axios.post(endpoints.settings.supervisorLevel, data);

  await mutate(endpoints.settings.supervisorLevel);
  await mutate(endpoints.employee.details(data?.employee));
  await mutate(endpoints.settings.employeeSupervisorLevel(employeeId));

  return res.data;
}

export async function updateSupervisorLevel(id, data, employeeId) {
  const res = await axios.patch(endpoints.settings.supervisorLevelById(id), data);

  await mutate(endpoints.settings.supervisorLevel);
  await mutate(endpoints.settings.supervisorLevelById(id));
  await mutate(endpoints.settings.employeeSupervisorLevel(employeeId));
  await mutate(endpoints.employee.details(data?.employee));

  return res.data;
}

export async function deleteSupervisorLevel(id, employeeId, userId) {
  const res = await axios.delete(endpoints.settings.supervisorLevelById(id));

  await mutate(endpoints.settings.supervisorLevel);
  await mutate(endpoints.employee.employeeSupervisor(employeeId));
  await mutate(endpoints.employee.details(userId));

  return res.data;
}

// === Fetch Employee Supervisor Level ===
export function useGetEmployeeSupervisorLevel(id) {
  const url = endpoints.settings.employeeSupervisorLevel(id);

  const { data, error, isLoading } = useSWR(url, fetcher, swrOptions);

  return useMemo(
    () => ({
      employeeSupervisorLevel: data || [],
      employeeSupervisorLevelLoading: isLoading,
      employeeSupervisorLevelError: error,
      employeeSupervisorLevelEmpty: !isLoading && !data,
    }),
    [data, error, isLoading]
  );
}

// === Fetch Leave Reset Period ===
export function useGetResetPeriod() {
  const url = endpoints.settings.resetPeriod;

  const { data, error, isLoading } = useSWR(url, fetcher, swrOptions);

  return useMemo(
    () => ({
      resetPeriods: data || [],
      resetPeriodsLoading: isLoading,
      resetPeriodsError: error,
      resetPeriodsEmpty: !isLoading && !data?.length,
    }),
    [data, error, isLoading]
  );
}

export async function createResetPeriod(data) {
  const res = await axios.post(endpoints.settings.resetPeriod, data);

  await mutate(endpoints.settings.resetPeriod);

  return res.data;
}

export async function updateResetPeriod(id, data) {
  const res = await axios.patch(endpoints.settings.resetPeriodById(id), data);

  await mutate(endpoints.settings.resetPeriod);
  await mutate(endpoints.settings.resetPeriodById(id));

  return res.data;
}

export async function deleteResetPeriod(id) {
  const res = await axios.delete(endpoints.settings.resetPeriodById(id));

  await mutate(endpoints.settings.resetPeriod);

  return res.data;
}

// === Fetch Cut Off Dates ===
export function useGetCutOffDates() {
  const url = endpoints.settings.cutOff;

  const { data, error, isLoading } = useSWR(url, fetcher, swrOptions);

  return useMemo(
    () => ({
      cutOffDates: data || [],
      cutOffDatesLoading: isLoading,
      cutOffDatesError: error,
      cutOffDatesEmpty: !isLoading && !data?.length,
    }),
    [data, error, isLoading]
  );
}

export function useGetAutoCutOffDate() {
  const url = endpoints.settings.autoCutOff;

  const { data, error, isLoading } = useSWR(url, fetcher, swrOptions);

  return useMemo(
    () => ({
      cutOffDate: data || [],
      cutOffDateLoading: isLoading,
      cutOffDateError: error,
      cutOffDateEmpty: !isLoading && !data?.length,
    }),
    [data, error, isLoading]
  );
}

export async function createCutOffDate(data) {
  const res = await axios.post(endpoints.settings.cutOff, data);
  const autoCutOffRes = await axios.get(endpoints.settings.autoCutOff);
  await mutate(endpoints.settings.autoCutOff, autoCutOffRes.data);
  await mutate(endpoints.settings.cutOff);
  return res.data;
}

export async function updateCutOffDate(id, data) {
  const res = await axios.patch(endpoints.settings.cutOffById(id), data);
  const autoCutOffRes = await axios.get(endpoints.settings.autoCutOff);
  await mutate(endpoints.settings.autoCutOff, autoCutOffRes.data);
  await mutate(endpoints.settings.cutOff);
  return res.data;
}

export async function deleteCutOffDate(id) {
  const res = await axios.delete(endpoints.settings.cutOffById(id));
  const autoCutOffRes = await axios.get(endpoints.settings.autoCutOff);
  await mutate(endpoints.settings.autoCutOff, autoCutOffRes.data);
  await mutate(endpoints.settings.cutOff);
  return res.data;
}

// === Fetch Special Leave Policies ===
export function useGetSpecialLeavePolicies() {
  const url = endpoints.settings.specialLeavePolicies;

  const { data, error, isLoading } = useSWR(url, fetcher, swrOptions);

  return useMemo(
    () => ({
      specialLeavePolicies: data || [],
      specialLeavePoliciesLoading: isLoading,
      specialLeavePoliciesError: error,
      specialLeavePoliciesEmpty: !isLoading && !data?.length,
    }),
    [data, error, isLoading]
  );
}

export async function createSpecialLeavePolicy(data) {
  const res = await axios.post(endpoints.settings.specialLeavePolicies, data);

  await mutate(endpoints.settings.specialLeavePolicies);

  return res.data;
}

export async function updateSpecialLeavePolicy(id, data) {
  const res = await axios.patch(endpoints.settings.specialLeavePoliciesById(id), data);

  await mutate(endpoints.settings.specialLeavePolicies);
  await mutate(endpoints.settings.specialLeavePoliciesById(id));

  return res.data;
}

export async function deleteSpecialLeavePolicy(id) {
  const res = await axios.delete(endpoints.settings.specialLeavePoliciesById(id));

  await mutate(endpoints.settings.specialLeavePolicies);

  return res.data;
}

// === COMPANY INFO ===
export function useGetCompanyInfo(enabled = true) {
  const url = enabled ? endpoints.companyInfo : null;

  const { data, error, isLoading } = useSWR(url, fetcher, swrOptions);

  return useMemo(
    () => ({
      companyInfo: data || null,
      companyInfoLoading: isLoading,
      companyInfoError: error,
      companyInfoEmpty: !isLoading && !data,
    }),
    [data, error, isLoading]
  );
}
