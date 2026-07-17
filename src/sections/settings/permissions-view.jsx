'use client';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import Collapse from '@mui/material/Collapse';
import Skeleton from '@mui/material/Skeleton';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
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

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

const PERMISSION_MODULES = [
  {
    key: 'meeting_management',
    label: 'Meeting Management',
    icon: 'solar:calendar-mark-bold-duotone',
    color: '#3b82f6',
    bg: '#eff6ff',
  },
  {
    key: 'crm',
    label: 'CRM',
    icon: 'solar:users-group-rounded-bold-duotone',
    color: '#8b5cf6',
    bg: '#f5f3ff',
  },
  {
    key: 'accounting',
    label: 'Accounting & Finance',
    icon: 'solar:wallet-money-bold-duotone',
    color: '#059669',
    bg: '#f0fdf4',
    submodules: [
      { label: 'Dashboard', pages: [{ model: 'accountingdashboard', name: 'Dashboard' }] },
      { label: 'Configuration', pages: [
        { model: 'account', name: 'Chart of Accounts' }, { model: 'accounttype', name: 'Account Types' },
        { model: 'journal', name: 'Journals' }, { model: 'tax', name: 'Taxes' },
        { model: 'currency', name: 'Currencies' }, { model: 'costcenter', name: 'Cost Centers' },
        { model: 'fiscalyear', name: 'Fiscal Year' }, { model: 'fiscalperiod', name: 'Fiscal Periods' },
        { model: 'bankaccount', name: 'Bank Accounts' }, { model: 'paymentterm', name: 'Payment Terms' },
      ]},
      { label: 'Transactions', pages: [
        { model: 'journalentry', name: 'Journal Entries' }, { model: 'bill', name: 'Vendor Bills' },
        { model: 'customerinvoice', name: 'Customer Invoices' }, { model: 'creditnote', name: 'Credit Notes' },
        { model: 'debitnote', name: 'Debit Notes' }, { model: 'expenseentry', name: 'Expense Entries' },
        { model: 'payrollentry', name: 'Payroll Entries' }, { model: 'inventoryentry', name: 'Inventory Entries' },
        { model: 'voucher', name: 'Vouchers' }, { model: 'deferredrevenue', name: 'Deferred Revenue' },
        { model: 'deferredexpense', name: 'Deferred Expenses' },
      ]},
      { label: 'Receivables', pages: [
        { model: 'customer', name: 'Customers' }, { model: 'customerreceipt', name: 'Customer Receipts' },
      ]},
      { label: 'Payables', pages: [
        { model: 'vendor', name: 'Vendors' }, { model: 'supplierpayment', name: 'Supplier Payments' },
      ]},
      { label: 'Banking', pages: [
        { model: 'banktransaction', name: 'Bank Transactions' }, { model: 'bankreconciliation', name: 'Bank Reconciliation' },
        { model: 'cashtransaction', name: 'Cash Transactions' },
      ]},
      { label: 'Assets', pages: [
        { model: 'asset', name: 'Fixed Assets' }, { model: 'assetdepreciation', name: 'Depreciation' },
        { model: 'assetdisposal', name: 'Disposal' },
      ]},
      { label: 'Budgets', pages: [
        { model: 'budget', name: 'Budget Plans' }, { model: 'budgetline', name: 'Budget Lines' },
      ]},
      { label: 'Reports', pages: [
        { model: 'financialreporttemplate', name: 'Report Templates' }, { model: 'generatedreport', name: 'Generated Reports' },
      ]},
      { label: 'Settings', pages: [
        { model: 'approvalworkflow', name: 'Approval Workflows' }, { model: 'auditlog', name: 'Audit Log' },
      ]},
    ],
  },
];

const ACTIONS = [
  { key: 'view', label: 'View', icon: 'solar:eye-bold-duotone', color: '#10b981' },
  { key: 'add', label: 'Create', icon: 'solar:add-circle-bold-duotone', color: '#3b82f6' },
  { key: 'change', label: 'Edit', icon: 'solar:pen-bold-duotone', color: '#f59e0b' },
  { key: 'delete', label: 'Delete', icon: 'solar:trash-bin-trash-bold-duotone', color: '#ef4444' },
];

// ----------------------------------------------------------------------

export function PermissionsView() {
  const theme = useTheme();

  const { user } = useAuthContext();

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

  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedEmployeeName, setSelectedEmployeeName] = useState('');
  const [enabledIds, setEnabledIds] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [collapsedModules, setCollapsedModules] = useState(
    new Set(PERMISSION_MODULES.map((m) => m.key))
  );
  const [selectedSubmodule, setSelectedSubmodule] = useState('');
  const [selectedPage, setSelectedPage] = useState('');
  const { users, usersLoading } = useGetUsers();
  const { permissions, permissionsLoading } = useGetPermissions();
  const { userPermissions, userPermissionsLoading } = useGetUserPermissions(selectedUserId);

  const modulePermissions = PERMISSION_MODULES.reduce((acc, mod) => {
    acc[mod.key] = permissions.filter((p) => p.content_type__app_label === mod.key);
    return acc;
  }, {});

  useEffect(() => {
    if (!userPermissionsLoading && selectedUserId) {
      setEnabledIds(new Set(userPermissions.map((p) => p.id)));
    }
  }, [userPermissions, userPermissionsLoading, selectedUserId]);

  const handleSelectUser = useCallback((user) => {
    setSelectedUserId(user.id);
    setSelectedEmployeeName(user.username || user.email || '');
    setEnabledIds(new Set());
    setCollapsedModules(new Set(PERMISSION_MODULES.map((m) => m.key)));
  }, []);

  const handleToggle = useCallback((permId) => {
    setEnabledIds((prev) => {
      const next = new Set(prev);
      if (next.has(permId)) next.delete(permId);
      else next.add(permId);
      return next;
    });
  }, []);

  const handleToggleAll = useCallback(
    (modKey, enable) => {
      const modPerms = modulePermissions[modKey] || [];
      setEnabledIds((prev) => {
        const next = new Set(prev);
        modPerms.forEach((p) => {
          if (enable) next.add(p.id);
          else next.delete(p.id);
        });
        return next;
      });
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

  const handleSave = async () => {
    if (!selectedUserId) return;
    setSaving(true);
    try {
      const ourModuleKeys = PERMISSION_MODULES.map((m) => m.key);
      const outsideIds = userPermissions
        .filter((p) => !ourModuleKeys.includes(p.app_label))
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

  return (
    <DashboardContent>
      {/* Header */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: { xs: 3, md: 5 } }}
      >
        <Stack spacing={0.5}>
          <Typography variant="h4">Module Permissions</Typography>
          <Typography variant="body2" color="text.secondary">
            Control module-level access for each user
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
        {/* ── Left panel: user list ── */}
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

        {/* ── Right panel: permission editor ── */}
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
              {/* Selected user banner */}
              <Card
                sx={{
                  p: 2.5,
                  bgcolor: alpha(theme.palette.primary.main, 0.04),
                  border: '1px solid',
                  borderColor: alpha(theme.palette.primary.main, 0.15),
                }}
              >
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
                        Editing module permissions
                      </Typography>
                    </Box>
                  </Stack>
                  {userPermissionsLoading && <CircularProgress size={20} />}
                </Stack>
              </Card>

              {/* One card per module */}
              {permissionsLoading || userPermissionsLoading
                ? Array.from({ length: 2 }).map((_, i) => (
                    <Card key={i} sx={{ p: 3 }}>
                      <Skeleton width="40%" height={20} sx={{ mb: 2 }} />
                      {Array.from({ length: 4 }).map((__, j) => (
                        <Skeleton key={j} width="100%" height={48} sx={{ mb: 1 }} />
                      ))}
                    </Card>
                  ))
                : PERMISSION_MODULES.map((mod) => {
                    const modPerms = modulePermissions[mod.key] || [];
                    const allEnabled =
                      modPerms.length > 0 && modPerms.every((p) => enabledIds.has(p.id));
                    const someEnabled = modPerms.some((p) => enabledIds.has(p.id));
                    const isCollapsed = collapsedModules.has(mod.key);

                    return (
                      <Card key={mod.key} sx={{ overflow: 'hidden' }}>
                        {/* Module header */}
                        <Box
                          sx={{
                            px: 3,
                            py: 2,
                            bgcolor: mod.bg,
                            borderBottom: isCollapsed ? 'none' : '1px solid',
                            borderColor: alpha(mod.color, 0.15),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          {/* Left: icon + label */}
                          <Stack direction="row" alignItems="center" spacing={1.5}>
                            <Box
                              sx={{
                                width: 36,
                                height: 36,
                                borderRadius: 1.5,
                                bgcolor: alpha(mod.color, 0.12),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Iconify icon={mod.icon} width={20} sx={{ color: mod.color }} />
                            </Box>
                            <Box>
                              <Typography
                                variant="subtitle2"
                                fontWeight={700}
                                sx={{ color: mod.color }}
                              >
                                {mod.label}
                              </Typography>

                              {/* Summary dots — only visible when collapsed */}
                              {isCollapsed ? (
                                <Stack
                                  direction="row"
                                  alignItems="center"
                                  spacing={0.75}
                                  sx={{ mt: 0.5 }}
                                >
                                  {ACTIONS.map((action) => {
                                    const perm = modPerms.find((p) =>
                                      p.codename.startsWith(`${action.key}_`)
                                    );
                                    const enabled = perm && enabledIds.has(perm.id);
                                    return (
                                      <Tooltip
                                        key={action.key}
                                        title={action.label}
                                        placement="top"
                                      >
                                        <Stack direction="row" alignItems="center" spacing={0.4}>
                                          <Box
                                            sx={{
                                              width: 7,
                                              height: 7,
                                              borderRadius: '50%',
                                              bgcolor: enabled
                                                ? action.color
                                                : alpha(theme.palette.text.primary, 0.15),
                                              transition: 'background 0.2s',
                                            }}
                                          />
                                          <Typography
                                            variant="caption"
                                            sx={{
                                              fontSize: 10,
                                              color: enabled ? action.color : 'text.disabled',
                                              fontWeight: enabled ? 600 : 400,
                                              lineHeight: 1,
                                            }}
                                          >
                                            {action.label}
                                          </Typography>
                                        </Stack>
                                      </Tooltip>
                                    );
                                  })}
                                </Stack>
                              ) : (
                                <Typography variant="caption" color="text.secondary">
                                  {modPerms.length} permissions available
                                </Typography>
                              )}
                            </Box>
                          </Stack>

                          {/* Right: status + enable all + collapse toggle */}
                          <Stack direction="row" alignItems="center" spacing={1}>
                            {!isCollapsed && (
                              <>
                                <Typography variant="caption" color="text.secondary">
                                  {allEnabled
                                    ? 'All enabled'
                                    : someEnabled
                                      ? 'Partial'
                                      : 'None enabled'}
                                </Typography>
                                <Button
                                  size="small"
                                  variant="soft"
                                  color={allEnabled ? 'error' : 'primary'}
                                  onClick={() => handleToggleAll(mod.key, !allEnabled)}
                                  sx={{ minWidth: 90, fontSize: 12 }}
                                >
                                  {allEnabled ? 'Disable all' : 'Enable all'}
                                </Button>
                              </>
                            )}
                            <Tooltip title={isCollapsed ? 'Expand' : 'Collapse'} placement="top">
                              <IconButton
                                size="small"
                                onClick={() => handleCollapseToggle(mod.key)}
                                sx={{
                                  color: mod.color,
                                  bgcolor: alpha(mod.color, 0.08),
                                  '&:hover': { bgcolor: alpha(mod.color, 0.16) },
                                  transition: 'transform 0.2s',
                                  transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                                }}
                              >
                                <Iconify icon="solar:alt-arrow-down-bold" width={16} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </Box>

                        {/* Collapsible permission rows */}
                        <Collapse in={!isCollapsed} timeout={200}>
                          <Box sx={{ px: 3, py: 1 }}>
                            {mod.submodules ? (
                              <>
                                <TextField select size="small" fullWidth label="Select Submodule" value={selectedSubmodule || ''} onChange={(e) => { setSelectedSubmodule(e.target.value); setSelectedPage(''); }} sx={{ mb: 2 }}>
                                  <MenuItem value="">All Submodules</MenuItem>
                                  {mod.submodules.map((sub) => (
                                    <MenuItem key={sub.label} value={sub.label}>{sub.label}</MenuItem>
                                  ))}
                                </TextField>
                                {selectedSubmodule && (() => {
                                  const sub = mod.submodules.find((s) => s.label === selectedSubmodule);
                                  if (!sub) return null;
                                  return (
                                    <TextField select size="small" fullWidth label="Select Page" value={selectedPage || ''} onChange={(e) => setSelectedPage(e.target.value)} sx={{ mb: 2 }}>
                                      <MenuItem value="">All Pages</MenuItem>
                                      {sub.pages.map((pg) => (
                                        <MenuItem key={pg.model} value={pg.model}>{pg.name}</MenuItem>
                                      ))}
                                    </TextField>
                                  );
                                })()}
                                {selectedSubmodule && selectedPage && mod.submodules.filter((sub) => sub.label === selectedSubmodule).map((sub) => {
                                  const subPerms = modPerms.filter((p) => p.content_type__model === selectedPage)
                                    .sort((a, b) => {
                                      const aIdx = ACTIONS.findIndex((ac) => a.codename.startsWith(`${ac.key}_`));
                                      const bIdx = ACTIONS.findIndex((ac) => b.codename.startsWith(`${ac.key}_`));
                                      return aIdx - bIdx;
                                    });
                                  if (subPerms.length === 0) return null;
                                  const subAllEnabled = subPerms.every((p) => enabledIds.has(p.id));
                                  const pageInfo = sub.pages.find((pg) => pg.model === selectedPage);
                                  const pageName = pageInfo?.name || selectedPage;
                                  return (
                                    <Card key={sub.label} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                                          <Typography variant="subtitle2" fontWeight={700}>{sub.label} — {pageName}</Typography>
                                          <Button size="small" variant="text" color={subAllEnabled ? 'error' : 'primary'} onClick={() => { const subIds = subPerms.map((p) => p.id); setEnabledIds((prev) => { const next = new Set(prev); if (subAllEnabled) subIds.forEach((id) => next.delete(id)); else subIds.forEach((id) => next.add(id)); return next; }); }} sx={{ fontSize: 11 }}>
                                            {subAllEnabled ? 'Disable all' : 'Enable all'}
                                          </Button>
                                        </Stack>
                                      </Box>
                                      <Box sx={{ p: 1 }}>
                                        {subPerms.map((perm, idx) => {
                                          const enabled = enabledIds.has(perm.id);
                                          const actionKey = perm.codename.split('_')[0];
                                          const action = ACTIONS.find((a) => a.key === actionKey);
                                          return (
                                            <Stack key={perm.id} direction="row" alignItems="center" justifyContent="space-between" sx={{ py: 1.5, px: 1, borderBottom: idx < subPerms.length - 1 ? '1px dashed' : 'none', borderColor: 'divider' }}>
                                              <Stack direction="row" alignItems="center" spacing={1.5}>
                                                <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: enabled ? alpha(action?.color || '#666', 0.1) : alpha('#666', 0.04), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                  <Iconify icon={action?.icon || 'solar:question-circle-bold'} width={18} sx={{ color: enabled ? action?.color || 'text.secondary' : 'text.disabled' }} />
                                                </Box>
                                                <Box>
                                                  <Typography variant="body2" fontWeight={600}>{action?.label || actionKey}</Typography>
                                                  <Typography variant="caption" color="text.secondary">{perm.name}</Typography>
                                                </Box>
                                              </Stack>
                                              <Switch
                                                checked={enabled}
                                                onChange={() => handleToggle(perm.id)}
                                                size="small"
                                                sx={{
                                                  '& .MuiSwitch-switchBase.Mui-checked': { color: enabled ? action?.color || '#666' : undefined },
                                                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: enabled ? action?.color || '#666' : undefined },
                                                  '& .MuiSwitch-track': { bgcolor: enabled ? alpha(action?.color || '#666', 0.3) : undefined },
                                                }}
                                              />
                                            </Stack>
                                          );
                                        })}
                                      </Box>
                                    </Card>
                                  );
                                })}
                                {selectedSubmodule && !selectedPage && (
                                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                                    Select a page above to view permissions
                                  </Typography>
                                )}
                              </>
                            ) : (
                              ACTIONS.map((action, idx) => {
                                const perm = modPerms.find((p) => p.codename.startsWith(`${action.key}_`));
                                if (!perm) return null;
                                const enabled = enabledIds.has(perm.id);
                                return (
                                  <Box key={action.key}>
                                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ py: 1.75 }}>
                                      <Stack direction="row" alignItems="center" spacing={1.5}>
                                        <Box sx={{ width: 32, height: 32, borderRadius: 1, bgcolor: enabled ? alpha(action.color, 0.1) : alpha(theme.palette.text.primary, 0.04), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                          <Iconify icon={action.icon} width={16} sx={{ color: enabled ? action.color : 'text.disabled' }} />
                                        </Box>
                                        <Box>
                                          <Typography variant="body2" fontWeight={600}>{action.label}</Typography>
                                          <Typography variant="caption" color="text.secondary">{perm.name}</Typography>
                                        </Box>
                                      </Stack>
                                      <Switch checked={enabled} onChange={() => handleToggle(perm.id)} size="small" sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: action.color }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: action.color } }} />
                                    </Stack>
                                    {idx < ACTIONS.length - 1 && <Divider sx={{ borderStyle: 'dashed' }} />}
                                  </Box>
                                );
                              })
                            )}
                          </Box>
                        </Collapse>
                      </Card>
                    );
                  })}

              {/* Save */}
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
