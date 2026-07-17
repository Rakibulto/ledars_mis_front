'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useMemo, useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Plus, Edit, Hash, Trash2, Loader } from 'lucide-react';

import {
  Stack,
  Dialog,
  Select,
  MenuItem,
  TextField,
  InputLabel,
  DialogTitle,
  FormControl,
  DialogContent,
  DialogActions,
  FormHelperText,
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

export function AccountCodeSetup() {
  const { data: categoryData } = useGetRequest(endpoints.procurement_management.account_categories);

  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, accountId: null });
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch account codes from API
  const { data: accountResponse, loading: accountLoading } = useGetRequest(
    `${endpoints.procurement_management.account_codes}?pagination=true&page=${page}&search=${encodeURIComponent(searchQuery)}`
  );

  // Mutations
  const { trigger: createAccount, isMutating: isCreating } = useCreateMutation(
    endpoints.procurement_management.account_codes || '/api/account-codes/'
  );
  const patchAccount = usePatchRequest;
  const deleteAccount = useDeleteRequest;

  // CREATE FORM
  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    formState: { errors: errorsCreate },
    reset: resetCreate,
    control: controlCreate,
    watch: watchCreate,
    setValue: setValueCreate,
  } = useForm({
    defaultValues: {
      name: '',
      category: null,
      sub_category: null,
      balance: '',
    },
  });

  // UPDATE FORM
  const {
    register: registerUpdate,
    handleSubmit: handleSubmitUpdate,
    formState: { errors: errorsUpdate },
    reset: resetUpdate,
    control: controlUpdate,
    watch: watchUpdate,
    setValue: setValueUpdate,
  } = useForm({
    defaultValues: {
      code: '',
      name: '',
      category: null,
      sub_category: null,
      balance: '',
    },
  });

  const onSubmitCreate = async (data) => {
    try {
      console.log('Creating account code:', data);

      const createPayload = {
        name: data.name,
        category: data.category || null,
        sub_category: data.sub_category || null,
        balance: data.balance ? data.balance.toString() : null,
      };

      await createAccount(createPayload);
      toast.success('Account code created successfully');
      closeCreateDialog();
      mutate(
        `${endpoints.procurement_management.account_codes || '/api/account-codes/'}?pagination=true&page=${page}&search=${encodeURIComponent(searchQuery)}`
      );
    } catch (error) {
      console.error('Error creating account code:', error);
      toast.error(error?.message || 'Error creating account code');
    }
  };

  const onSubmitUpdate = async (data) => {
    setIsUpdating(true);
    try {
      const updatePayload = {
        name: data.name,
        category: data.category || null,
        sub_category: data.sub_category || null,
        balance: data.balance ? data.balance.toString() : null,
      };
      console.log('Updating account code with ID:', editingAccountId, 'Payload:', updatePayload);
      await patchAccount(
        `${endpoints.procurement_management.account_codes}${editingAccountId}/`,
        updatePayload
      );

      toast.success('Account code updated successfully');
      closeUpdateDialog();
      mutate(
        `${endpoints.procurement_management.account_codes}?pagination=true&page=${page}&search=${encodeURIComponent(searchQuery)}`
      );
    } catch (error) {
      console.error('Error updating account code:', error);
      toast.error(error?.message || 'Error updating account code');
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
    setEditingAccountId(null);
    resetUpdate();
  };

  const handleEdit = (account) => {
    console.log('Editing account code:', account);
    setEditingAccountId(account.id);
    setOpenUpdateDialog(true);

    setValueUpdate('code', account.code || '');
    setValueUpdate('name', account.name || '');
    setValueUpdate('category', account.category || null);
    setValueUpdate('sub_category', account.sub_category || null);
    setValueUpdate('balance', account.balance ?? '');
  };

  const handleDelete = (accountId) => {
    console.log('Delete account code with ID:', accountId);
    setDeleteConfirm({ open: true, accountId });
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    const { accountId } = deleteConfirm;
    setDeleteConfirm({ open: false, accountId: null });

    try {
      await deleteAccount(`${endpoints.procurement_management.account_codes}${accountId}/`);
      toast.success('Account code deleted successfully');
      mutate(
        `${endpoints.procurement_management.account_codes}?pagination=true&page=${page}&search=${encodeURIComponent(searchQuery)}`
      );
    } catch (error) {
      console.error('Error deleting account code:', error);
      toast.error(error?.message || 'Error deleting account code');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseDeleteConfirm = () => {
    setDeleteConfirm({ open: false, accountId: null });
  };

  // Use API data
  const accountCodes = useMemo(() => {
    if (accountLoading) return [];
    if (Array.isArray(accountResponse?.results)) {
      return accountResponse.results;
    }
    return Array.isArray(accountResponse) ? accountResponse : [];
  }, [accountResponse, accountLoading]);

  const totalCount = accountResponse?.count || accountCodes.length;
  const totalPages = accountResponse?.total_pages || 1;

  const selectedCreateCategory = watchCreate('category');
  const selectedUpdateCategory = watchUpdate('category');

  const categoryOptions = useMemo(() => {
    if (Array.isArray(categoryData?.results)) {
      return categoryData.results;
    }
    return Array.isArray(categoryData) ? categoryData : [];
  }, [categoryData]);

  const mainCategoryOptions = useMemo(
    () =>
      categoryOptions
        .filter((cat) => !cat.parent)
        .map((cat) => ({ value: cat.id, label: cat.name })),
    [categoryOptions]
  );

  const createSubCategoryOptions = useMemo(() => {
    const selectedCategory = categoryOptions.find((cat) => cat.id === selectedCreateCategory);
    if (!selectedCategory) return [];
    return (selectedCategory.subcategories || []).map((cat) => ({
      value: cat.id,
      label: cat.name,
    }));
  }, [categoryOptions, selectedCreateCategory]);

  const updateSubCategoryOptions = useMemo(() => {
    const selectedCategory = categoryOptions.find((cat) => cat.id === selectedUpdateCategory);
    if (!selectedCategory) return [];
    return (selectedCategory.subcategories || []).map((cat) => ({
      value: cat.id,
      label: cat.name,
    }));
  }, [categoryOptions, selectedUpdateCategory]);

  useEffect(() => {
    const currentSubCategory = watchCreate('sub_category');
    if (!selectedCreateCategory) {
      setValueCreate('sub_category', null);
      return;
    }
    if (
      currentSubCategory &&
      !createSubCategoryOptions.some((option) => option.value === currentSubCategory)
    ) {
      setValueCreate('sub_category', null);
    }
  }, [selectedCreateCategory, createSubCategoryOptions, setValueCreate, watchCreate]);

  useEffect(() => {
    const currentSubCategory = watchUpdate('sub_category');
    if (!selectedUpdateCategory) {
      setValueUpdate('sub_category', null);
      return;
    }
    if (
      currentSubCategory &&
      !updateSubCategoryOptions.some((option) => option.value === currentSubCategory)
    ) {
      setValueUpdate('sub_category', null);
    }
  }, [selectedUpdateCategory, updateSubCategoryOptions, setValueUpdate, watchUpdate]);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Account Code Setup</h1>
          <p className="text-muted-foreground">Manage chart of accounts and GL codes</p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            resetCreate();
            setOpenCreateDialog(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Account Code
        </Button>
      </div>

      {/* Account Codes Table */}
      <Card>
        <CardHeader
          title={`Account Codes (${totalCount})`}
          description="General ledger account classification"
        />
        <CardBody>
          {accountLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading account codes...</span>
            </div>
          ) : accountCodes.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">No account codes found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b-2 border-border">
                  <tr className="text-left">
                    <th className="pb-3 text-sm font-semibold text-foreground">Account Code</th>
                    <th className="pb-3 text-sm font-semibold text-foreground">Account Name</th>
                    <th className="pb-3 text-sm font-semibold text-foreground">Category</th>
                    <th className="pb-3 text-sm font-semibold text-foreground">Subcategory</th>
                    <th className="pb-3 text-sm font-semibold text-foreground">Balance</th>
                    <th className="pb-3 text-sm font-semibold text-foreground">Status</th>
                    <th className="pb-3 text-sm font-semibold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {accountCodes.map((account) => (
                    <tr
                      key={account.id}
                      className="border-b border-border hover:bg-muted/50 transition"
                    >
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <Hash className="w-4 h-4 text-primary" />
                          <span className="font-mono font-semibold text-foreground">
                            {account.code}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 text-sm text-foreground">{account.name}</td>
                      <td className="py-4">
                        <Badge
                          variant={
                            account.category_details?.name === 'Capital Expenditure' ||
                            account.category_details?.name === 'capex'
                              ? 'warning'
                              : 'default'
                          }
                        >
                          {account.category_details?.name || '-'}
                        </Badge>
                      </td>
                      <td className="py-4 text-sm text-foreground">
                        {account.sub_category_details?.name || '-'}
                      </td>
                      <td className="py-4 text-sm text-foreground">{account.balance ?? '0.00'}</td>
                      <td className="py-4">
                        <Badge variant="success">Active</Badge>
                      </td>
                      <td className="py-4">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="p-2 hover:bg-muted rounded transition-colors"
                            onClick={() => handleEdit(account)}
                            disabled={isUpdating || isDeleting}
                          >
                            <Edit className="w-4 h-4 text-primary" />
                          </button>
                          <button
                            type="button"
                            className="p-2 hover:bg-muted rounded transition-colors"
                            onClick={() => handleDelete(account.id)}
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
        title="Delete Account Code"
        content="Are you sure you want to delete this account code? This action cannot be undone."
        action={
          <Button variant="contained" color="error" onClick={handleConfirmDelete} disabled={false}>
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        }
        onClose={handleCloseDeleteConfirm}
      />

      {/* CREATE DIALOG */}
      <Dialog open={openCreateDialog} onClose={closeCreateDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, fontSize: '1.25rem' }}>Add Account Code</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <form id="create-account-form" onSubmit={handleSubmitCreate(onSubmitCreate)}>
            <Stack spacing={3}>
              {/* Account Name */}
              <TextField
                fullWidth
                label="Account Name"
                placeholder="Cardiology"
                {...registerCreate('name', { required: 'Account name is required' })}
                error={!!errorsCreate.name}
                helperText={errorsCreate.name?.message}
                variant="outlined"
              />

              {/* Category */}
              <Controller
                name="category"
                control={controlCreate}
                rules={{ required: 'Category is required' }}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errorsCreate.category}>
                    <InputLabel>Category</InputLabel>
                    <Select {...field} label="Category" value={field.value || ''}>
                      <MenuItem value="">Select category</MenuItem>
                      {mainCategoryOptions.map((cat) => (
                        <MenuItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </MenuItem>
                      ))}
                    </Select>
                    {errorsCreate.category && (
                      <FormHelperText>{errorsCreate.category.message}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />

              {/* Subcategory */}
              <Controller
                name="sub_category"
                control={controlCreate}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errorsCreate.sub_category}>
                    <InputLabel>Subcategory</InputLabel>
                    <Select {...field} label="Subcategory" value={field.value || ''}>
                      <MenuItem value="">Select subcategory</MenuItem>
                      {createSubCategoryOptions.map((cat) => (
                        <MenuItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </MenuItem>
                      ))}
                    </Select>
                    {errorsCreate.sub_category && (
                      <FormHelperText>{errorsCreate.sub_category.message}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />

              {/* Balance */}
              <TextField
                fullWidth
                type="number"
                label="Balance"
                placeholder="0.00"
                inputProps={{ step: '0.01', min: '0' }}
                {...registerCreate('balance', {
                  valueAsNumber: true,
                  validate: (value) =>
                    value === '' ||
                    value === null ||
                    !Number.isNaN(value) ||
                    'Enter a valid balance',
                })}
                error={!!errorsCreate.balance}
                helperText={errorsCreate.balance?.message}
                variant="outlined"
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
            label={isCreating ? 'Creating...' : 'Create Account Code'}
            type="submit"
            form="create-account-form"
            disabled={isCreating}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* UPDATE DIALOG */}
      <Dialog open={openUpdateDialog} onClose={closeUpdateDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, fontSize: '1.25rem' }}>Edit Account Code</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <form id="update-account-form" onSubmit={handleSubmitUpdate(onSubmitUpdate)}>
            <Stack spacing={3}>
              {/* Account Code - Read Only */}
              <TextField
                fullWidth
                label="Account Code"
                {...registerUpdate('code')}
                error={!!errorsUpdate.code}
                helperText={errorsUpdate.code?.message}
                variant="outlined"
                InputProps={{
                  readOnly: true,
                }}
              />

              {/* Account Name */}
              <TextField
                fullWidth
                label="Account Name"
                placeholder="Office Supplies"
                {...registerUpdate('name', { required: 'Account name is required' })}
                error={!!errorsUpdate.name}
                helperText={errorsUpdate.name?.message}
                variant="outlined"
              />

              {/* Category */}
              <Controller
                name="category"
                control={controlUpdate}
                rules={{ required: 'Category is required' }}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errorsUpdate.category}>
                    <InputLabel>Category</InputLabel>
                    <Select {...field} label="Category" value={field.value || ''}>
                      <MenuItem value="">Select category</MenuItem>
                      {mainCategoryOptions.map((cat) => (
                        <MenuItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </MenuItem>
                      ))}
                    </Select>
                    {errorsUpdate.category && (
                      <FormHelperText>{errorsUpdate.category.message}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />

              {/* Subcategory */}
              <Controller
                name="sub_category"
                control={controlUpdate}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errorsUpdate.sub_category}>
                    <InputLabel>Subcategory</InputLabel>
                    <Select {...field} label="Subcategory" value={field.value || ''}>
                      <MenuItem value="">Select subcategory</MenuItem>
                      {updateSubCategoryOptions.map((cat) => (
                        <MenuItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </MenuItem>
                      ))}
                    </Select>
                    {errorsUpdate.sub_category && (
                      <FormHelperText>{errorsUpdate.sub_category.message}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />

              {/* Balance */}
              <TextField
                fullWidth
                type="number"
                label="Balance"
                placeholder="0.00"
                inputProps={{ step: '0.01', min: '0' }}
                {...registerUpdate('balance', {
                  valueAsNumber: true,
                  validate: (value) =>
                    value === '' ||
                    value === null ||
                    !Number.isNaN(value) ||
                    'Enter a valid balance',
                })}
                error={!!errorsUpdate.balance}
                helperText={errorsUpdate.balance?.message}
                variant="outlined"
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
            label={isUpdating ? 'Updating...' : 'Update Account Code'}
            type="submit"
            form="update-account-form"
            disabled={isUpdating}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
