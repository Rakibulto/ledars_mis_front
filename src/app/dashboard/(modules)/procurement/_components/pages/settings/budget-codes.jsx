'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Plus, Edit, Trash2, Loader, DollarSign } from 'lucide-react';

import {
  Stack,
  Dialog,
  Select,
  Switch,
  MenuItem,
  TextField,
  InputLabel,
  DialogTitle,
  FormControl,
  DialogContent,
  DialogActions,
  FormHelperText,
  FormControlLabel,
} from '@mui/material';

import { endpoints } from 'src/utils/axios';

import {
  useGetRequest,
  usePatchRequest,
  useDeleteRequest,
  useCreateMutation,
} from 'src/actions/ledars-hook';

import { ConfirmDialog } from 'src/components/custom-dialog';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardBody, CardHeader } from '../../components/ui/card';

export function BudgetCodeSetup() {
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [editingBudgetId, setEditingBudgetId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, budgetId: null });
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch budget codes from API
  const { data: budgetResponse, loading: budgetLoading } = useGetRequest(
    `${endpoints.procurement_management.budget_codes || '/api/budgets/'}?pagination=true&page=${page}&search=${encodeURIComponent(searchQuery)}`
  );

  // Fetch departments for selection
  const { data: departmentResponse } = useGetRequest('/api/departments/');
  const { data: fiscalYearOptions } = useGetRequest(endpoints.procurement_management.fiscal_years);

  // Mutations
  const { trigger: createBudget, isMutating: isCreating } = useCreateMutation(
    endpoints.procurement_management.budget_codes || '/api/budgets/'
  );
  const patchBudget = usePatchRequest;

  // CREATE FORM
  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    formState: { errors: errorsCreate },
    reset: resetCreate,
    control: controlCreate,
    watch: watchCreate,
  } = useForm({
    defaultValues: {
      code: '',
      name: '',
      department: '',
      allocated_amount: '',
      fiscal_year: new Date().getFullYear().toString(),
      is_active: true,
    },
  });

  // UPDATE FORM
  const {
    register: registerUpdate,
    handleSubmit: handleSubmitUpdate,
    formState: { errors: errorsUpdate },
    reset: resetUpdate,
    control: controlUpdate,
    setValue: setValueUpdate,
  } = useForm({
    defaultValues: {
      code: '',
      name: '',
      department: '',
      allocated_amount: '',
      fiscal_year: new Date().getFullYear().toString(),
      is_active: true,
    },
  });

  const onSubmitCreate = async (data) => {
    try {
      console.log('Creating budget code:', data);

      const createPayload = {
        code: data.code,
        name: data.name,
        department: data.department,
        allocated_amount: parseFloat(data.allocated_amount),
        fiscal_year: data.fiscal_year,
        is_active: data.is_active,
      };

      await createBudget(createPayload);
      toast.success('Budget code created successfully');
      closeCreateDialog();
      mutate(
        `${endpoints.procurement_management.budget_codes || '/api/budget-codes/'}?pagination=true&page=${page}&search=${encodeURIComponent(searchQuery)}`
      );
    } catch (error) {
      console.error('Error creating budget code:', error);
      toast.error(error?.message || 'Error creating budget code');
    }
  };
  const deleteBudget = useDeleteRequest;
  const [isUpdating, setIsUpdating] = useState(false);
  const onSubmitUpdate = async (data) => {
    setIsUpdating(true);
    try {
      const updatePayload = {
        name: data.name,
        department: data.department,
        allocated_amount: parseFloat(data.allocated_amount),
        fiscal_year: data.fiscal_year,
        is_active: data.is_active,
      };
      console.log('Updating budget code with ID:', editingBudgetId, 'Payload:', updatePayload);
      await patchBudget(
        `${endpoints.procurement_management.budget_codes}${editingBudgetId}/`,
        updatePayload
      );

      toast.success('Budget code updated successfully');
      closeUpdateDialog();
      mutate(
        `${endpoints.procurement_management.budget_codes}?pagination=true&page=${page}&search=${encodeURIComponent(searchQuery)}`
      );
    } catch (error) {
      console.error('Error updating budget code:', error);
      toast.error(error?.message || 'Error updating budget code');
    } finally {
      setIsUpdating(false);
    }
  };

  const closeCreateDialog = () => {
    setOpenCreateDialog(false);
    resetCreate();
  };

  const closeUpdateDialog = () => {
    setOpenUpdateDialog(false);
    setEditingBudgetId(null);
    resetUpdate();
  };

  const handleEdit = (budget) => {
    console.log('Editing budget code:', budget);
    setEditingBudgetId(budget.id);

    setValueUpdate('code', budget.code || '');
    setValueUpdate('name', budget.name || '');
    setValueUpdate('department', budget.department || '');
    setValueUpdate('allocated_amount', budget.allocated_amount?.toString() || '');
    setValueUpdate(
      'fiscal_year',
      budget.fiscal_year?.toString() || new Date().getFullYear().toString()
    );
    setValueUpdate('is_active', budget.is_active || true);

    setOpenUpdateDialog(true);
  };

  const [isDeleting, setIsDeleting] = useState(false);
  const handleDelete = (budgetId) => {
    console.log('Delete budget code with ID:', budgetId);
    setDeleteConfirm({ open: true, budgetId });
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    const { budgetId } = deleteConfirm;
    setDeleteConfirm({ open: false, budgetId: null });

    try {
      await deleteBudget(`${endpoints.procurement_management.budget_codes}${budgetId}/`);
      toast.success('Budget code deleted successfully');
      mutate(
        `${endpoints.procurement_management.budget_codes}?pagination=true&page=${page}&search=${encodeURIComponent(searchQuery)}`
      );
      setIsDeleting(false);
    } catch (error) {
      console.error('Error deleting budget code:', error);
      toast.error(error?.message || 'Error deleting budget code');
      setIsDeleting(false);
    }
  };

  const handleCloseDeleteConfirm = () => {
    setDeleteConfirm({ open: false, budgetId: null });
  };

  // Get unique departments
  const departments = useMemo(() => {
    if (Array.isArray(departmentResponse)) return departmentResponse;
    return departmentResponse?.results || [];
  }, [departmentResponse]);

  // Use API data or mock data
  const budgetCodes = useMemo(() => {
    if (budgetLoading) return [];
    return budgetResponse?.results || [];
  }, [budgetResponse, budgetLoading]);

  const totalCount = budgetResponse?.count || budgetCodes.length;
  const totalPages = budgetResponse?.total_pages || 1;
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Budget Code Setup</h1>
          <p className="text-muted-foreground">Manage budget codes and allocations</p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            resetCreate();
            setOpenCreateDialog(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Budget Code
        </Button>
      </div>

      {/* Budget Codes Table */}
      <Card>
        <CardHeader
          title={`Budget Codes (${totalCount})`}
          description="Configure budget allocations by department"
        />
        <CardBody>
          {budgetLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading budget codes...</span>
            </div>
          ) : budgetCodes.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">No budget codes found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b-2 border-border">
                  <tr className="text-left">
                    <th className="pb-3 text-sm font-semibold text-foreground">Budget Code</th>
                    <th className="pb-3 text-sm font-semibold text-foreground">Name</th>
                    <th className="pb-3 text-sm font-semibold text-foreground">Department</th>
                    <th className="pb-3 text-sm font-semibold text-foreground">Allocated</th>
                    <th className="pb-3 text-sm font-semibold text-foreground">Fiscal Year</th>
                    <th className="pb-3 text-sm font-semibold text-foreground">Status</th>
                    <th className="pb-3 text-sm font-semibold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {budgetCodes.map((budget) => (
                    <tr
                      key={budget.id}
                      className="border-b border-border hover:bg-muted/50 transition"
                    >
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-primary" />
                          <span className="font-mono font-semibold text-foreground">
                            {budget.code}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 text-sm text-foreground">{budget.name}</td>
                      <td className="py-4 text-sm text-foreground">{budget.department}</td>
                      <td className="py-4 text-sm font-semibold text-foreground">
                        ${parseFloat(budget.allocated_amount || 0).toLocaleString()}
                      </td>
                      <td className="py-4 text-sm text-foreground">{budget.fiscal_year}</td>
                      <td className="py-4">
                        <Badge variant={budget.is_active ? 'success' : 'default'}>
                          {budget.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="py-4">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="p-2 hover:bg-muted rounded transition-colors"
                            onClick={() => handleEdit(budget)}
                            disabled={isUpdating || isDeleting}
                          >
                            <Edit className="w-4 h-4 text-primary" />
                          </button>
                          <button
                            type="button"
                            className="p-2 hover:bg-muted rounded transition-colors"
                            onClick={() => handleDelete(budget.id)}
                          >
                            {isDeleting ? (
                              <Loader className="w-4 h-4 animate-spin text-error" />
                            ) : (
                              <Trash2 className="w-4 h-4 text-error" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirm.open}
        title="Delete Budget Code"
        content="Are you sure you want to delete this budget code? This action cannot be undone."
        action={
          <Button variant="contained" color="error" onClick={handleConfirmDelete} disabled={false}>
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        }
        onClose={handleCloseDeleteConfirm}
      />

      {/* CREATE DIALOG */}
      <Dialog open={openCreateDialog} onClose={closeCreateDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, fontSize: '1.25rem' }}>Add Budget Code</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <form id="create-budget-form" onSubmit={handleSubmitCreate(onSubmitCreate)}>
            <Stack spacing={3}>
              {/* Budget Code */}
              {/* <TextField
                fullWidth
                label="Budget Code"
                placeholder="BDG-XXX-2024"
                {...registerCreate('code')}
                error={!!errorsCreate.code}
                helperText={errorsCreate.code?.message}
                variant="outlined"
              /> */}

              {/* Budget Name */}
              <TextField
                fullWidth
                label="Budget Name"
                placeholder="Operations Budget 2024"
                {...registerCreate('name')}
                error={!!errorsCreate.name}
                helperText={errorsCreate.name?.message}
                variant="outlined"
              />

              {/* Department */}
              <Controller
                name="department"
                control={controlCreate}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errorsCreate.department}>
                    <InputLabel>Department</InputLabel>
                    <Select {...field} label="Department" value={field.value || ''}>
                      <MenuItem value="">Select department</MenuItem>
                      {departments.map((dept) => (
                        <MenuItem key={dept.id} value={String(dept.id)}>
                          {dept.name}
                        </MenuItem>
                      ))}
                    </Select>
                    {errorsCreate.department && (
                      <FormHelperText>{errorsCreate.department.message}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />

              {/* Allocated Amount */}
              <TextField
                fullWidth
                type="number"
                label="Allocated Amount ($)"
                placeholder="0.00"
                inputProps={{ step: '0.01' }}
                {...registerCreate('allocated_amount')}
                error={!!errorsCreate.allocated_amount}
                helperText={errorsCreate.allocated_amount?.message}
                variant="outlined"
              />

              {/* Fiscal Year */}
              <Controller
                name="fiscal_year"
                control={controlCreate}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errorsCreate.fiscal_year}>
                    <InputLabel>Fiscal Year</InputLabel>
                    <Select {...field} label="Fiscal Year" value={field.value || ''}>
                      <MenuItem value="2023">2023</MenuItem>
                      <MenuItem value="2024">2024</MenuItem>
                      <MenuItem value="2025">2025</MenuItem>
                      <MenuItem value="2026">2026</MenuItem>
                    </Select>
                    {errorsCreate.fiscal_year && (
                      <FormHelperText>{errorsCreate.fiscal_year.message}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />

              {/* Active Status */}
              <Controller
                name="is_active"
                control={controlCreate}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Switch {...field} checked={field.value} />}
                    label="Active"
                  />
                )}
              />
            </Stack>
          </form>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            variant="outline"
            label="Cancel"
            onClick={closeCreateDialog}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            label={isCreating ? 'Creating...' : 'Create Budget Code'}
            type="submit"
            form="create-budget-form"
            disabled={isCreating}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* UPDATE DIALOG */}
      <Dialog open={openUpdateDialog} onClose={closeUpdateDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, fontSize: '1.25rem' }}>Edit Budget Code</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <form id="update-budget-form" onSubmit={handleSubmitUpdate(onSubmitUpdate)}>
            <Stack spacing={3}>
              {/* Budget Code - Read Only */}
              {/* <TextField
                fullWidth
                label="Budget Code"
                {...registerUpdate('code')}
                error={!!errorsUpdate.code}
                helperText={errorsUpdate.code?.message}
                variant="outlined"
                slotProps={{
                  input: {
                    readOnly: true,
                  },
                }}
              /> */}

              {/* Budget Name */}
              <TextField
                fullWidth
                label="Budget Name"
                placeholder="Operations Budget 2024"
                {...registerUpdate('name')}
                error={!!errorsUpdate.name}
                helperText={errorsUpdate.name?.message}
                variant="outlined"
              />

              {/* Department */}
              <Controller
                name="department"
                control={controlUpdate}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errorsUpdate.department}>
                    <InputLabel>Department</InputLabel>
                    <Select {...field} label="Department" value={field.value || ''}>
                      <MenuItem value="">Select department</MenuItem>
                      {departments.map((dept) => (
                        <MenuItem key={dept.id} value={String(dept.id)}>
                          {dept.name}
                        </MenuItem>
                      ))}
                    </Select>
                    {errorsUpdate.department && (
                      <FormHelperText>{errorsUpdate.department.message}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />

              {/* Allocated Amount */}
              <TextField
                fullWidth
                type="number"
                label="Allocated Amount ($)"
                placeholder="0.00"
                inputProps={{ step: '0.01' }}
                {...registerUpdate('allocated_amount')}
                error={!!errorsUpdate.allocated_amount}
                helperText={errorsUpdate.allocated_amount?.message}
                variant="outlined"
              />

              {/* Fiscal Year */}
              <Controller
                name="fiscal_year"
                control={controlUpdate}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errorsUpdate.fiscal_year}>
                    <InputLabel>Fiscal Year</InputLabel>
                    <Select {...field} label="Fiscal Year" value={field.value || ''}>
                      <MenuItem value="2023">2023</MenuItem>
                      <MenuItem value="2024">2024</MenuItem>
                      <MenuItem value="2025">2025</MenuItem>
                      <MenuItem value="2026">2026</MenuItem>
                    </Select>
                    {errorsUpdate.fiscal_year && (
                      <FormHelperText>{errorsUpdate.fiscal_year.message}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />

              {/* Active Status */}
              <Controller
                name="is_active"
                control={controlUpdate}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Switch {...field} checked={field.value} />}
                    label="Active"
                  />
                )}
              />
            </Stack>
          </form>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            variant="outline"
            label="Cancel"
            onClick={closeUpdateDialog}
            disabled={isUpdating}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            label={isUpdating ? 'Updating...' : 'Update Budget Code'}
            type="submit"
            form="update-budget-form"
            disabled={isUpdating}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
