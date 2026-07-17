'use client';

import { mutate } from 'swr';
import { useState, useEffect, useCallback } from 'react';

import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import {
  Box,
  Chip,
  Paper,
  Stack,
  Table,
  Alert,
  Button,
  Dialog,
  Switch,
  Tooltip,
  Divider,
  TableRow,
  MenuItem,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  IconButton,
  Typography,
  DialogTitle,
  Autocomplete,
  DialogContent,
  DialogActions,
  TableContainer,
  InputAdornment,
  FormControlLabel,
  CircularProgress,
} from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';
// import axiosInstance from 'src/utils/axios';

// helpers
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : 'N/A');
const statusChip = (active) => (
  <Chip
    label={active ? 'Active' : 'Inactive'}
    color={active ? 'success' : 'default'}
    size="small"
    variant="outlined"
  />
);
const emptyLevel = (n, fromAmount = '') => ({
  level_number: n,
  from_amount: fromAmount,
  to_amount: '',
  minimum_approval_required: 1,
  level_maintain_require: 'yes',
  users: [], // [{ user_id, approval_order }]
});

// ─────────────────────────────────────────────────────────────────────────────
// TAB 0 – Approval Workflow table
// ─────────────────────────────────────────────────────────────────────────────

function WorkflowTab() {
  const [search, setSearch] = useState('');
  const [filterModuleType, setFilterModuleType] = useState('');
  const [filterMenu, setFilterMenu] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [openCreate, setOpenCreate] = useState(false);
  const [detailRow, setDetailRow] = useState(null);
  const [editWorkflow, setEditWorkflow] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ── filter options ────────────────────────────────────────────────────────
  const { data: formOptionsData } = useGetRequest(
    endpoints.storeInventory.approval_workflow_form_options
  );
  const moduleTypes = formOptionsData?.module_types ?? [];
  const menus = filterModuleType ? (formOptionsData?.menus?.[filterModuleType] ?? []) : [];

  // reset menu when module type changes
  const handleModuleTypeChange = (e) => {
    setFilterModuleType(e.target.value);
    setFilterMenu('');
  };

  const hasFilters = search || filterModuleType || filterMenu || filterStatus;
  const handleClear = () => {
    setSearch('');
    setFilterModuleType('');
    setFilterMenu('');
    setFilterStatus('');
  };

  // ── URL with all active params ────────────────────────────────────────────
  const url = (() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (filterModuleType) params.set('module_type', filterModuleType);
    if (filterMenu) params.set('menu', filterMenu);
    if (filterStatus) params.set('is_active', filterStatus);
    const qs = params.toString();
    return qs
      ? `${endpoints.storeInventory.approval_workflows}?${qs}`
      : endpoints.storeInventory.approval_workflows;
  })();

  const { data, loading: isLoading, error } = useGetRequest(url);
  const rows = data?.results ?? data ?? [];

  const openDeleteDialog = useCallback((row) => {
    setDeleteTarget(row);
  }, []);

  const closeDeleteDialog = useCallback(() => {
    if (!deleting) {
      setDeleteTarget(null);
    }
  }, [deleting]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget?.id) return;

    setDeleting(true);
    try {
      await axiosInstance.delete(endpoints.storeInventory.approval_workflow_by_id(deleteTarget.id));
      setDeleteTarget(null);
      mutate(url);
    } catch {
      /* */
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, url]);

  const handleToggleStatus = useCallback(
    async (id) => {
      try {
        await axiosInstance.patch(endpoints.storeInventory.approval_workflow_toggle_status(id));
        mutate(url);
      } catch {
        /* */
      }
    },
    [url]
  );

  return (
    <Box>
      {/* ── filter bar ──────────────────────────────────────────────────────── */}
      <Paper variant="outlined" sx={{ p: 1.5, mb: 2 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          alignItems="center"
          flexWrap="wrap"
        >
          <TextField
            size="small"
            placeholder="Search by module or menu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 220, flex: 1 }}
          />
          <TextField
            select
            size="small"
            label="Module Type"
            value={filterModuleType}
            onChange={handleModuleTypeChange}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">All</MenuItem>
            {moduleTypes.map((t) => (
              <MenuItem key={t.id} value={t.id}>
                {t.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Menu"
            value={filterMenu}
            onChange={(e) => setFilterMenu(e.target.value)}
            disabled={menus.length === 0}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">All</MenuItem>
            {menus.map((m) => (
              <MenuItem key={m.id} value={m.id}>
                {m.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="true">Active</MenuItem>
            <MenuItem value="false">Inactive</MenuItem>
          </TextField>
          {hasFilters && (
            <Button size="small" variant="outlined" color="inherit" onClick={handleClear}>
              Clear
            </Button>
          )}
          <Box sx={{ ml: 'auto' }}>
            <Stack direction="row" spacing={1}>
              <Tooltip title="Refresh">
                <IconButton onClick={() => mutate(url)}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenCreate(true)}
              >
                Add Workflow
              </Button>
            </Stack>
          </Box>
        </Stack>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load workflows.
        </Alert>
      )}

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell>#</TableCell>
              <TableCell>Module Type</TableCell>
              <TableCell>Menu / Module</TableCell>
              <TableCell align="center">Total Levels</TableCell>
              <TableCell>Created By</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            )}
            {!isLoading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ color: 'text.secondary' }}>
                  No workflows configured yet.
                </TableCell>
              </TableRow>
            )}
            {rows.map((row, idx) => (
              <TableRow
                key={row.id}
                hover
                sx={{ cursor: 'pointer' }}
                onClick={() => setDetailRow(row)}
              >
                <TableCell>{idx + 1}</TableCell>
                <TableCell>{row.module_type_name}</TableCell>
                <TableCell>{row.menu_name}</TableCell>
                <TableCell align="center">
                  <Chip label={row.total_levels} size="small" color="primary" variant="outlined" />
                </TableCell>
                <TableCell>{row.created_by_name ?? 'N/A'}</TableCell>
                <TableCell>
                  <Tooltip title="Click to toggle status">
                    <Box
                      component="span"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleStatus(row.id);
                      }}
                      sx={{ cursor: 'pointer' }}
                    >
                      {statusChip(row.is_active)}
                    </Box>
                  </Tooltip>
                </TableCell>
                <TableCell>{fmtDate(row.created_at)}</TableCell>
                <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => setEditWorkflow(row)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" color="error" onClick={() => openDeleteDialog(row)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {openCreate && (
        <WorkflowFormDialog
          open
          onClose={() => setOpenCreate(false)}
          onSaved={() => {
            setOpenCreate(false);
            mutate(url);
          }}
        />
      )}
      {editWorkflow && (
        <WorkflowFormDialog
          open
          workflowId={editWorkflow.id}
          onClose={() => setEditWorkflow(null)}
          onSaved={() => {
            setEditWorkflow(null);
            mutate(url);
          }}
        />
      )}
      {detailRow && <WorkflowDetailDialog row={detailRow} onClose={() => setDetailRow(null)} />}

      <Dialog open={Boolean(deleteTarget)} onClose={closeDeleteDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Approval Workflow</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2">
            Are you sure you want to delete workflow for menu{' '}
            <strong>{deleteTarget?.menu_name || '-'}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog} disabled={deleting} color="inherit">
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleConfirmDelete}
            disabled={deleting}
          >
            {deleting ? <CircularProgress size={18} color="inherit" /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Create / Edit Workflow Dialog
// ─────────────────────────────────────────────────────────────────────────────

function WorkflowFormDialog({ open, onClose, onSaved, workflowId = null }) {
  const isEdit = Boolean(workflowId);

  const { data: editData, loading: loadingEdit } = useGetRequest(
    isEdit ? endpoints.storeInventory.approval_workflow_by_id(workflowId) : null
  );

  const [moduleType, setModuleType] = useState(null);
  const [menu, setMenu] = useState(null);
  const [isActive, setIsActive] = useState(true);
  const [levels, setLevels] = useState([emptyLevel(1, 0)]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [prefilled, setPrefilled] = useState(false);

  const { data: formOptionsData } = useGetRequest(
    endpoints.storeInventory.approval_workflow_form_options
  );
  const moduleTypes = formOptionsData?.module_types ?? [];
  const menus = moduleType ? (formOptionsData?.menus?.[moduleType.id] ?? []) : [];

  const { data: usersData } = useGetRequest(endpoints.storeInventory.workflow_users);
  const allUsers = usersData ?? [];

  // ── prefill on edit ────────────────────────────────────────────────────────
  useEffect(() => {
    if (isEdit && editData?.id && !prefilled) {
      setModuleType({ id: editData.module_type_name, name: editData.module_type_name });
      setMenu({ id: editData.menu_name, name: editData.menu_name });
      setIsActive(editData.is_active);
      setLevels(
        (editData.levels ?? []).map((lv) => ({
          level_number: lv.level_number,
          from_amount: lv.from_amount ?? '',
          to_amount: lv.to_amount ?? '',
          minimum_approval_required: lv.minimum_approval_required ?? 1,
          level_maintain_require: lv.level_maintain_require ?? 'yes',
          users: (lv.level_users ?? [])
            .slice()
            .sort((a, b) => a.approval_order - b.approval_order)
            .map((lu) => ({ user_id: lu.user, approval_order: lu.approval_order })),
        }))
      );
      setPrefilled(true);
    }
  }, [editData, isEdit, prefilled]);

  // ── level helpers ────────────────────────────────────────────────────────
  // Derive from_amount for level at index idx given the preceding level
  const derivedFrom = (prevLevel) =>
    prevLevel?.to_amount !== '' && prevLevel?.to_amount != null
      ? (Number(prevLevel.to_amount) + 0.00001).toFixed(5)
      : '';

  const addLevel = () =>
    setLevels((prev) => [...prev, emptyLevel(prev.length + 1, derivedFrom(prev[prev.length - 1]))]);

  const removeLevel = (i) =>
    setLevels((prev) => {
      const filtered = prev.filter((_, idx) => idx !== i);
      // Recalculate level_number and from_amount for every level after removal
      return filtered.map((l, idx) => ({
        ...l,
        level_number: idx + 1,
        from_amount: idx === 0 ? 0 : derivedFrom(filtered[idx - 1]),
      }));
    });

  const updateLevel = (i, field, value) =>
    setLevels((prev) => {
      const next = prev.map((l, idx) => (idx === i ? { ...l, [field]: value } : l));
      // When to_amount of level i changes, cascade-update from_amount of level i+1
      if (field === 'to_amount' && i + 1 < next.length) {
        const newFrom = value !== '' && value != null ? (Number(value) + 0.00001).toFixed(5) : '';
        next[i + 1] = { ...next[i + 1], from_amount: newFrom };
      }
      return next;
    });

  const clearFieldError = (path) =>
    setFieldErrors((prev) => {
      if (!prev[path]) {
        return prev;
      }

      const next = { ...prev };
      delete next[path];
      return next;
    });

  const getFieldError = (path) => fieldErrors[path] || '';

  const addUserToLevel = (levelIdx) =>
    setLevels((prev) =>
      prev.map((l, idx) =>
        idx !== levelIdx
          ? l
          : { ...l, users: [...l.users, { user_id: null, approval_order: l.users.length + 1 }] }
      )
    );

  const removeUserFromLevel = (levelIdx, userIdx) =>
    setLevels((prev) =>
      prev.map((l, idx) =>
        idx !== levelIdx ? l : { ...l, users: l.users.filter((_, ui) => ui !== userIdx) }
      )
    );

  const updateUserInLevel = (levelIdx, userIdx, field, value) =>
    setLevels((prev) =>
      prev.map((l, idx) =>
        idx !== levelIdx
          ? l
          : { ...l, users: l.users.map((u, ui) => (ui !== userIdx ? u : { ...u, [field]: value })) }
      )
    );

  const getErrorMessage = (error) => {
    const detail = error?.response?.data;

    if (!detail) return error?.message || 'Unable to save approval workflow.';

    if (typeof detail === 'string') return detail;
    if (typeof detail?.detail === 'string') return detail.detail;
    if (Array.isArray(detail)) return detail.filter(Boolean).join(' ');

    const messages = Object.entries(detail).flatMap(([field, value]) => {
      if (Array.isArray(value)) {
        return value.map((item) => `${field}: ${item}`);
      }
      if (typeof value === 'string') {
        return `${field}: ${value}`;
      }
      return [];
    });

    return messages[0] || 'Unable to save approval workflow.';
  };

  // ── save ───────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setFormError('');
    const nextFieldErrors = {};

    if (!menu) {
      nextFieldErrors.menu = 'Please select a menu.';
      setFieldErrors(nextFieldErrors);
      return;
    }

    levels.forEach((lv, levelIdx) => {
      if (lv.users.length === 0) {
        nextFieldErrors[`levels.${levelIdx}.users`] =
          `Level ${lv.level_number}: at least one approver is required.`;
      }

      if (
        lv.to_amount !== '' &&
        lv.to_amount != null &&
        Number(lv.to_amount) <= Number(lv.from_amount)
      ) {
        nextFieldErrors[`levels.${levelIdx}.to_amount`] =
          `Level ${lv.level_number}: To Amount must be greater than From Amount.`;
      }

      if ((lv.minimum_approval_required || 1) > lv.users.length) {
        nextFieldErrors[`levels.${levelIdx}.minimum_approval_required`] =
          `Level ${lv.level_number}: minimum approvals required cannot exceed total assigned users.`;
      }

      const userCounts = new Map();
      const orderCounts = new Map();

      lv.users.forEach((userEntry, userIdx) => {
        if (!userEntry.user_id) {
          nextFieldErrors[`levels.${levelIdx}.users.${userIdx}.user_id`] =
            `Level ${lv.level_number}: approver is required.`;
        } else {
          userCounts.set(userEntry.user_id, (userCounts.get(userEntry.user_id) || 0) + 1);
        }

        if (!userEntry.approval_order || Number(userEntry.approval_order) < 1) {
          nextFieldErrors[`levels.${levelIdx}.users.${userIdx}.approval_order`] =
            `Level ${lv.level_number}: approval order must be at least 1.`;
        } else {
          orderCounts.set(
            userEntry.approval_order,
            (orderCounts.get(userEntry.approval_order) || 0) + 1
          );
        }
      });

      lv.users.forEach((userEntry, userIdx) => {
        if (userEntry.user_id && userCounts.get(userEntry.user_id) > 1) {
          nextFieldErrors[`levels.${levelIdx}.users.${userIdx}.user_id`] =
            `Level ${lv.level_number}: the same user cannot appear twice in one level.`;
        }

        if (userEntry.approval_order && orderCounts.get(userEntry.approval_order) > 1) {
          nextFieldErrors[`levels.${levelIdx}.users.${userIdx}.approval_order`] =
            `Level ${lv.level_number}: duplicate approval order numbers are not allowed.`;
        }
      });
    });

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    setFieldErrors({});

    setSaving(true);
    try {
      const payload = {
        module_type_name: moduleType.id,
        menu_name: menu.id,
        is_active: isActive,
        levels: levels.map((l) => ({
          level_number: l.level_number,
          from_amount: l.from_amount || 0,
          to_amount: l.to_amount || null,
          minimum_approval_required: l.minimum_approval_required || 1,
          level_maintain_require: l.level_maintain_require,
          users: l.users.map((u) => ({ user_id: u.user_id, approval_order: u.approval_order })),
        })),
      };
      if (isEdit) {
        await axiosInstance.put(
          endpoints.storeInventory.approval_workflow_by_id(workflowId),
          payload
        );
      } else {
        await axiosInstance.post(endpoints.storeInventory.approval_workflows, payload);
      }
      onSaved();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{isEdit ? 'Edit Approval Workflow' : 'Add Approval Workflow'}</DialogTitle>
      <DialogContent dividers>
        {formError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {formError}
          </Alert>
        )}
        {isEdit && loadingEdit && <CircularProgress size={22} sx={{ mb: 2 }} />}

        <Stack spacing={2}>
          {/* Module / Menu */}
          <Stack direction="row" spacing={2}>
            <Autocomplete
              options={moduleTypes}
              getOptionLabel={(o) => o?.name ?? ''}
              isOptionEqualToValue={(option, value) => option?.id === value?.id}
              value={moduleType}
              onChange={(_, v) => {
                if (!isEdit) {
                  setModuleType(v);
                  setMenu(null);
                }
              }}
              disabled={isEdit}
              renderInput={(params) => <TextField {...params} label="Module Type *" size="small" />}
              sx={{ flex: 1 }}
            />
            <Autocomplete
              options={isEdit ? (menu ? [menu] : []) : menus}
              getOptionLabel={(o) => o?.name ?? ''}
              isOptionEqualToValue={(option, value) => option?.id === value?.id}
              value={menu}
              onChange={(_, v) => {
                clearFieldError('menu');
                if (!isEdit) setMenu(v);
              }}
              disabled={isEdit || !moduleType}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Menu / Module *"
                  size="small"
                  error={Boolean(getFieldError('menu'))}
                  helperText={getFieldError('menu')}
                />
              )}
              sx={{ flex: 1 }}
            />
          </Stack>

          <FormControlLabel
            control={<Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />}
            label="Active"
          />

          <Divider />
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle2">Approval Levels</Typography>
            <Tooltip
              title={
                !levels[levels.length - 1]?.to_amount
                  ? 'Set a "To Amount" on the last level before adding another'
                  : ''
              }
            >
              <span>
                <Button
                  size="small"
                  startIcon={<AddCircleOutlineIcon />}
                  onClick={addLevel}
                  disabled={!levels[levels.length - 1]?.to_amount}
                >
                  Add Level
                </Button>
              </span>
            </Tooltip>
          </Stack>

          {levels.map((lv, i) => (
            <Paper key={i} variant="outlined" sx={{ p: 2 }}>
              {/* Level header */}
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                <Typography variant="body2" fontWeight={700}>
                  Level {lv.level_number}
                </Typography>
                {levels.length > 1 && (
                  <IconButton size="small" color="error" onClick={() => removeLevel(i)}>
                    <RemoveCircleOutlineIcon fontSize="small" />
                  </IconButton>
                )}
              </Stack>

              {/* Amount range + Min approval */}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2}>
                <TextField
                  label="From Amount"
                  type="number"
                  size="small"
                  value={lv.from_amount}
                  inputProps={{ step: '0.00001' }}
                  InputProps={{ readOnly: true }}
                  sx={{ flex: 1, '& .MuiInputBase-root': { bgcolor: 'action.hover' } }}
                />
                <TextField
                  label="To Amount (blank = unlimited)"
                  type="number"
                  size="small"
                  value={lv.to_amount}
                  inputProps={{ step: '0.00001' }}
                  onChange={(e) => {
                    clearFieldError(`levels.${i}.to_amount`);
                    updateLevel(i, 'to_amount', e.target.value);
                  }}
                  error={Boolean(getFieldError(`levels.${i}.to_amount`))}
                  helperText={getFieldError(`levels.${i}.to_amount`) || 'Leave blank for unlimited'}
                  sx={{ flex: 1 }}
                />
                <Stack spacing={1} sx={{ width: 210 }}>
                  <TextField
                    label="Min Approvals Required *"
                    type="number"
                    size="small"
                    value={lv.minimum_approval_required}
                    onChange={(e) => {
                      clearFieldError(`levels.${i}.minimum_approval_required`);
                      updateLevel(
                        i,
                        'minimum_approval_required',
                        Math.max(1, parseInt(e.target.value, 10) || 1)
                      );
                    }}
                    inputProps={{ min: 1, max: lv.users.length || undefined }}
                    error={Boolean(getFieldError(`levels.${i}.minimum_approval_required`))}
                    helperText={
                      getFieldError(`levels.${i}.minimum_approval_required`) ||
                      `${lv.users.length} user(s) assigned`
                    }
                  />
                  <TextField
                    select
                    label="Level Maintain Require *"
                    size="small"
                    value={lv.level_maintain_require}
                    onChange={(e) => updateLevel(i, 'level_maintain_require', e.target.value)}
                  >
                    <MenuItem value="yes">Yes</MenuItem>
                    <MenuItem value="no">No</MenuItem>
                  </TextField>
                </Stack>
              </Stack>

              {/* Approver rows */}
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mb: 0.5, display: 'block' }}
              >
                Approver Users
              </Typography>
              {getFieldError(`levels.${i}.users`) && (
                <Typography variant="caption" color="error" sx={{ mb: 1, display: 'block' }}>
                  {getFieldError(`levels.${i}.users`)}
                </Typography>
              )}

              {lv.users.map((userEntry, ui) => (
                <Stack key={ui} direction="row" spacing={1} alignItems="center" mb={1}>
                  <Autocomplete
                    options={allUsers}
                    getOptionLabel={(u) => u?.username || u?.email || ''}
                    isOptionEqualToValue={(o, v) => o?.id === v?.id}
                    value={allUsers.find((u) => u.id === userEntry.user_id) ?? null}
                    onChange={(_, v) => {
                      clearFieldError(`levels.${i}.users.${ui}.user_id`);
                      clearFieldError(`levels.${i}.users`);
                      updateUserInLevel(i, ui, 'user_id', v?.id ?? null);
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={`Approver ${ui + 1} *`}
                        size="small"
                        error={Boolean(getFieldError(`levels.${i}.users.${ui}.user_id`))}
                        helperText={getFieldError(`levels.${i}.users.${ui}.user_id`)}
                      />
                    )}
                    sx={{ flex: 1 }}
                    filterSelectedOptions
                  />
                  <TextField
                    label="Order"
                    type="number"
                    size="small"
                    value={userEntry.approval_order}
                    onChange={(e) => {
                      clearFieldError(`levels.${i}.users.${ui}.approval_order`);
                      updateUserInLevel(i, ui, 'approval_order', parseInt(e.target.value, 10) || 1);
                    }}
                    inputProps={{ min: 1 }}
                    error={Boolean(getFieldError(`levels.${i}.users.${ui}.approval_order`))}
                    helperText={getFieldError(`levels.${i}.users.${ui}.approval_order`)}
                    sx={{ width: 90 }}
                  />
                  <IconButton size="small" color="error" onClick={() => removeUserFromLevel(i, ui)}>
                    <RemoveCircleOutlineIcon fontSize="small" />
                  </IconButton>
                </Stack>
              ))}

              <Button
                size="small"
                startIcon={<AddCircleOutlineIcon />}
                onClick={() => addUserToLevel(i)}
              >
                Add Approver
              </Button>
            </Paper>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? <CircularProgress size={18} /> : isEdit ? 'Update' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Workflow Detail Dialog (read-only)
// ─────────────────────────────────────────────────────────────────────────────

function WorkflowDetailDialog({ row, onClose }) {
  const { data, isLoading } = useGetRequest(
    endpoints.storeInventory.approval_workflow_by_id(row.id)
  );
  const workflow = data ?? null;

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Workflow Detail — {row.menu_name}</DialogTitle>
      <DialogContent dividers>
        {isLoading && <CircularProgress size={24} />}
        {workflow && (
          <Stack spacing={2}>
            <Stack direction="row" spacing={4}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Module Type
                </Typography>
                <Typography variant="body2">{workflow.module_type_name}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Menu
                </Typography>
                <Typography variant="body2">{workflow.menu_name}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Status
                </Typography>
                <Box>{statusChip(workflow.is_active)}</Box>
              </Box>
            </Stack>
            <Divider />
            {(workflow.levels ?? []).map((lv) => (
              <Paper key={lv.id} variant="outlined" sx={{ p: 1.5 }}>
                <Stack direction="row" spacing={2} alignItems="center" mb={1} flexWrap="wrap">
                  <Typography variant="body2" fontWeight={600}>
                    Level {lv.level_number}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {lv.from_amount} &rarr; {lv.to_amount ?? '∞'}
                  </Typography>
                  <Chip
                    label={`Min ${lv.minimum_approval_required} approval${lv.minimum_approval_required !== 1 ? 's' : ''}`}
                    size="small"
                    color="info"
                    variant="outlined"
                  />
                  <Chip
                    label={`Level maintain: ${lv.level_maintain_require === 'yes' ? 'Yes' : 'No'}`}
                    size="small"
                    color="default"
                    variant="outlined"
                  />
                </Stack>
                <Stack direction="row" flexWrap="wrap" gap={1}>
                  {(lv.level_users ?? [])
                    .slice()
                    .sort((a, b) => a.approval_order - b.approval_order)
                    .map((lu) => (
                      <Chip
                        key={lu.id}
                        label={`${lu.approval_order}. ${lu.user_detail?.username || lu.user_detail?.email || `User ${lu.user}`}`}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export function ApprovalWorkflowMain() {
  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Typography variant="h5" mb={3} fontWeight={700}>
        Approval Workflow Management
      </Typography>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <WorkflowTab />
      </Paper>
    </Box>
  );
}
