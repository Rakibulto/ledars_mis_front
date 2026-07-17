'use client';

import { z as zod } from 'zod';
import { useMemo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { DashboardContent } from 'src/layouts/dashboard';
import { useGetPermissions } from 'src/actions/permissions';
import {
  createPermissionGroup,
  updatePermissionGroup,
  deletePermissionGroup,
  useGetPermissionGroups,
} from 'src/actions/permission-groups';
import {
  PERMISSION_MODULES,
  getGroupModuleKeys,
  getModuleByKey,
  getPermissionsForModule,
  getUiModuleKeysFromAppLabels,
} from 'src/constants/permission-modules';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { useAuthContext } from 'src/auth/hooks';

import { AllModulesPermissionEditor } from './permission-module-table';

// ----------------------------------------------------------------------

const GroupSchema = zod.object({
  name: zod.string().min(1, 'Group name is required'),
  description: zod.string().optional(),
});

const EMPTY_FORM = {
  name: '',
  description: '',
};

function GroupModuleChips({ group }) {
  const moduleKeys = getUiModuleKeysFromAppLabels(
    group.module_keys || getGroupModuleKeys(group)
  );

  if (!moduleKeys.length) {
    return (
      <Typography variant="caption" color="text.secondary">
        No modules
      </Typography>
    );
  }

  return (
    <Stack direction="row" flexWrap="wrap" gap={0.75}>
      {moduleKeys.map((key) => {
        const mod = getModuleByKey(key);
        return (
          <Chip
            key={key}
            size="small"
            variant="soft"
            label={mod?.label || key}
            sx={mod ? { bgcolor: mod.bg, color: mod.color, fontWeight: 600 } : undefined}
          />
        );
      })}
    </Stack>
  );
}

export function PermissionGroupView() {
  const { user } = useAuthContext();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [enabledIds, setEnabledIds] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [collapsedModules, setCollapsedModules] = useState(() => new Set());
  const [collapsedSubmodules, setCollapsedSubmodules] = useState(() => new Set());

  const { permissions, permissionsLoading } = useGetPermissions();
  const { permissionGroups, permissionGroupsLoading, mutatePermissionGroups } =
    useGetPermissionGroups();

  const modulePermissions = useMemo(
    () =>
      PERMISSION_MODULES.reduce((acc, mod) => {
        acc[mod.key] = getPermissionsForModule(mod, permissions);
        return acc;
      }, {}),
    [permissions]
  );

  const resetDialog = useCallback(() => {
    setDialogOpen(false);
    setEditingGroup(null);
    setForm(EMPTY_FORM);
    setEnabledIds(new Set());
    setCollapsedModules(new Set());
    setCollapsedSubmodules(new Set());
  }, []);

  const openCreateDialog = () => {
    setEditingGroup(null);
    setForm(EMPTY_FORM);
    setEnabledIds(new Set());
    setCollapsedModules(new Set());
    setCollapsedSubmodules(new Set());
    setDialogOpen(true);
  };

  const openEditDialog = (group) => {
    setEditingGroup(group);
    setForm({
      name: group.name,
      description: group.description || '',
    });
    setEnabledIds(new Set((group.permissions || []).map((p) => p.id)));
    setCollapsedModules(new Set());
    setCollapsedSubmodules(new Set());
    setDialogOpen(true);
  };

  const handleToggle = useCallback((permId) => {
    setEnabledIds((prev) => {
      const next = new Set(prev);
      if (next.has(permId)) next.delete(permId);
      else next.add(permId);
      return next;
    });
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

  const handleSaveGroup = async () => {
    const parsed = GroupSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || 'Invalid form data');
      return;
    }

    if (!enabledIds.size) {
      toast.error('Select at least one permission for this group');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...parsed.data,
        permission_ids: [...enabledIds],
      };

      if (editingGroup) {
        await updatePermissionGroup(editingGroup.id, payload);
        toast.success('Permission group updated');
      } else {
        await createPermissionGroup(payload);
        toast.success('Permission group created');
      }

      await mutatePermissionGroups();
      resetDialog();
    } catch (error) {
      toast.error(error?.detail || error?.message || 'Failed to save permission group');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGroup = async (group) => {
    try {
      await deletePermissionGroup(group.id);
      toast.success('Permission group deleted');
      await mutatePermissionGroups();
    } catch (error) {
      toast.error(error?.detail || error?.message || 'Failed to delete permission group');
    }
  };

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
          <Typography variant="h4">Permission Groups</Typography>
          <Typography variant="body2" color="text.secondary">
            Create reusable templates across multiple modules
          </Typography>
        </Stack>
        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:add-circle-bold-duotone" />}
          onClick={openCreateDialog}
        >
          Create Group
        </Button>
      </Stack>

      <Card sx={{ overflow: 'hidden' }}>
        {permissionGroupsLoading || permissionsLoading ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <CircularProgress size={28} />
          </Box>
        ) : permissionGroups.length ? (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Group Name</TableCell>
                <TableCell>Modules</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="center">Permissions</TableCell>
                <TableCell align="right" width={120}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {permissionGroups.map((group) => (
                <TableRow key={group.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {group.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <GroupModuleChips group={group} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {group.description || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip size="small" variant="soft" label={group.permissions?.length || 0} />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => openEditDialog(group)}>
                      <Iconify icon="solar:pen-bold" width={18} />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteGroup(group)}
                    >
                      <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <Typography variant="subtitle1" fontWeight={600}>
              No permission groups yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Create a template that can include permissions from multiple modules
            </Typography>
          </Box>
        )}
      </Card>

      <Dialog open={dialogOpen} onClose={resetDialog} fullWidth maxWidth="lg">
        <DialogTitle>
          {editingGroup ? 'Edit Permission Group' : 'Create Permission Group'}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                fullWidth
                label="Group Name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              />
              <TextField
                fullWidth
                label="Description"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </Stack>

            <Box>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                Module Permissions
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                Select permissions per module and submenu. A group can include multiple modules.
              </Typography>

              <AllModulesPermissionEditor
                modules={PERMISSION_MODULES}
                modulePermissions={modulePermissions}
                enabledIds={enabledIds}
                onToggle={handleToggle}
                onToggleIds={handleToggleIds}
                onToggleAll={handleToggleAll}
                collapsedModules={collapsedModules}
                onCollapseToggle={handleCollapseToggle}
                collapsedSubmodules={collapsedSubmodules}
                onSubmoduleCollapseToggle={handleSubmoduleCollapseToggle}
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="outlined" onClick={resetDialog}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveGroup}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {saving ? 'Saving...' : editingGroup ? 'Update Group' : 'Create Group'}
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardContent>
  );
}
