'use client';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useMemo, useState, useReducer, forwardRef, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Slide from '@mui/material/Slide';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TextField from '@mui/material/TextField';
import TableHead from '@mui/material/TableHead';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { paths } from 'src/routes/paths';

import { useBoolean } from 'src/hooks/use-boolean';
import { useDebounce } from 'src/hooks/use-debounce';
import { useSetState } from 'src/hooks/use-set-state';

import { DashboardContent } from 'src/layouts/dashboard';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { Form, Field } from 'src/components/hook-form';
import { EmptyContent } from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { RenderContentLoading } from 'src/components/loading';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  emptyRows,
  TableEmptyRows,
  TableSelectedAction,
  TablePaginationCustom,
} from 'src/components/table';

import { View403 } from 'src/sections/error';
import { AdjustmentApprovalView } from 'src/sections/attendance/view/adjustment-approval-view';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

const Transition = forwardRef((props, ref) => <Slide direction="up" ref={ref} {...props} />);

// ----------------------------------------------------------------------

export function SettingsEntityView({
  title,
  entityName,
  entityData,
  fields,
  schema,
  isLoading,
  hasError,
  onAdd,
  onUpdate,
  onDelete,
  permissionPrefix,
  permissions = {
    canAdd: true,
    canEdit: true,
    canDelete: true,
  },
  formFields,
  filterComponent,
  // Backend pagination support
  usePagination = false,
  paginationData = null,
  onPageChange = null,
  onPageSizeChange = null,
  onFilterChange = null,
}) {
  const { user } = useAuthContext();

  const table = useTable();

  const dialog = useBoolean();
  const confirm = useBoolean();

  // Pagination state for backend pagination
  const [pageNum, setPageNum] = useState(0);
  const [pageSizeNum, setPageSizeNum] = useState(30);

  const filters = useSetState({
    name: '',
  });

  // Debounce filter name to reduce API calls
  const debouncedName = useDebounce(filters.state.name, 1000);

  // Notify parent component about filter or pagination changes
  useMemo(() => {
    if (usePagination && onFilterChange && debouncedName !== filters.state.name) {
      onFilterChange({ name: debouncedName, page: 1 });
    }
  }, [debouncedName, usePagination, onFilterChange, filters.state.name]);

  const currentEntityRef = useRef(null);
  const entityToDeleteRef = useRef(null);

  const isSubmittingRef = useRef(false);

  const forceUpdate = useReducer((x) => x + 1, 0)[1];

  // State for AdjustmentApprovalView dialog
  const [adjustmentDialog, dispatchAdjustmentDialog] = useReducer(
    (state, action) => {
      switch (action.type) {
        case 'OPEN':
          return { open: true, id: action.id };
        case 'CLOSE':
          return { open: false, id: null };
        default:
          return state;
      }
    },
    { open: false, id: null }
  );

  // Permission helper function
  const hasPermission = useCallback(
    (action) => {
      if (permissionPrefix === 'attendanceadjustmentapproval') return true;

      if (!user?.user_permissions_list) return false;

      const permissionCodename = `${action}_${permissionPrefix}`;
      return user.user_permissions_list.some(
        (permission) => permission.codename === permissionCodename
      );
    },
    [user?.user_permissions_list, permissionPrefix]
  );

  // Dynamic permission checks
  const canView = hasPermission('view');
  const canAdd = hasPermission('add');
  const canEdit = hasPermission('change');
  const canDelete = hasPermission('delete');

  // Merge component props with permission checks
  const effectivePermissions = useMemo(
    () => ({
      canAdd: permissions.canAdd && canAdd,
      canEdit: permissions.canEdit && canEdit,
      canDelete: permissions.canDelete && canDelete,
    }),
    [permissions.canAdd, permissions.canEdit, permissions.canDelete, canAdd, canEdit, canDelete]
  );

  // Define table columns
  const tableColumns = useMemo(() => {
    const columns = fields.map((field) => ({
      id: field.name,
      label: field.label,
      width: field.width,
    }));

    // Add actions column if user has permissions
    if (effectivePermissions.canEdit || effectivePermissions.canDelete) {
      columns.push({ id: '', width: 80 });
    }

    return columns;
  }, [fields, effectivePermissions]);

  // Determine if using backend pagination or local pagination
  const isUsingBackendPagination = usePagination && paginationData;

  // Filter and sort data - for both backend and local pagination
  const dataFiltered = useMemo(() => {
    let dataToFilter = [];

    if (isUsingBackendPagination) {
      // Use results from paginated API response
      dataToFilter = paginationData?.results || [];
    } else {
      // Use entityData for local pagination
      dataToFilter = entityData || [];
    }

    if (!dataToFilter.length) return [];

    // For local pagination, apply in-memory filtering
    if (!isUsingBackendPagination && filters.state.name) {
      return applyFilter({
        inputData: dataToFilter,
        filter: filters.state.name,
      });
    }

    // For backend pagination, filtering is already done by API
    return dataToFilter;
  }, [entityData, paginationData, filters.state.name, isUsingBackendPagination]);

  const handleFilterName = useCallback(
    (event) => {
      filters.setState({ name: event.target.value });

      if (isUsingBackendPagination) {
        // For backend pagination, notify parent component
        if (onFilterChange) {
          // Use the non-debounced value immediately to reset pagination
          onFilterChange({ name: event.target.value, page: 1 });
          setPageNum(0);
        }
      } else {
        // For local pagination, reset table page
        table.onResetPage();
      }
    },
    [filters, table, isUsingBackendPagination, onFilterChange]
  );

  const handleAdd = useCallback(() => {
    currentEntityRef.current = null;
    dialog.onTrue();
    forceUpdate();
  }, [dialog, forceUpdate]);

  const handleEdit = useCallback(
    (entity) => {
      if (permissionPrefix === 'attendanceadjustmentapproval') {
        dispatchAdjustmentDialog({ type: 'OPEN', id: entity.id });
      } else {
        currentEntityRef.current = entity;
        dialog.onTrue();
        forceUpdate();
      }
    },
    [dialog, forceUpdate, permissionPrefix]
  );

  const handleDelete = useCallback(
    (entity) => {
      entityToDeleteRef.current = entity;
      confirm.onTrue();
      forceUpdate();
    },
    [confirm, forceUpdate]
  );

  const handleCloseDialog = useCallback(() => {
    dialog.onFalse();
    currentEntityRef.current = null;
    forceUpdate();
  }, [dialog, forceUpdate]);

  const handleConfirmDelete = useCallback(async () => {
    if (!entityToDeleteRef.current) return;

    try {
      await onDelete(entityToDeleteRef.current.id);
      toast.success(`${entityName} deleted successfully`);
    } catch (error) {
      console.error(`Error deleting ${entityName}:`, error);
      toast.error(error?.detail || `Failed to delete ${entityName}`);
    } finally {
      confirm.onFalse();
      entityToDeleteRef.current = null;
      forceUpdate();
    }
  }, [entityName, onDelete, confirm, forceUpdate]);

  const handleSubmitEntity = useCallback(
    async (formData) => {
      try {
        isSubmittingRef.current = true;
        forceUpdate();

        if (currentEntityRef.current) {
          await onUpdate(currentEntityRef.current.id, formData);
          toast.success(`${entityName} updated successfully`);
        } else {
          await onAdd(formData);
          toast.success(`${entityName} created successfully`);
        }

        handleCloseDialog();
      } catch (error) {
        console.error(`Error saving ${entityName}:`, error);
        if (error && typeof error === 'object') {
          Object.entries(error).forEach(([field, messages]) => {
            if (Array.isArray(messages)) {
              toast.error(`${field}: ${messages.join(' ')}`);
            } else {
              toast.error(`${field}: ${messages}`);
            }
          });
        } else if (error?.non_field_errors?.length) {
          toast.error(error.non_field_errors.join(' '));
        } else {
          toast.error(
            error?.detail || error?.description || error?.status || `Failed to save ${entityName}`
          );
        }
      } finally {
        isSubmittingRef.current = false;
        forceUpdate();
      }
    },
    [entityName, onAdd, onUpdate, handleCloseDialog, forceUpdate]
  );

  const handleDeleteRows = useCallback(async () => {
    try {
      const deletePromises = table.selected.map((id) => onDelete(id));
      await Promise.all(deletePromises);
      toast.success(
        `${table.selected.length} ${entityName.toLowerCase()}(s) deleted successfully!`
      );

      if (isUsingBackendPagination) {
        // For backend pagination, refetch data
        if (onFilterChange) {
          onFilterChange({ name: filters.state.name, page: pageNum + 1 });
        }
      } else {
        // For local pagination
        table.onUpdatePageDeleteRows({
          totalRowsInPage: dataFiltered.slice(
            table.page * table.rowsPerPage,
            table.page * table.rowsPerPage + table.rowsPerPage
          ).length,
          totalRowsFiltered: dataFiltered.length,
        });
      }

      table.onSelectAllRows(false, []);
    } catch (error) {
      toast.error(`Failed to delete ${entityName.toLowerCase()}(s)`);
    }
  }, [
    onDelete,
    table,
    dataFiltered,
    entityName,
    isUsingBackendPagination,
    onFilterChange,
    filters.state.name,
    pageNum,
  ]);

  // Pagination handlers for backend pagination
  const handlePageChange = useCallback(
    (event, newPage) => {
      if (isUsingBackendPagination) {
        setPageNum(newPage);
        if (onPageChange) {
          onPageChange(newPage + 1);
        }
      } else {
        table.onChangePage(event, newPage);
      }
    },
    [isUsingBackendPagination, onPageChange, table]
  );

  const handleRowsPerPageChange = useCallback(
    (event) => {
      const newPageSize = parseInt(event.target.value, 10);
      if (isUsingBackendPagination) {
        setPageSizeNum(newPageSize);
        setPageNum(0); // Reset to first page when changing page size
        if (onPageSizeChange) {
          onPageSizeChange(newPageSize);
        }
      } else {
        table.onChangeRowsPerPage(event);
      }
    },
    [isUsingBackendPagination, onPageSizeChange, table]
  );

  // Returns
  if (!canView && !isLoading) {
    return <View403 />;
  }

  if (hasError) {
    return (
      <DashboardContent>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <Typography color="error">Error loading data. Please try again later.</Typography>
        </Box>
      </DashboardContent>
    );
  }

  const notFound = !dataFiltered.length && !!filters.state.name;

  const numSelected = table.selected.length;
  const rowCount = dataFiltered.length;

  // Use formFields if provided, otherwise fallback to fields
  const dialogFields = formFields || fields;

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={title}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Settings' },
          { name: entityName },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
        action={
          effectivePermissions.canAdd && (
            <Button
              color="primary"
              variant="contained"
              startIcon={<Iconify icon="eva:plus-fill" />}
              onClick={handleAdd}
            >
              New {entityName}
            </Button>
          )
        }
      />

      <Card>
        {permissionPrefix !== 'resetperiod' && (
          <Stack
            spacing={2}
            direction={{ xs: 'column', sm: 'row' }}
            sx={{ py: 2.5, px: 3, flexWrap: 'wrap' }}
          >
            {filterComponent}
            {!usePagination && (
              <TextField
                value={filters.state.name}
                onChange={handleFilterName}
                placeholder={`Search ${entityName.toLowerCase()}...`}
                sx={{ flex: 1 }}
                InputProps={{
                  startAdornment: (
                    <Iconify icon="eva:search-fill" color="text.disabled" sx={{ mr: 1 }} />
                  ),
                }}
              />
            )}
          </Stack>
        )}

        {isLoading ? (
          <RenderContentLoading showAnalytics={false} m={0} />
        ) : (
          <>
            <Box sx={{ position: 'relative' }}>
              {effectivePermissions.canDelete && (
                <TableSelectedAction
                  dense={table.dense}
                  numSelected={numSelected}
                  rowCount={rowCount}
                  onSelectAllRows={(checked) =>
                    table.onSelectAllRows(
                      checked,
                      dataFiltered.map((row) => row.id)
                    )
                  }
                  action={
                    <Tooltip title="Delete">
                      <IconButton color="primary" onClick={confirm.onTrue}>
                        <Iconify icon="solar:trash-bin-trash-bold" />
                      </IconButton>
                    </Tooltip>
                  }
                />
              )}

              <Scrollbar>
                <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 600 }}>
                  <TableHead>
                    <TableRow>
                      {effectivePermissions.canDelete && (
                        <TableCell padding="checkbox">
                          <Checkbox
                            indeterminate={numSelected > 0 && numSelected < rowCount}
                            checked={rowCount > 0 && numSelected === rowCount}
                            onChange={(event) =>
                              table.onSelectAllRows(
                                event.target.checked,
                                dataFiltered.map((row) => row.id)
                              )
                            }
                            inputProps={{
                              'aria-label': 'select all rows',
                            }}
                          />
                        </TableCell>
                      )}
                      {tableColumns.map((col) => (
                        <TableCell
                          key={col.id}
                          align={col.align || 'left'}
                          style={{ width: col.width }}
                        >
                          {col.label}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dataFiltered.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={fields.length + (effectivePermissions.canDelete ? 2 : 1)}
                        >
                          <EmptyContent
                            title={`No ${entityName.toLowerCase()} found`}
                            description={`There are no ${entityName.toLowerCase()}s to display.`}
                          />
                        </TableCell>
                      </TableRow>
                    ) : (
                      dataFiltered
                        .slice(
                          isUsingBackendPagination ? 0 : table.page * table.rowsPerPage,
                          isUsingBackendPagination
                            ? undefined
                            : table.page * table.rowsPerPage + table.rowsPerPage
                        )
                        .map((entity) => {
                          // Add conditional styling for attendance approvals
                          const rowSx =
                            permissionPrefix === 'attendanceadjustmentapproval' &&
                            entity.status === 'pending'
                              ? {
                                  backgroundColor: 'rgba(255, 193, 7, 0.07)', // warning.main with low opacity
                                  '&:hover': {
                                    backgroundColor: 'rgba(255, 193, 7, 0.12)',
                                  },
                                }
                              : {};

                          return (
                            <TableRow
                              key={entity.id}
                              hover
                              selected={table.selected.includes(entity.id)}
                              sx={rowSx}
                            >
                              {effectivePermissions.canDelete && (
                                <TableCell padding="checkbox">
                                  <Checkbox
                                    checked={table.selected.includes(entity.id)}
                                    onClick={() => table.onSelectRow(entity.id)}
                                  />
                                </TableCell>
                              )}
                              {fields.map((field) => (
                                <TableCell key={field.name}>
                                  {field.transform
                                    ? field.transform(entity[field.name], entity)
                                    : field.source && entity[field.source]
                                      ? entity[field.source]
                                      : entity[field.name]}
                                </TableCell>
                              ))}
                              {effectivePermissions.canEdit || effectivePermissions.canDelete ? (
                                <TableCell>
                                  <Stack
                                    direction="row"
                                    spacing={1}
                                    justifyContent="flex-end"
                                    alignItems="center"
                                  >
                                    {effectivePermissions.canEdit && (
                                      <IconButton onClick={() => handleEdit(entity)}>
                                        <Iconify icon="solar:pen-bold" />
                                      </IconButton>
                                    )}
                                    {effectivePermissions.canDelete && (
                                      <IconButton onClick={() => handleDelete(entity)}>
                                        <Iconify icon="solar:trash-bin-trash-bold" />
                                      </IconButton>
                                    )}
                                  </Stack>
                                </TableCell>
                              ) : null}
                            </TableRow>
                          );
                        })
                    )}

                    {!isUsingBackendPagination && (
                      <TableEmptyRows
                        height={table.dense ? 52 : 76}
                        emptyRows={emptyRows(table.page, table.rowsPerPage, dataFiltered.length)}
                      />
                    )}
                  </TableBody>
                </Table>
              </Scrollbar>
            </Box>

            <TablePaginationCustom
              count={isUsingBackendPagination ? paginationData?.count || 0 : dataFiltered.length}
              page={isUsingBackendPagination ? pageNum : table.page}
              rowsPerPage={isUsingBackendPagination ? pageSizeNum : table.rowsPerPage}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
              dense={isUsingBackendPagination ? false : table.dense}
              onChangeDense={isUsingBackendPagination ? undefined : table.onChangeDense}
            />
          </>
        )}
      </Card>

      {/* Entity Form Dialog */}
      <EntityFormDialog
        open={dialog.value}
        onClose={handleCloseDialog}
        onSubmit={handleSubmitEntity}
        currentEntity={currentEntityRef.current}
        isSubmitting={isSubmittingRef.current}
        fields={dialogFields}
        schema={schema}
        entityName={entityName}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete"
        content={
          numSelected > 1
            ? `Are you sure you want to delete ${numSelected} ${entityName.toLowerCase()}s?`
            : `Are you sure you want to delete this ${entityName.toLowerCase()}?`
        }
        action={
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              if (numSelected > 0) {
                handleDeleteRows();
              } else {
                handleConfirmDelete();
              }
              confirm.onFalse();
            }}
            disabled={numSelected === 0 && !entityToDeleteRef.current}
          >
            Delete
          </Button>
        }
      />

      {/* AdjustmentApprovalView Dialog for Attendance Approval */}
      {permissionPrefix === 'attendanceadjustmentapproval' && adjustmentDialog.open && (
        <AdjustmentApprovalView
          id={adjustmentDialog.open ? adjustmentDialog.id : null}
          open={adjustmentDialog.open}
          onClose={() => dispatchAdjustmentDialog({ type: 'CLOSE' })}
        />
      )}
    </DashboardContent>
  );
}

// ----------------------------------------------------------------------

function EntityFormDialog({
  open,
  onClose,
  onSubmit,
  currentEntity,
  isSubmitting,
  fields,
  schema,
  entityName,
}) {
  // Support defaultValue as a function or value on each field
  const defaultValues = useMemo(() => {
    const values = {};
    fields.forEach((field) => {
      let v = currentEntity ? currentEntity[field.name] : undefined;
      // Use field.defaultValue if no value from currentEntity
      if (v === undefined || v === null || v === '') {
        v =
          typeof field.defaultValue === 'function'
            ? field.defaultValue(currentEntity)
            : field.defaultValue;
      }
      if (field.type === 'multiselect') {
        values[field.name] = Array.isArray(v) ? v : v !== undefined && v !== null ? [v] : [];
      } else if (typeof v === 'boolean') {
        values[field.name] = v;
      } else if (field.type === 'number') {
        values[field.name] = v !== undefined && v !== null && v !== '' ? Number(v) : '';
      } else {
        values[field.name] = v !== undefined && v !== null ? v : '';
      }
    });
    return values;
  }, [currentEntity, fields]);

  const methods = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const {
    reset,
    control,
    getValues,
    handleSubmit,
    formState: { errors },
  } = methods;

  // Watch form values to trigger re-renders when options need to update
  const watchedValues = useWatch({ control });

  // Reset form when dialog opens
  useMemo(() => {
    if (open) {
      reset(defaultValues);
    }
  }, [open, reset, defaultValues]);

  const onFormSubmit = (data) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" TransitionComponent={Transition}>
      <DialogTitle>{currentEntity ? `Edit ${entityName}` : `New ${entityName}`}</DialogTitle>

      <Form methods={methods} onSubmit={handleSubmit(onFormSubmit)}>
        <DialogContent>
          <Box
            rowGap={3}
            columnGap={2}
            display="grid"
            pt={1}
            gridTemplateColumns={
              fields.length === 1
                ? 'repeat(1, 1fr)'
                : { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' }
            }
          >
            {fields.map((field) => {
              // Compute options dynamically if it's a function
              const currentOptions =
                typeof field.options === 'function'
                  ? field.options(getValues())
                  : field.options || [];

              // Render different field types based on field.type
              if (field.type === 'multiselect') {
                return (
                  <Field.MultiSelect
                    key={field.name}
                    name={field.name}
                    label={field.label}
                    options={currentOptions}
                    fullWidth
                  />
                );
              }

              if (field.type === 'select') {
                return (
                  <Field.Select key={field.name} name={field.name} label={field.label} fullWidth>
                    {currentOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Field.Select>
                );
              }

              if (field.type === 'time') {
                return (
                  <Field.TimePicker
                    key={field.name}
                    name={field.name}
                    label={field.label}
                    fullWidth
                  />
                );
              }

              if (field.type === 'number') {
                return (
                  <Field.Text
                    key={field.name}
                    name={field.name}
                    label={field.label}
                    type="number"
                    fullWidth
                  />
                );
              }

              if (field.type === 'date') {
                return (
                  <Field.DatePicker
                    key={field.name}
                    name={field.name}
                    label={field.label}
                    fullWidth
                  />
                );
              }

              return (
                <Field.Text key={field.name} name={field.name} label={field.label} fullWidth />
              );
            })}
          </Box>
        </DialogContent>

        <DialogActions>
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>
          <LoadingButton type="submit" loading={isSubmitting} variant="contained" color="primary">
            {currentEntity ? 'Update' : 'Create'}
          </LoadingButton>
        </DialogActions>
      </Form>
    </Dialog>
  );
}

// ----------------------------------------------------------------------

function flattenObject(obj) {
  let result = '';
  Object.keys(obj).forEach((key) => {
    const value = obj[key];
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      result += flattenObject(value);
    } else if (Array.isArray(value)) {
      value.forEach((item) => {
        if (typeof item === 'object' && item !== null) {
          result += flattenObject(item);
        } else {
          result += `${item} `;
        }
      });
    } else {
      result += `${value} `;
    }
  });
  return result;
}

function applyFilter({ inputData, filter }) {
  // search in all nested data
  if (filter) {
    const searchFilter = filter.toLowerCase();
    return inputData.filter((entity) => {
      const flattened = flattenObject(entity).toLowerCase();
      return flattened.includes(searchFilter);
    });
  }

  return inputData;
}
