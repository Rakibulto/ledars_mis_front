'use client';

import { z } from 'zod';
import { mutate } from 'swr';
import { toast } from 'sonner';
import { useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Edit, UserX, Search, Trash2, Loader, UserCheck } from 'lucide-react';

import {
  Stack,
  Dialog,
  Select,
  MenuItem,
  TextField,
  InputLabel,
  IconButton,
  DialogTitle,
  FormControl,
  DialogContent,
  DialogActions,
  FormHelperText,
  InputAdornment,
} from '@mui/material';

import { endpoints } from 'src/utils/axios';

import {
  useGetRequest,
  usePatchRequest,
  useDeleteRequest,
  useCreateMutation,
} from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardBody, CardHeader } from '../../components/ui/card';

// Zod Validation Schema for CREATE
const createUserSchema = z.object({
  name: z.string().min(1, 'Full name is required').min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  username: z
    .string()
    .min(1, 'Username is required')
    .min(3, 'Username must be at least 3 characters'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
  re_password: z.string().min(1, 'Confirm password is required'),
  phone: z.string().optional().or(z.literal('')),
  role: z.string().min(1, 'Role is required'),
  department: z.string().min(1, 'Department is required'),
  status: z.string().min(1, 'Status is required'),
});

// Zod Validation Schema for UPDATE
const updateUserSchema = z.object({
  name: z.string().min(1, 'Full name is required').min(2, 'Name must be at least 2 characters'),
  username: z.string().min(1, 'Username is required'),
  phone: z.string().optional().or(z.literal('')),
  role: z.string().optional().or(z.literal('')),
  department: z.string().optional().or(z.literal('')),
  status: z.string().min(1, 'Status is required'),
});

export function UserManagement() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, userId: null });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch roles and departments
  const { data: rolesData } = useGetRequest('/api/user-roles/');
  const { data: departmentsData } = useGetRequest('/api/departments/');

  // Fetch users data from API
  const { data: usersResponse, loading: usersLoading } = useGetRequest(
    `${endpoints.settings.user_management}?pagination=true&page=${page}&search=${encodeURIComponent(searchQuery)}&status=${statusFilter}&role=${roleFilter}&department=${departmentFilter}`
  );

  // Mutations
  const { trigger: createUser, isMutating: isCreating } = useCreateMutation(
    endpoints.settings.user_management || '/api/user-management/'
  );

  const patchUser = usePatchRequest;

  // CREATE FORM
  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    formState: { errors: errorsCreate },
    reset: resetCreate,
    control: controlCreate,
    watch: watchCreate,
  } = useForm({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: '',
      email: '',
      username: '',
      password: '',
      re_password: '',
      phone: '',
      role: '',
      department: '',
      status: 'active',
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
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      name: '',
      username: '',
      phone: '',
      role: '',
      department: '',
      status: 'active',
    },
  });

  const [showPassword, setShowPassword] = useState(false);
  const passwordValue = watchCreate('password');

  const onSubmitCreate = async (data) => {
    try {
      const createPayload = {
        username: data.username,
        email: data.email,
        password: data.password,
        re_password: data.re_password || data.password,
        name: data.name,
        role: data.role || null,
        department: data.department || null,
        phone: data.phone || '',
        status: data.status || null,
      };

      console.log('Create payload:', createPayload);

      await createUser(createPayload);
      toast.success('User created successfully');
      closeCreateDialog();
    } catch (error) {
      console.error('Error:', error);
      toast.error(error?.message || 'Error creating user');
    }
  };

  const onSubmitUpdate = async (data) => {
    setIsUpdating(true);
    try {
      const updatePayload = {
        username: data.username,
        name: data.name,
        phone: data.phone || '',
        status: data.status || 'active',
      };

      console.log('Form data for update:', data);

      if (data.role) {
        updatePayload.role = data.role;
      }

      if (data.department) {
        updatePayload.department = data.department;
      }

      console.log('Update payload:', updatePayload);
      await patchUser(`${endpoints.settings.user_management}${editingUserId}/`, updatePayload);

      toast.success('User updated successfully');
      closeUpdateDialog();
    } catch (error) {
      console.error('Error:', error);
      toast.error(error?.message || 'Error updating user');
    } finally {
      setIsUpdating(false);
    }
  };

  const closeCreateDialog = () => {
    setOpenCreateDialog(false);
    resetCreate();
    setShowPassword(false);
  };

  const closeUpdateDialog = () => {
    setOpenUpdateDialog(false);
    setEditingUserId(null);
    resetUpdate();
  };

  const handleEdit = (user) => {
    console.log('Editing user:', user);
    setEditingUserId(user?.id);

    const dRoles = rolesData?.find((r) => r.name === user?.role_name);
    const dDepartments = departmentsData?.find((d) => d.name === user?.department_name);

    setValueUpdate('name', user?.name || '');
    setValueUpdate('username', user?.username || '');
    setValueUpdate('phone', user?.phone || '');
    setValueUpdate('role', dRoles?.id ? String(dRoles.id) : '');
    setValueUpdate('department', dDepartments?.id ? String(dDepartments.id) : '');
    setValueUpdate('status', user?.status || 'active');

    setOpenUpdateDialog(true);
  };

  const handleDelete = (userId) => {
    console.log('Delete user with ID:', userId);
    setDeleteConfirm({ open: true, userId });
  };

  const deleteRequest = useDeleteRequest;
  const handleConfirmDelete = async () => {
    const { userId } = deleteConfirm;
    setDeleteConfirm({ open: false, userId: null });
    setIsDeleting(true);

    try {
      await deleteRequest(`${endpoints.settings.user_management}${userId}/`);
      toast.success('User deleted successfully');
      mutate(
        `${endpoints.settings.user_management}?pagination=true&page=${page}&search=${encodeURIComponent(searchQuery)}&status=${statusFilter}&role=${roleFilter}&department=${departmentFilter}`
      );
    } catch (error) {
      toast.error(error?.message || 'Error deleting user');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseDeleteConfirm = () => {
    setDeleteConfirm({ open: false, userId: null });
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setRoleFilter('');
    setDepartmentFilter('');
    setPage(1);
  };

  const hasActiveFilters = searchQuery || statusFilter !== '' || roleFilter || departmentFilter;

  // Get unique roles and departments from API
  const uniqueRoles = useMemo(() => {
    if (Array.isArray(rolesData)) return rolesData;
    return rolesData?.results || [];
  }, [rolesData]);

  const uniqueDepartments = useMemo(() => {
    if (Array.isArray(departmentsData)) return departmentsData;
    return departmentsData?.results || [];
  }, [departmentsData]);

  const totalPages = usersResponse?.total_pages || 1;
  const totalCount = usersResponse?.count || usersResponse?.results?.length;
  const pageSize = usersResponse?.page_size || 10;
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">User Management</h1>
          <p className="text-muted-foreground">Manage system users and access</p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            resetCreate();
            setOpenCreateDialog(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardBody>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by name, email..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              {/* Role Filter */}
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Roles</option>
                {uniqueRoles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>

              {/* Department Filter */}
              <select
                value={departmentFilter}
                onChange={(e) => {
                  setDepartmentFilter(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Departments</option>
                {uniqueDepartments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-sm text-primary hover:underline font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader
          title={`System Users (${totalCount})`}
          description="Manage user accounts and permissions"
        />
        <CardBody>
          {usersLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading users...</span>
            </div>
          ) : usersResponse?.results?.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">No users found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b-2 border-border">
                    <tr className="text-left">
                      <th className="pb-3 text-sm font-semibold text-foreground">Name</th>
                      <th className="pb-3 text-sm font-semibold text-foreground">Email</th>
                      <th className="pb-3 text-sm font-semibold text-foreground">Username</th>
                      <th className="pb-3 text-sm font-semibold text-foreground">Role</th>
                      <th className="pb-3 text-sm font-semibold text-foreground">Department</th>
                      <th className="pb-3 text-sm font-semibold text-foreground">Phone</th>
                      <th className="pb-3 text-sm font-semibold text-foreground">Status</th>
                      <th className="pb-3 text-sm font-semibold text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersResponse?.results?.map((user) => (
                      <tr
                        key={user?.id}
                        className="border-b border-border hover:bg-muted/50 transition"
                      >
                        <td className="py-4">
                          <span className="font-medium text-foreground">{user?.name}</span>
                        </td>
                        <td className="py-4 text-sm text-muted-foreground">{user?.email}</td>
                        <td className="py-4 text-sm text-foreground">{user?.username}</td>
                        <td className="py-4 text-sm text-foreground">{user?.role_name}</td>
                        <td className="py-4 text-sm text-foreground">{user?.department_name}</td>
                        <td className="py-4 text-sm text-muted-foreground">{user?.phone || '-'}</td>
                        <td className="py-4">
                          <Badge variant={user?.status === 'active' ? 'success' : 'error'}>
                            {user?.status === 'active' ? (
                              <UserCheck className="w-3 h-3 mr-1" />
                            ) : (
                              <UserX className="w-3 h-3 mr-1" />
                            )}
                            {user?.status}
                          </Badge>
                        </td>
                        <td className="py-4">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              className="p-2 hover:bg-muted rounded transition-colors"
                              onClick={() => handleEdit(user)}
                              disabled={isUpdating || isDeleting}
                            >
                              <Edit className="w-4 h-4 text-primary" />
                            </button>
                            <button
                              type="button"
                              className="p-2 hover:bg-muted rounded transition-colors"
                              onClick={() => handleDelete(user?.id)}
                              disabled={false}
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

              {/* Pagination */}
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of{' '}
                  {totalCount} users
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="px-3 py-1 border border-input rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </button>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: Math.min(totalPages, 5) }).map((_, idx) => {
                      const pageNum = idx + 1;
                      return (
                        <button
                          type="button"
                          key={pageNum}
                          className={`px-3 py-1 rounded ${
                            page === pageNum
                              ? 'bg-primary text-white'
                              : 'border border-input hover:bg-muted'
                          }`}
                          onClick={() => setPage(pageNum)}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    className="px-3 py-1 border border-input rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </CardBody>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirm.open}
        title="Delete User"
        content="Are you sure you want to delete this user? This action cannot be undone."
        action={
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        }
        onClose={handleCloseDeleteConfirm}
      />

      {/* CREATE USER DIALOG */}
      <Dialog open={openCreateDialog} onClose={closeCreateDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, fontSize: '1.25rem' }}>Add New User</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <form id="create-user-form" onSubmit={handleSubmitCreate(onSubmitCreate)}>
            <Stack spacing={3}>
              {/* Full Name */}
              <TextField
                fullWidth
                label="Full Name"
                placeholder="Enter full name"
                {...registerCreate('name')}
                error={!!errorsCreate.name}
                helperText={errorsCreate.name?.message}
                variant="outlined"
              />

              {/* Username */}
              <TextField
                fullWidth
                label="Username"
                placeholder="Enter username"
                {...registerCreate('username')}
                error={!!errorsCreate.username}
                helperText={errorsCreate.username?.message}
                variant="outlined"
              />

              {/* Email */}
              <TextField
                fullWidth
                type="email"
                label="Email"
                placeholder="Enter email"
                {...registerCreate('email')}
                error={!!errorsCreate.email}
                helperText={errorsCreate.email?.message}
                variant="outlined"
              />

              {/* Password */}
              <TextField
                fullWidth
                type={showPassword ? 'text' : 'password'}
                label="Password"
                placeholder="Enter password"
                {...registerCreate('password')}
                error={!!errorsCreate.password}
                helperText={errorsCreate.password?.message}
                variant="outlined"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        tabIndex={-1}
                      >
                        <Iconify icon={showPassword ? 'solar:eye-closed-bold' : 'solar:eye-bold'} />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {/* Confirm Password */}
              <TextField
                fullWidth
                type={showPassword ? 'text' : 'password'}
                label="Confirm Password"
                placeholder="Confirm password"
                {...registerCreate('re_password')}
                error={!!errorsCreate.re_password}
                helperText={errorsCreate.re_password?.message}
                variant="outlined"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        tabIndex={-1}
                      >
                        <Iconify icon={showPassword ? 'solar:eye-closed-bold' : 'solar:eye-bold'} />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {/* Phone */}
              <TextField
                fullWidth
                type="tel"
                label="Phone"
                placeholder="Enter phone number (optional)"
                {...registerCreate('phone')}
                error={!!errorsCreate.phone}
                helperText={errorsCreate.phone?.message}
                variant="outlined"
              />

              {/* Role */}
              <Controller
                name="role"
                control={controlCreate}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errorsCreate.role}>
                    <InputLabel>Role</InputLabel>
                    <Select {...field} label="Role" value={field.value || ''}>
                      <MenuItem value="">Select role</MenuItem>
                      {uniqueRoles.map((role) => (
                        <MenuItem key={role.id} value={String(role.id)}>
                          {role.name}
                        </MenuItem>
                      ))}
                    </Select>
                    {errorsCreate.role && (
                      <FormHelperText>{errorsCreate.role.message}</FormHelperText>
                    )}
                  </FormControl>
                )}
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
                      {uniqueDepartments.map((dept) => (
                        <MenuItem key={dept.id} value={String(dept.id)}>
                          {dept.name}
                        </MenuItem>
                      ))}
                      <MenuItem value={String(1)}>dept -1</MenuItem>
                    </Select>
                    {errorsCreate.department && (
                      <FormHelperText>{errorsCreate.department.message}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />

              {/* Status */}
              <Controller
                name="status"
                control={controlCreate}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errorsCreate.status}>
                    <InputLabel>Status</InputLabel>
                    <Select {...field} label="Status" value={field.value || 'active'}>
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="inactive">Inactive</MenuItem>
                    </Select>
                    {errorsCreate.status && (
                      <FormHelperText>{errorsCreate.status.message}</FormHelperText>
                    )}
                  </FormControl>
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
            label={isCreating ? 'Creating...' : 'Create User'}
            type="submit"
            form="create-user-form"
            disabled={isCreating}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* UPDATE USER DIALOG */}
      <Dialog open={openUpdateDialog} onClose={closeUpdateDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, fontSize: '1.25rem' }}>Edit User</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <form id="update-user-form" onSubmit={handleSubmitUpdate(onSubmitUpdate)}>
            <Stack spacing={3}>
              {/* Full Name */}
              <TextField
                fullWidth
                label="Full Name"
                placeholder="Enter full name"
                {...registerUpdate('name')}
                error={!!errorsUpdate.name}
                helperText={errorsUpdate.name?.message}
                variant="outlined"
              />

              {/* Username - Read Only */}
              <TextField
                fullWidth
                label="Username"
                {...registerUpdate('username')}
                error={!!errorsUpdate.username}
                helperText={errorsUpdate.username?.message}
                variant="outlined"
                placeholder="Username (view only)"
                slotProps={{
                  input: {
                    readOnly: true,
                  },
                }}
              />

              {/* Phone */}
              <TextField
                fullWidth
                type="tel"
                label="Phone"
                placeholder="Enter phone number (optional)"
                {...registerUpdate('phone')}
                error={!!errorsUpdate.phone}
                helperText={errorsUpdate.phone?.message}
                variant="outlined"
              />

              {/* Role */}
              <Controller
                name="role"
                control={controlUpdate}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errorsUpdate.role}>
                    <InputLabel>Role</InputLabel>
                    <Select {...field} label="Role" value={field.value || ''}>
                      <MenuItem value="">Select role</MenuItem>
                      {uniqueRoles.map((role) => (
                        <MenuItem key={role.id} value={String(role.id)}>
                          {role.name}
                        </MenuItem>
                      ))}
                    </Select>
                    {errorsUpdate.role && (
                      <FormHelperText>{errorsUpdate.role.message}</FormHelperText>
                    )}
                  </FormControl>
                )}
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
                      {uniqueDepartments.map((dept) => (
                        <MenuItem key={dept.id} value={String(dept.id)}>
                          {dept.name}
                        </MenuItem>
                      ))}
                      <MenuItem value={String(1)}>dept -1</MenuItem>
                    </Select>
                    {errorsUpdate.department && (
                      <FormHelperText>{errorsUpdate.department.message}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />

              {/* Status */}
              <Controller
                name="status"
                control={controlUpdate}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errorsUpdate.status}>
                    <InputLabel>Status</InputLabel>
                    <Select {...field} label="Status" value={field.value || 'active'}>
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="inactive">Inactive</MenuItem>
                    </Select>
                    {errorsUpdate.status && (
                      <FormHelperText>{errorsUpdate.status.message}</FormHelperText>
                    )}
                  </FormControl>
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
            label={isUpdating ? 'Updating...' : 'Update User'}
            type="submit"
            form="update-user-form"
            disabled={isUpdating}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
