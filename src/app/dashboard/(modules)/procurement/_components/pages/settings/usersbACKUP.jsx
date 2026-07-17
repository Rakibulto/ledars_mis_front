'use client';

import { z } from 'zod';
import { mutate } from 'swr';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { useMemo, useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, Plus, Edit, UserX, Search, Trash2, Loader, EyeOff, UserCheck } from 'lucide-react';

import { endpoints } from 'src/utils/axios';

import {
  useGetRequest,
  useDeleteRequest,
  usePatchMutation,
  useCreateMutation,
  useDeleteMutation,
} from 'src/actions/ledars-hook';

import { ConfirmDialog } from 'src/components/custom-dialog';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardBody, CardHeader } from '../../components/ui/card';

// Zod Validation Schema
const userSchema = z.object({
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
    .regex(/[0-9]/, 'Password must contain a number')
    .optional()
    .or(z.literal('')),
  re_password: z.string().optional().or(z.literal('')),
  phone: z.string().optional(),
  role: z.string().optional().or(z.literal('')),
  department: z.string().optional().or(z.literal('')),
  status: z.string().min(1, 'Status is required'),
});

export function UserManagement() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  // console.log('Editing user ID:', editingUserId);
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, userId: null });

  // Fetch roles and departments
  const { data: rolesData } = useGetRequest('/api/user-roles/');
  const { data: departmentsData } = useGetRequest('/api/departments/');

  // Build API query parameters

  // Fetch users data from API
  const { data: usersResponse, loading: usersLoading } = useGetRequest(
    `${endpoints.settings.user_management}?pagination=true&page=${page}&search=${encodeURIComponent(searchQuery)}&status=${statusFilter}&role=${roleFilter}&department=${departmentFilter}  `
  );

  // Mutations
  const { trigger: createUser, isMutating: isCreating } = useCreateMutation(
    endpoints.settings.user_management || '/api/user-management/'
  );

  const { trigger: updateUser, isMutating: isUpdating } = usePatchMutation(
    endpoints.settings.user_management || '/api/user-management/'
  );

  const { trigger: deleteUserMutation, isMutating: isDeleting } = useDeleteMutation(
    endpoints.settings.user_management || '/api/user-management/'
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    resolver: zodResolver(userSchema),
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

  const onSubmit = async (data) => {
    try {
      if (editingUserId) {
        // UPDATE: Don't send password and email, role/department optional
        const updatePayload = {
          username: data.username,
          name: data.name,
          phone: data.phone || '',
          status: data.status || 'active',
        };

        // Only add role if provided
        if (data.role) {
          updatePayload.role = data.role;
        }

        // Only add department if provided
        if (data.department) {
          updatePayload.department = data.department;
        }

        console.log('Update payload:', updatePayload);
        await updateUser({
          url: `${endpoints.settings.user_management}${editingUserId}/`,
          data: updatePayload,
        });

        toast.success('User updated successfully');
      } else {
        // CREATE: Include password
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

        await createUser(createPayload);
        toast.success('User created successfully');
      }

      closeModal();
    } catch (error) {
      console.error('Error:', error);
      toast.error(error?.message || 'Error saving user');
    }
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingUserId(null);
    setShowPassword(false);
    reset();
  };

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape' && showCreateModal) {
        closeModal();
      }
    };

    if (showCreateModal) {
      document.addEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', handleEscapeKey);
        document.body.style.overflow = 'unset';
      };
    }
  }, [showCreateModal]);

  const handleEdit = (user) => {
    console.log('Editing user:', user);
    setEditingUserId(user.id);
    setShowCreateModal(true);
  };
  useEffect(() => {
    if (editingUserId) {
      const userToEdit = usersResponse?.results?.find((u) => u.id === editingUserId);
      const dRoles = rolesData.find((r) => r.name === userToEdit?.role_name);
      const dDepartments = departmentsData.find((d) => d.name === userToEdit?.department_name);
      if (dRoles) {
        userToEdit.role = dRoles.id;
      }
      if (dDepartments) {
        userToEdit.department = dDepartments.id;
      }
      if (userToEdit) {
        setValue('name', userToEdit.name);
        setValue('username', userToEdit.username);
        setValue('phone', userToEdit.phone);
        setValue('role', String(userToEdit.role || ''));
        setValue('department', String(userToEdit.department || ''));
        setValue('status', userToEdit.status);
      }
    }
  }, [editingUserId, usersResponse, rolesData, departmentsData, setValue]);

  const handleDelete = (userId) => {
    console.log('Delete user with ID:', userId);
    setDeleteConfirm({ open: true, userId });
  };

  const deleteRequest = useDeleteRequest;
  const handleConfirmDelete = async () => {
    const { userId } = deleteConfirm;
    setDeleteConfirm({ open: false, userId: null });

    try {
      await deleteRequest(`${endpoints.settings.user_management}${userId}/`);
      toast.success('User deleted successfully');
      mutate(
        `${endpoints.settings.user_management}?pagination=true&page=${page}&search=${encodeURIComponent(searchQuery)}&status=${statusFilter}&role=${roleFilter}&department=${departmentFilter}  `
      );
    } catch (error) {
      toast.error(error?.message || 'Error deleting user');
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
            setEditingUserId(null);
            reset();
            setShowCreateModal(true);
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
                        key={user.id}
                        className="border-b border-border hover:bg-muted/50 transition"
                      >
                        <td className="py-4">
                          <span className="font-medium text-foreground">{user.name}</span>
                        </td>
                        <td className="py-4 text-sm text-muted-foreground">{user.email}</td>
                        <td className="py-4 text-sm text-foreground">{user.username}</td>
                        <td className="py-4 text-sm text-foreground">{user.role}</td>
                        <td className="py-4 text-sm text-foreground">{user.department}</td>
                        <td className="py-4 text-sm text-muted-foreground">{user.phone || '-'}</td>
                        <td className="py-4">
                          <Badge variant={user.status === 'active' ? 'success' : 'error'}>
                            {user.status === 'active' ? (
                              <UserCheck className="w-3 h-3 mr-1" />
                            ) : (
                              <UserX className="w-3 h-3 mr-1" />
                            )}
                            {user.status}
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
                              onClick={() => handleDelete(user.id)}
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

      {/* create  Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-9999 transition-opacity duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          onClick={closeModal}
          onKeyDown={(e) => e.key === 'Escape' && closeModal()}
          tabIndex={-1}
        >
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl z-10000">
            <Card className="max-h-[90vh] overflow-y-auto transform transition-all duration-200 scale-100">
              <CardHeader
                title={editingUserId ? 'Edit User' : 'Add New User'}
                description={
                  editingUserId ? 'Update user account details' : 'Create a new user account'
                }
              />
              <CardBody>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <p className="block text-sm font-medium text-foreground mb-2">Full Name *</p>
                    <input
                      type="text"
                      placeholder="Enter full name"
                      {...register('name')}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                        errors.name ? 'border-error' : 'border-input'
                      }`}
                    />
                    {errors.name && (
                      <p className="text-xs text-error mt-1">{errors.name.message}</p>
                    )}
                  </div>

                  {/* Username & Email */}
                  {!editingUserId ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="block text-sm font-medium text-foreground mb-2">Username *</p>
                        <input
                          type="text"
                          placeholder="Enter username"
                          {...register('username')}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                            errors.username ? 'border-error' : 'border-input'
                          }`}
                        />
                        {errors.username && (
                          <p className="text-xs text-error mt-1">{errors.username.message}</p>
                        )}
                      </div>
                      <div>
                        <p className="block text-sm font-medium text-foreground mb-2">Email *</p>
                        <input
                          type="email"
                          placeholder="Enter email"
                          {...register('email')}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                            errors.email ? 'border-error' : 'border-input'
                          }`}
                        />
                        {errors.email && (
                          <p className="text-xs text-error mt-1">{errors.email.message}</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="block text-sm font-medium text-foreground mb-2">Username</p>
                      <div className="w-full px-3 py-2 border border-input rounded-lg bg-gray-100 text-foreground">
                        <p className="text-sm">View only in edit mode</p>
                      </div>
                    </div>
                  )}

                  {/* Password & Re-password */}
                  {!editingUserId && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="block text-sm font-medium text-foreground mb-2">Password *</p>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Enter password"
                            {...register('password')}
                            className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                              errors.password ? 'border-error' : 'border-input'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        {errors.password && (
                          <p className="text-xs text-error mt-1">{errors.password.message}</p>
                        )}
                      </div>
                      <div>
                        <p className="block text-sm font-medium text-foreground mb-2">
                          Confirm Password *
                        </p>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Confirm password"
                            {...register('re_password')}
                            className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                              errors.re_password ? 'border-error' : 'border-input'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        {errors.re_password && (
                          <p className="text-xs text-error mt-1">{errors.re_password.message}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Phone */}
                  <div>
                    <p className="block text-sm font-medium text-foreground mb-2">Phone</p>
                    <input
                      type="tel"
                      placeholder="Enter phone number (optional)"
                      {...register('phone')}
                      className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {/* Role & Department */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="block text-sm font-medium text-foreground mb-2">Role *</p>
                      <select
                        {...register('role')}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                          errors.role ? 'border-error' : 'border-input'
                        }`}
                      >
                        <option value="">Select role</option>
                        {uniqueRoles.map((role) => (
                          <option key={role.id} value={String(role.id)}>
                            {role.name}
                          </option>
                        ))}
                      </select>
                      {errors.role && (
                        <p className="text-xs text-error mt-1">{errors.role.message}</p>
                      )}
                    </div>
                    <div>
                      <p className="block text-sm font-medium text-foreground mb-2">Department *</p>
                      <select
                        {...register('department')}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                          errors.department ? 'border-error' : 'border-input'
                        }`}
                      >
                        <option value="">Select department</option>
                        {uniqueDepartments.map((dept) => (
                          <option key={dept.id} value={String(dept.id)}>
                            {dept.name}
                          </option>
                        ))}
                      </select>
                      {errors.department && (
                        <p className="text-xs text-error mt-1">{errors.department.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <p className="block text-sm font-medium text-foreground mb-2">Status *</p>
                    <select
                      {...register('status')}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                        errors.status ? 'border-error' : 'border-input'
                      }`}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                    {errors.status && (
                      <p className="text-xs text-error mt-1">{errors.status.message}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 mt-6">
                    <Button
                      variant="primary"
                      className="flex-1"
                      type="submit"
                      disabled={isCreating || isUpdating}
                    >
                      {isCreating || isUpdating ? (
                        <>
                          <Loader className="w-4 h-4 mr-2 animate-spin" />
                          {editingUserId ? 'Updating...' : 'Creating...'}
                        </>
                      ) : editingUserId ? (
                        'Update User'
                      ) : (
                        'Create User'
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      type="button"
                      onClick={closeModal}
                      disabled={isCreating || isUpdating}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardBody>
            </Card>
          </div>
        </div>
      )}

      {/* Update modal */}
      {/* Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-9999 transition-opacity duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          onClick={closeModal}
          onKeyDown={(e) => e.key === 'Escape' && closeModal()}
          tabIndex={-1}
        >
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl z-10000">
            <Card className="max-h-[90vh] overflow-y-auto transform transition-all duration-200 scale-100">
              <CardHeader
                title={editingUserId ? 'Edit User' : 'Add New User'}
                description={
                  editingUserId ? 'Update user account details' : 'Create a new user account'
                }
              />
              <CardBody>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <p className="block text-sm font-medium text-foreground mb-2">Full Name *</p>
                    <input
                      type="text"
                      placeholder="Enter full name"
                      {...register('name')}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                        errors.name ? 'border-error' : 'border-input'
                      }`}
                    />
                    {errors.name && (
                      <p className="text-xs text-error mt-1">{errors.name.message}</p>
                    )}
                  </div>

                  {/* Username  */}
                  {!editingUserId ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="block text-sm font-medium text-foreground mb-2">Username *</p>
                        <input
                          type="text"
                          placeholder="Enter username"
                          {...register('username')}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                            errors.username ? 'border-error' : 'border-input'
                          }`}
                        />
                        {errors.username && (
                          <p className="text-xs text-error mt-1">{errors.username.message}</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="block text-sm font-medium text-foreground mb-2">Username</p>
                      <div className="w-full px-3 py-2 border border-input rounded-lg bg-gray-100 text-foreground">
                        <p className="text-sm">View only in edit mode</p>
                      </div>
                    </div>
                  )}

                  {/* Phone */}
                  <div>
                    <p className="block text-sm font-medium text-foreground mb-2">Phone</p>
                    <input
                      type="tel"
                      placeholder="Enter phone number (optional)"
                      {...register('phone')}
                      className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {/* Role & Department */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="block text-sm font-medium text-foreground mb-2">Role *</p>
                      <select
                        {...register('role')}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                          errors.role ? 'border-error' : 'border-input'
                        }`}
                      >
                        <option value="">Select role</option>
                        {uniqueRoles.map((role) => (
                          <option key={role.id} value={String(role.id)}>
                            {role.name}
                          </option>
                        ))}
                      </select>
                      {errors.role && (
                        <p className="text-xs text-error mt-1">{errors.role.message}</p>
                      )}
                    </div>
                    <div>
                      <p className="block text-sm font-medium text-foreground mb-2">Department *</p>
                      <select
                        {...register('department')}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                          errors.department ? 'border-error' : 'border-input'
                        }`}
                      >
                        <option value="">Select department</option>
                        {uniqueDepartments.map((dept) => (
                          <option key={dept.id} value={String(dept.id)}>
                            {dept.name}
                          </option>
                        ))}
                      </select>
                      {errors.department && (
                        <p className="text-xs text-error mt-1">{errors.department.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <p className="block text-sm font-medium text-foreground mb-2">Status *</p>
                    <select
                      {...register('status')}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                        errors.status ? 'border-error' : 'border-input'
                      }`}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                    {errors.status && (
                      <p className="text-xs text-error mt-1">{errors.status.message}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 mt-6">
                    <Button
                      variant="primary"
                      className="flex-1"
                      type="submit"
                      disabled={isCreating || isUpdating}
                    >
                      {isCreating || isUpdating ? (
                        <>
                          <Loader className="w-4 h-4 mr-2 animate-spin" />
                          {editingUserId ? 'Updating...' : 'Creating...'}
                        </>
                      ) : editingUserId ? (
                        'Update User'
                      ) : (
                        'Create User'
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      type="button"
                      onClick={closeModal}
                      disabled={isCreating || isUpdating}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardBody>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
