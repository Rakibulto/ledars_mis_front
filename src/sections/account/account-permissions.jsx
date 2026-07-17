import { mutate } from 'swr';
import { useRef, useMemo, Fragment, useReducer, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Checkbox from '@mui/material/Checkbox';
import Collapse from '@mui/material/Collapse';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';
import TableContainer from '@mui/material/TableContainer';

import { endpoints } from 'src/utils/axios';

import Loading from 'src/app/dashboard/loading';
import { useGetPermissions, updateUserPermissions } from 'src/actions/permissions';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

// Define reducer actions
const ACTIONS = {
  FILTER_BY_NAME: 'FILTER_BY_NAME',
  TOGGLE_PERMISSION: 'TOGGLE_PERMISSION',
  SET_SELECTED_PERMISSIONS: 'SET_SELECTED_PERMISSIONS',
  SET_SUBMITTING: 'SET_SUBMITTING',
  SELECT_MODULE_PERMISSIONS: 'SELECT_MODULE_PERMISSIONS',
  SELECT_ALL_PERMISSIONS: 'SELECT_ALL_PERMISSIONS',
  TOGGLE_MODULE_EXPAND: 'TOGGLE_MODULE_EXPAND',
};

// Initial state
const initialState = {
  filterName: '',
  selectedPermissions: {},
  isSubmitting: false,
  expandedModules: {
    Employee: true,
    Settings: false,
    Attendance: false,
    Holiday: false,
    Leave: false,
  },
};

// Reducer function
function reducer(state, action) {
  switch (action.type) {
    case ACTIONS.FILTER_BY_NAME:
      return { ...state, filterName: action.payload };
    case ACTIONS.TOGGLE_PERMISSION:
      return {
        ...state,
        selectedPermissions: {
          ...state.selectedPermissions,
          [action.payload.permissionId]: action.payload.checked,
        },
      };
    case ACTIONS.SET_SELECTED_PERMISSIONS:
      return { ...state, selectedPermissions: action.payload };
    case ACTIONS.SET_SUBMITTING:
      return { ...state, isSubmitting: action.payload };
    case ACTIONS.SELECT_MODULE_PERMISSIONS: {
      const { permissionIds, checked } = action.payload;
      const newSelectedPermissions = { ...state.selectedPermissions };
      permissionIds.forEach((id) => {
        newSelectedPermissions[id] = checked;
      });
      return { ...state, selectedPermissions: newSelectedPermissions };
    }
    case ACTIONS.SELECT_ALL_PERMISSIONS: {
      const { permissionIds, checked } = action.payload;
      const newSelectedPermissions = { ...state.selectedPermissions };
      permissionIds.forEach((id) => {
        newSelectedPermissions[id] = checked;
      });
      return { ...state, selectedPermissions: newSelectedPermissions };
    }
    case ACTIONS.TOGGLE_MODULE_EXPAND:
      return {
        ...state,
        expandedModules: {
          ...state.expandedModules,
          [action.payload.moduleTitle]: !state.expandedModules[action.payload.moduleTitle],
        },
      };
    default:
      return state;
  }
}

export function AccountPermissions({ employee }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { filterName, selectedPermissions, isSubmitting, expandedModules } = state;

  // Fetch permissions
  const { permissions, permissionsLoading, permissionsError, mutatePermissions } =
    useGetPermissions();

  // Use a ref to track if permissions have been initialized
  const initializedRef = useRef(false);

  // Initialize selected permissions from employee data
  useMemo(() => {
    if (employee?.user?.permissions?.length && !initializedRef.current) {
      const initialPermissions = {};
      employee.user.permissions.forEach((permission) => {
        initialPermissions[permission.id] = true;
      });
      dispatch({
        type: ACTIONS.SET_SELECTED_PERMISSIONS,
        payload: initialPermissions,
      });
      initializedRef.current = true;
    }
  }, [employee]);

  // Model name mapping to match frontend naming conventions
  const getModelDisplayName = useCallback((model) => {
    const modelNameMap = {
      // Employee Management
      employee: 'Employee',

      // Settings
      department: 'Department',
      designation: 'Designation',
      branch: 'Branch',
      shift: 'Shift',
      role: 'Role',
      leavegroup: 'Leave Group',
      leavepolicy: 'Leave Policy',
      leavereset: 'Leave Reset Period',
      specialleavepolicy: 'Special Leave Policy',
      preapprovedip: 'Pre-approved IP',
      cutoff: 'Cut-off Date',
      supervisorlevel: 'Supervisor Level',

      // Attendance
      attendancedata: 'List',
      attendanceadjustmentrequest: 'Adjustment',
      attendanceadjustmentapproval: 'Adjustment Approvals',

      // Holiday
      holiday: 'Holiday',

      // Leave
      leaverequest: 'Leave Request',
      leaveapproval: 'Leave Approval',

      // Payroll
      payroll: 'Payroll',

      // Salary
      salary: 'Salary',
    };

    return (
      modelNameMap[model] ||
      model.charAt(0).toUpperCase() + model.slice(1).replace(/([A-Z])/g, ' $1')
    );
  }, []);

  // Module structure matching navigation
  const moduleStructure = useMemo(
    () => [
      {
        title: 'Employee',
        icon: 'solar:users-group-rounded-bold',
        models: ['employee', 'salary'],
      },
      {
        title: 'Settings',
        icon: 'solar:settings-bold',
        models: [
          'department',
          'designation',
          'branch',
          'shift',
          'role',
          'leavegroup',
          'leavepolicy',
          'leavereset',
          'specialleavepolicy',
          'preapprovedip',
          'cutoff',
          'supervisorlevel',
        ],
      },
      {
        title: 'Attendance Management',
        icon: 'solar:calendar-bold',
        models: ['attendancedata', 'attendanceadjustmentrequest', 'attendanceadjustmentapproval'],
      },
      {
        title: 'Holiday Management',
        icon: 'solar:calendar-mark-bold',
        models: ['holiday'],
      },
      {
        title: 'Payroll',
        icon: 'solar:wallet-money-bold',
        models: ['payroll'],
      },
      {
        title: 'Leave Management',
        icon: 'solar:logout-2-bold',
        models: ['leaverequest', 'leaveapproval'],
      },
    ],
    []
  );

  // Organize permissions into modules based on navigation structure
  const organizedModules = useMemo(() => {
    if (permissionsLoading || permissionsError || !permissions.length) {
      return [];
    }

    return moduleStructure
      .map((module) => {
        const moduleData = {
          ...module,
          subModules: [],
        };

        module.models.forEach((model) => {
          const modelPermissions = permissions.filter((p) => p.content_type__model === model);

          if (modelPermissions.length > 0) {
            // Group permissions by action type
            const groupedPerms = {};
            modelPermissions.forEach((perm) => {
              const action = perm.codename.split('_')[0];
              if (!groupedPerms[action]) {
                groupedPerms[action] = [];
              }
              groupedPerms[action].push(perm);
            });

            moduleData.subModules.push({
              name: getModelDisplayName(model),
              model,
              permissions: groupedPerms,
              allPermissions: modelPermissions,
            });
          }
        });

        return moduleData;
      })
      .filter((module) => module.subModules.length > 0);
  }, [permissions, permissionsLoading, permissionsError, moduleStructure, getModelDisplayName]);

  // Filter modules based on search
  const filteredModules = useMemo(() => {
    if (!filterName) return organizedModules;

    return organizedModules
      .map((module) => ({
        ...module,
        subModules: module.subModules.filter(
          (subModule) =>
            subModule.name.toLowerCase().includes(filterName.toLowerCase()) ||
            subModule.allPermissions.some(
              (p) =>
                p.name.toLowerCase().includes(filterName.toLowerCase()) ||
                p.codename.toLowerCase().includes(filterName.toLowerCase())
            )
        ),
      }))
      .filter((module) => module.subModules.length > 0);
  }, [organizedModules, filterName]);

  // Check if a module has all permissions selected
  const isModuleSelected = useCallback(
    (module) => {
      const allPermissionIds = module.subModules.flatMap((sub) =>
        sub.allPermissions.map((p) => p.id)
      );
      return (
        allPermissionIds.length > 0 && allPermissionIds.every((id) => !!selectedPermissions[id])
      );
    },
    [selectedPermissions]
  );

  // Check if a submodule has all permissions selected
  const isSubModuleSelected = useCallback(
    (subModule) => {
      const allPermissionIds = subModule.allPermissions.map((p) => p.id);
      return (
        allPermissionIds.length > 0 && allPermissionIds.every((id) => !!selectedPermissions[id])
      );
    },
    [selectedPermissions]
  );

  // Event handlers
  const handleFilterByName = useCallback((event) => {
    dispatch({ type: ACTIONS.FILTER_BY_NAME, payload: event.target.value });
  }, []);

  const handleTogglePermission = useCallback(
    (permissionId, checked, permType, subModule) => {
      // Find the 'view' (list) permission for this subModule
      const viewPerm = subModule.permissions.view?.find(
        (perm) => !perm.codename.includes('own') && !perm.codename.includes('subordinate')
      );
      // Only link non-own/subordinate permissions to list for modules other than attendancedata
      const isAttendanceData = subModule.model === 'attendancedata';

      // Only link non-own/subordinate permissions to list for non-attendance modules
      if (
        !isAttendanceData &&
        permType !== 'view' &&
        permType !== 'special' &&
        checked &&
        viewPerm &&
        permissionId !== viewPerm.id
      ) {
        // If any non-list, non-special permission is checked, ensure list is checked
        dispatch({
          type: ACTIONS.TOGGLE_PERMISSION,
          payload: { permissionId: viewPerm.id, checked: true },
        });
      }

      // For non-attendance modules, if list is unchecked remove add/change/delete
      if (
        !isAttendanceData &&
        permType === 'view' &&
        !checked &&
        viewPerm &&
        permissionId === viewPerm.id
      ) {
        // If list is unchecked, remove only add/change/delete for this subModule
        subModule.allPermissions.forEach((perm) => {
          const action = perm.codename.split('_')[0];
          if (
            perm.id !== viewPerm.id &&
            selectedPermissions[perm.id] &&
            !perm.codename.includes('own') &&
            !perm.codename.includes('subordinate') &&
            ['add', 'change', 'delete'].includes(action)
          ) {
            dispatch({
              type: ACTIONS.TOGGLE_PERMISSION,
              payload: { permissionId: perm.id, checked: false },
            });
          }
        });
      }

      // Always toggle the selected permission
      dispatch({
        type: ACTIONS.TOGGLE_PERMISSION,
        payload: { permissionId, checked },
      });
    },
    [selectedPermissions]
  );

  const handleSelectModulePermissions = useCallback((module, checked) => {
    const permissionIds = module.subModules.flatMap((sub) => sub.allPermissions.map((p) => p.id));
    dispatch({
      type: ACTIONS.SELECT_MODULE_PERMISSIONS,
      payload: { permissionIds, checked },
    });
  }, []);

  const handleSelectSubModulePermissions = useCallback((subModule, checked) => {
    const permissionIds = subModule.allPermissions.map((p) => p.id);
    dispatch({
      type: ACTIONS.SELECT_MODULE_PERMISSIONS,
      payload: { permissionIds, checked },
    });
  }, []);

  const handleSelectAllPermissions = useCallback(
    (checked) => {
      const allPermissionIds = permissions.map((p) => p.id);
      dispatch({
        type: ACTIONS.SELECT_ALL_PERMISSIONS,
        payload: { permissionIds: allPermissionIds, checked },
      });
    },
    [permissions]
  );

  const handleToggleModuleExpand = useCallback((moduleTitle) => {
    dispatch({
      type: ACTIONS.TOGGLE_MODULE_EXPAND,
      payload: { moduleTitle },
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    dispatch({ type: ACTIONS.SET_SUBMITTING, payload: true });

    try {
      const permissionIds = Object.entries(selectedPermissions)
        .filter(([_, value]) => value)
        .map(([key]) => Number(key));

      await updateUserPermissions(employee.user.id, permissionIds);

      mutatePermissions();
      mutate(endpoints.employee.details(employee.id), { revalidate: true });
      mutate(endpoints.auth.me, { revalidate: true });

      toast.success('Permissions saved successfully!');
    } catch (error) {
      console.error(error);
      toast.error(error?.detail || 'Failed to save permissions');
    } finally {
      dispatch({ type: ACTIONS.SET_SUBMITTING, payload: false });
    }
  }, [selectedPermissions, employee?.id, mutatePermissions, employee?.user?.id]);

  // Handle loading state
  if (permissionsLoading) {
    return <Loading />;
  }

  // Handle error state
  if (permissionsError) {
    return (
      <Card>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 5 }}>
          <Typography color="error">Error loading permissions. Please try again later.</Typography>
        </Box>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="User Permissions"
        subheader="Manage what this user can do"
        sx={{ mb: 3 }}
      />

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{
          px: 2.5,
          mb: 3,
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
        }}
      >
        <TextField
          value={filterName}
          onChange={handleFilterByName}
          placeholder="Search permissions..."
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
        />

        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            onClick={() => handleSelectAllPermissions(true)}
            startIcon={<Iconify icon="eva:checkmark-square-2-outline" />}
          >
            Select All
          </Button>

          <Button
            variant="outlined"
            onClick={() => handleSelectAllPermissions(false)}
            startIcon={<Iconify icon="eva:close-square-outline" />}
          >
            Deselect All
          </Button>

          <LoadingButton
            size="large"
            variant="contained"
            color="primary"
            loading={isSubmitting}
            onClick={handleSubmit}
          >
            Save Permissions
          </LoadingButton>
        </Stack>
      </Stack>

      <Box sx={{ px: 2.5, pb: 3 }}>
        <TableContainer sx={{ maxHeight: 600, borderRadius: 3 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    width: 50,
                    bgcolor: 'background.paper',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1,
                  }}
                />
                <TableCell
                  sx={{ bgcolor: 'background.paper', position: 'sticky', top: 0, zIndex: 1 }}
                >
                  Module / Sub-Module
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    width: 80,
                    bgcolor: 'background.paper',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1,
                  }}
                >
                  List
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    width: 80,
                    bgcolor: 'background.paper',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1,
                  }}
                >
                  Add
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    width: 80,
                    bgcolor: 'background.paper',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1,
                  }}
                >
                  Change
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    width: 80,
                    bgcolor: 'background.paper',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1,
                  }}
                >
                  Delete
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    width: 220,
                    bgcolor: 'background.paper',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1,
                  }}
                >
                  Special
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredModules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <Typography variant="body1">
                      No permissions match your search criteria.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredModules.map((module) => (
                  <Fragment key={module.title}>
                    {/* Module Header Row */}
                    <TableRow sx={{ bgcolor: 'background.neutral' }}>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleToggleModuleExpand(module.title)}
                        >
                          <Iconify
                            icon={
                              expandedModules[module.title]
                                ? 'eva:chevron-down-fill'
                                : 'eva:chevron-right-fill'
                            }
                          />
                        </IconButton>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Iconify icon={module.icon} width={20} />
                          <Typography variant="subtitle1" fontWeight="bold">
                            {module.title}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell align="center" colSpan={5}>
                        <Stack
                          direction="row"
                          alignItems="center"
                          justifyContent="center"
                          spacing={1}
                        >
                          <Typography variant="caption" color="text.secondary">
                            Select All
                          </Typography>
                          <Switch
                            checked={isModuleSelected(module)}
                            indeterminate={
                              module.subModules.some((sub) =>
                                sub.allPermissions.some((p) => !!selectedPermissions[p.id])
                              ) && !isModuleSelected(module)
                            }
                            onChange={(e) =>
                              handleSelectModulePermissions(module, e.target.checked)
                            }
                            color="primary"
                            size="small"
                          />
                        </Stack>
                      </TableCell>
                    </TableRow>

                    {/* Sub-Module Rows */}
                    <TableRow>
                      <TableCell colSpan={7} sx={{ p: 0, border: 'none' }}>
                        <Collapse in={expandedModules[module.title]} timeout="auto" unmountOnExit>
                          <Table size="small">
                            <TableBody>
                              {module.subModules.map((subModule) => {
                                // Find special permissions for this submodule
                                const specialPerms = Object.values(subModule.permissions)
                                  .flat()
                                  .filter(
                                    (perm) =>
                                      perm.codename.startsWith('view_own_') ||
                                      perm.codename.startsWith('view_subordinate_') ||
                                      (!['view', 'add', 'change', 'delete'].includes(
                                        perm.codename.split('_')[0]
                                      ) &&
                                        (perm.codename.includes('own') ||
                                          perm.codename.includes('subordinate')))
                                  );

                                return (
                                  <TableRow key={subModule.model}>
                                    <TableCell sx={{ width: 50, pl: 6 }} />
                                    <TableCell>
                                      <Typography variant="body2" sx={{ pl: 2 }}>
                                        {subModule.name}
                                      </Typography>
                                    </TableCell>
                                    <TableCell align="center" sx={{ width: 80 }}>
                                      {subModule.permissions.view
                                        ?.filter(
                                          (perm) =>
                                            !perm.codename.includes('own') &&
                                            !perm.codename.includes('subordinate')
                                        )
                                        .map((perm) => (
                                          <Checkbox
                                            key={perm.id}
                                            size="small"
                                            checked={!!selectedPermissions[perm.id]}
                                            onChange={(e) =>
                                              handleTogglePermission(
                                                perm.id,
                                                e.target.checked,
                                                'view', // for list
                                                subModule
                                              )
                                            }
                                            title={perm.name}
                                          />
                                        ))}
                                    </TableCell>
                                    <TableCell align="center" sx={{ width: 80 }}>
                                      {subModule.permissions.add?.map((perm) => (
                                        <Checkbox
                                          key={perm.id}
                                          size="small"
                                          checked={!!selectedPermissions[perm.id]}
                                          onChange={(e) =>
                                            handleTogglePermission(
                                              perm.id,
                                              e.target.checked,
                                              'add', // or 'change', 'delete', 'special'
                                              subModule
                                            )
                                          }
                                        />
                                      ))}
                                    </TableCell>
                                    <TableCell align="center" sx={{ width: 80 }}>
                                      {subModule.permissions.change?.map((perm) => (
                                        <Checkbox
                                          key={perm.id}
                                          size="small"
                                          checked={!!selectedPermissions[perm.id]}
                                          onChange={(e) =>
                                            handleTogglePermission(
                                              perm.id,
                                              e.target.checked,
                                              'change', // or 'add', 'delete', 'special'
                                              subModule
                                            )
                                          }
                                        />
                                      ))}
                                    </TableCell>
                                    <TableCell align="center" sx={{ width: 80 }}>
                                      {subModule.permissions.delete?.map((perm) => (
                                        <Checkbox
                                          key={perm.id}
                                          size="small"
                                          checked={!!selectedPermissions[perm.id]}
                                          onChange={(e) =>
                                            handleTogglePermission(
                                              perm.id,
                                              e.target.checked,
                                              'delete', // or 'add', 'change', 'special'
                                              subModule
                                            )
                                          }
                                        />
                                      ))}
                                    </TableCell>
                                    <TableCell align="center" sx={{ width: 220 }}>
                                      <Stack direction="row" spacing={1} justifyContent="center">
                                        {specialPerms.map((perm) => (
                                          <Box
                                            key={perm.id}
                                            display="flex"
                                            alignItems="center"
                                            gap={0.5}
                                          >
                                            <Checkbox
                                              size="small"
                                              checked={!!selectedPermissions[perm.id]}
                                              onChange={(e) =>
                                                handleTogglePermission(
                                                  perm.id,
                                                  e.target.checked,
                                                  'special', // or 'add', 'change', 'delete'
                                                  subModule
                                                )
                                              }
                                              title={perm.name}
                                            />
                                            <Typography variant="caption" color="text.secondary">
                                              {perm.codename.includes('own')
                                                ? 'Own'
                                                : perm.codename.includes('subordinate')
                                                  ? 'Subordinate'
                                                  : perm.codename}
                                            </Typography>
                                          </Box>
                                        ))}
                                      </Stack>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Card>
  );
}
