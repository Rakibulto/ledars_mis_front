'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';

import { useGetUsers } from 'src/actions/employees';
import { DashboardContent } from 'src/layouts/dashboard';
import {
  useGetPermissions,
  useGetUserPermissions,
  updateUserPermissions,
} from 'src/actions/permissions';
import { useGetPermissionGroups } from 'src/actions/permission-groups';
import {
  PERMISSION_MODULES,
  getAllManagedAppLabels,
  getGroupModuleKeys,
  getModuleByKey,
  getPermissionsForModule,
} from 'src/constants/permission-modules';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { useAuthContext } from 'src/auth/hooks';

import { ModulePermissionCard } from './permission-module-table';

// ----------------------------------------------------------------------

export function PermissionsView() {
  const theme = useTheme();
  const { user } = useAuthContext();

  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedEmployeeName, setSelectedEmployeeName] = useState('');
  const [enabledIds, setEnabledIds] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [collapsedModules, setCollapsedModules] = useState(() => new Set());
  const [collapsedSubmodules, setCollapsedSubmodules] = useState(() => new Set());

  const { users, usersLoading } = useGetUsers();
  const { permissions, permissionsLoading } = useGetPermissions();
  const { userPermissions, userPermissionsLoading } = useGetUserPermissions(selectedUserId);
  const { permissionGroups, permissionGroupsLoading } = useGetPermissionGroups();

  const modulePermissions = useMemo(
    () =>
      PERMISSION_MODULES.reduce((acc, mod) => {
        acc[mod.key] = getPermissionsForModule(mod, permissions);
        return acc;
      }, {}),
    [permissions]
  );

  useEffect(() => {
    if (!userPermissionsLoading && selectedUserId) {
      setEnabledIds(new Set(userPermissions.map((p) => p.id)));
      setSelectedGroupId(null);
    }
  }, [userPermissions, userPermissionsLoading, selectedUserId]);

  const handleSelectUser = useCallback((selected) => {
    setSelectedUserId(selected.id);
    setSelectedEmployeeName(selected.username || selected.email || '');
    setEnabledIds(new Set());
    setSelectedGroupId(null);
    setCollapsedModules(new Set());
    setCollapsedSubmodules(new Set());
  }, []);

  const handleToggle = useCallback((permId) => {
    setEnabledIds((prev) => {
      const next = new Set(prev);
      if (next.has(permId)) next.delete(permId);
      else next.add(permId);
      return next;
    });
    setSelectedGroupId(null);
  }, []);

  const handleToggleIds = useCallback((permIds, enable) => {
    setEnabledIds((prev) => {
      const next = new Set(prev);
      permIds.forEach((id) => {
        if (enable) next.add(id);
        else next.delete(id);
      });
      return next;
    });
    setSelectedGroupId(null);
  }, []);

  const handleToggleAll = useCallback(
    (modKey, enable) => {
      const modPerms = modulePermissions[modKey] || [];
      handleToggleIds(
        modPerms.map((p) => p.id),
        enable
      );
    },
    [modulePermissions, handleToggleIds]
  );

  const handleApplyGroup = useCallback(
    (group) => {
      const groupPermIds = (group.permissions || []).map((p) => p.id);
      // Django app_labels from the group — clear only those apps, not the whole UI module
      const groupAppLabels = new Set(getGroupModuleKeys(group));

      setEnabledIds((prev) => {
        const next = new Set(prev);
        groupAppLabels.forEach((appLabel) => {
          const uiKey = getModuleByKey(appLabel)?.key;
          (modulePermissions[uiKey] || [])
            .filter((perm) => (perm.content_type__app_label || perm.app_label) === appLabel)
            .forEach((perm) => next.delete(perm.id));
        });
        groupPermIds.forEach((id) => next.add(id));
        return next;
      });

      setSelectedGroupId(group.id);
      toast.info(`Applied "${group.name}"`);
    },
    [modulePermissions]
  );

  const handleCollapseToggle = useCallback((modKey) => {
    setCollapsedModules((prev) => {
      const next = new Set(prev);
      if (next.has(modKey)) next.delete(modKey);
      else next.add(modKey);
      return next;
    });
  }, []);

  const handleSubmoduleCollapseToggle = useCallback((subKey) => {
    setCollapsedSubmodules((prev) => {
      const next = new Set(prev);
      if (next.has(subKey)) next.delete(subKey);
      else next.add(subKey);
      return next;
    });
  }, []);

  const handleSave = async () => {
    if (!selectedUserId) return;
    setSaving(true);
    try {
      const managedAppLabels = getAllManagedAppLabels();
      const outsideIds = userPermissions
        .filter((p) => !managedAppLabels.includes(p.app_label))
        .map((p) => p.id);

      const finalIds = [...new Set([...enabledIds, ...outsideIds])];
      await updateUserPermissions(selectedUserId, finalIds);
      toast.success('Permissions saved successfully');
    } catch {
      toast.error('Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = (users || []).filter((u) => {
    const name = (u.username || u.email || '').toLowerCase();
    return name.includes(search.toLowerCase());
  });

  if (user && !user?.is_superuser) {
    return (
      <DashboardContent>
        <Stack alignItems="center" justifyContent="center" sx={{ py: 20 }}>
          <Iconify icon="solar:shield-warning-bold-duotone" width={64} color="error.main" />
          <Typography variant="h4" sx={{ mt: 2 }}>
            Permission Denied
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            You do not have access to this page.
          </Typography>
        </Stack>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: { xs: 3, md: 5 } }}
      >
        <Stack spacing={0.5}>
          <Typography variant="h4">Module Permissions</Typography>
          <Typography variant="body2" color="text.secondary">
            Assign permissions manually or apply a permission group template
          </Typography>
        </Stack>
        <Chip
          icon={<Iconify icon="solar:shield-check-bold-duotone" width={16} />}
          label="Superuser only"
          color="warning"
          variant="soft"
          size="small"
        />
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '300px 1fr' },
          gap: 3,
          alignItems: 'start',
        }}
      >
        <Card sx={{ p: 0, overflow: 'hidden' }}>
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
              Select User
            </Typography>
            <TextField
              size="small"
              fullWidth
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="solar:magnifer-bold-duotone" width={18} />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <Box sx={{ maxHeight: 520, overflowY: 'auto' }}>
            {usersLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5 }}>
                    <Skeleton variant="circular" width={36} height={36} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton width="60%" height={14} />
                      <Skeleton width="40%" height={12} sx={{ mt: 0.5 }} />
                    </Box>
                  </Box>
                ))
              : filteredUsers.map((u) => {
                  const isSelected = u.id === selectedUserId;
                  const name = u.username || u.email || '—';

                  return (
                    <Box
                      key={u.id}
                      onClick={() => handleSelectUser(u)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        px: 2,
                        py: 1.5,
                        cursor: 'pointer',
                        borderLeft: '3px solid',
                        borderLeftColor: isSelected ? 'primary.main' : 'transparent',
                        bgcolor: isSelected
                          ? alpha(theme.palette.primary.main, 0.06)
                          : 'transparent',
                        transition: 'all 0.15s',
                        '&:hover': {
                          bgcolor: isSelected
                            ? alpha(theme.palette.primary.main, 0.08)
                            : alpha(theme.palette.text.primary, 0.04),
                        },
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 36,
                          height: 36,
                          fontSize: 14,
                          fontWeight: 700,
                          bgcolor: isSelected
                            ? 'primary.main'
                            : alpha(theme.palette.text.primary, 0.12),
                          color: isSelected ? 'white' : 'text.primary',
                        }}
                      >
                        {name[0]?.toUpperCase()}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="body2"
                          fontWeight={isSelected ? 700 : 500}
                          noWrap
                          color={isSelected ? 'primary.main' : 'text.primary'}
                        >
                          {name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {u.email || u.username || ''}
                        </Typography>
                      </Box>
                      {isSelected && (
                        <Iconify icon="solar:check-circle-bold" width={18} color="primary.main" />
                      )}
                    </Box>
                  );
                })}

            {!usersLoading && filteredUsers.length === 0 && (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No users found
                </Typography>
              </Box>
            )}
          </Box>
        </Card>

        <Stack spacing={3}>
          {!selectedUserId ? (
            <Card>
              <Stack
                alignItems="center"
                justifyContent="center"
                spacing={2}
                sx={{ py: 10, px: 4, textAlign: 'center' }}
              >
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Iconify icon="solar:shield-user-bold-duotone" width={32} color="primary.main" />
                </Box>
                <Box>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Select a user
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Choose a user from the left to manage their module permissions
                  </Typography>
                </Box>
              </Stack>
            </Card>
          ) : (
            <>
              <Card
                sx={{
                  p: 2.5,
                  bgcolor: alpha(theme.palette.primary.main, 0.04),
                  border: '1px solid',
                  borderColor: alpha(theme.palette.primary.main, 0.15),
                }}
              >
                <Stack spacing={1.5}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Avatar
                        sx={{ width: 40, height: 40, bgcolor: 'primary.main', fontWeight: 700 }}
                      >
                        {selectedEmployeeName[0]?.toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={700}>
                          {selectedEmployeeName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Click a permission group badge to apply a template, then save
                        </Typography>
                      </Box>
                    </Stack>
                    {(userPermissionsLoading || permissionGroupsLoading) && (
                      <CircularProgress size={20} />
                    )}
                  </Stack>

                  {permissionGroups.length > 0 && (
                    <Box>
                      <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mb: 0.75, display: 'block' }}>
                        Permission Groups
                      </Typography>
                      <Stack direction="row" flexWrap="wrap" gap={1}>
                        {permissionGroups.map((group) => (
                          <Chip
                            key={group.id}
                            label={group.name}
                            clickable
                            onClick={() => handleApplyGroup(group)}
                            color={selectedGroupId === group.id ? 'primary' : 'default'}
                            variant={selectedGroupId === group.id ? 'filled' : 'outlined'}
                          />
                        ))}
                      </Stack>
                    </Box>
                  )}
                </Stack>
              </Card>

              {permissionsLoading || userPermissionsLoading
                ? Array.from({ length: 2 }).map((_, i) => (
                    <Card key={i} sx={{ p: 3 }}>
                      <Skeleton width="40%" height={20} sx={{ mb: 2 }} />
                      {Array.from({ length: 4 }).map((__, j) => (
                        <Skeleton key={j} width="100%" height={40} sx={{ mb: 1 }} />
                      ))}
                    </Card>
                  ))
                : PERMISSION_MODULES.map((mod) => (
                    <ModulePermissionCard
                      key={mod.key}
                      mod={mod}
                      modPerms={modulePermissions[mod.key] || []}
                      enabledIds={enabledIds}
                      onToggle={handleToggle}
                      onToggleIds={handleToggleIds}
                      onToggleAll={handleToggleAll}
                      collapsed={collapsedModules.has(mod.key)}
                      onCollapseToggle={() => handleCollapseToggle(mod.key)}
                      collapsedSubmodules={collapsedSubmodules}
                      onSubmoduleCollapseToggle={handleSubmoduleCollapseToggle}
                    />
                  ))}

              <Stack direction="row" justifyContent="flex-end">
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleSave}
                  disabled={saving || !selectedUserId}
                  startIcon={
                    saving ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <Iconify icon="solar:diskette-bold-duotone" width={20} />
                    )
                  }
                  sx={{ minWidth: 180, borderRadius: 2 }}
                >
                  {saving ? 'Saving...' : 'Save Permissions'}
                </Button>
              </Stack>
            </>
          )}
        </Stack>
      </Box>
    </DashboardContent>
  );
}
