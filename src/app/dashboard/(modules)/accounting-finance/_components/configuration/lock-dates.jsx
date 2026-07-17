'use client';

import Link from 'next/link';
import { toast } from 'sonner';
import { useState } from 'react';

import LockIcon from '@mui/icons-material/Lock'; // Hard locks      — red
import ShieldIcon from '@mui/icons-material/Shield'; // Policy coverage — blue
import LockClockIcon from '@mui/icons-material/LockClock'; // Lock records    — primary
import {
  Box,
  Card,
  Grid,
  Chip,
  Alert,
  Stack,
  Button,
  Avatar,
  Dialog,
  Divider,
  Tooltip,
  MenuItem,
  TextField,
  Typography,
  CardContent,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';

import { useLockDatesApi } from './use-lock-dates-api';
import { PolicyConfigToolbar } from './policy-config-toolbar';

const BASE_PATH = '/dashboard/accounting-finance/configuration/lock-dates';

function LockDates() {
  const api = useLockDatesApi();
  const emptyForm = {
    name: '',
    description: '',
    type: 'soft',
    lock_date: '2026-03-31',
    scope: 'Accounting period',
    applies_to: 'All accountants',
  };
  const [open, setOpen] = useState(false);
  const [editingLockId, setEditingLockId] = useState(null);
  const [selectedLockId, setSelectedLockId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const selectedLock =
    api.lockDates.find((item) => String(item.id) === String(selectedLockId)) ||
    api.lockDates[0] ||
    null;

  const openCreateDialog = () => {
    setEditingLockId(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEditDialog = (lockDate) => {
    setEditingLockId(lockDate.id);
    setForm({
      name: lockDate.name,
      description: lockDate.description,
      type: lockDate.type,
      lock_date: lockDate.lock_date,
      scope: lockDate.scopeLabel || lockDate.scope,
      applies_to: lockDate.applies_to,
    });
    setOpen(true);
  };

  const saveLock = async () => {
    if (!form.name.trim() || !form.lock_date) {
      toast.error('Name and lock date are required');
      return;
    }
    try {
      if (editingLockId) {
        await api.actions.updateLockDate({ id: editingLockId, ...form });
        toast.success('Lock date updated');
      } else {
        await api.actions.addLockDate(form);
        toast.success('Lock date added');
      }
    } catch {
      toast.error('Failed to save lock date');
    }

    setOpen(false);
    setEditingLockId(null);
    setForm(emptyForm);
  };

  const printContent = (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <thead>
        <tr style={{ background: '#f5f5f5' }}>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>Name</th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>Type</th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Lock Date
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>Scope</th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Applies To
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Enforcement
          </th>
        </tr>
      </thead>
      <tbody>
        {api.lockDates.map((ld) => (
          <tr key={ld.id}>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{ld.name}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{ld.type}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{ld.lock_date}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{ld.scopeLabel}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{ld.applies_to}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{ld.enforcementLevel}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <Box sx={{ p: 3 }}>
      <PolicyConfigToolbar printTitle="Lock Dates" printContent={printContent} />

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Lock Dates
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Role-aware period close controls with soft, tax, and hard lock governance.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:add-circle-bold" />}
          onClick={openCreateDialog}
        >
          New Lock Date
        </Button>
      </Stack>

      <Stack spacing={1.25} sx={{ mb: 3 }}>
        {api.alerts.map((alert) => (
          <Alert key={alert.id} severity={alert.severity} sx={{ borderRadius: 2 }}>
            <Typography variant="subtitle2" fontWeight={700}>
              {alert.title}
            </Typography>
            {alert.description}
          </Alert>
        ))}
      </Stack>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Lock records
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mt: 1,
                }}
              >
                <Typography variant="h5" fontWeight={800}>
                  {api.overview.lockDateCount}
                </Typography>
                <LockClockIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Hard locks
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mt: 1,
                }}
              >
                <Typography variant="h5" fontWeight={800}>
                  {api.overview.hardLocks}
                </Typography>
                <LockIcon sx={{ fontSize: 40, color: 'error.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Policy coverage
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mt: 1,
                }}
              >
                <Typography variant="h5" fontWeight={800}>
                  {api.overview.policyCoverage}
                </Typography>
                <ShieldIcon sx={{ fontSize: 40, color: 'info.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {api.lockDates.map((ld) => (
          <Grid key={ld.id} size={{ xs: 12, md: 6 }}>
            <Card
              sx={{
                borderRadius: 3,
                cursor: 'pointer',
                border:
                  String(ld.id) === String(selectedLock?.id)
                    ? '1px solid rgba(37, 99, 235, 0.28)'
                    : '1px solid transparent',
                boxShadow:
                  String(ld.id) === String(selectedLock?.id)
                    ? '0 0 0 1px rgba(37, 99, 235, 0.08)'
                    : undefined,
              }}
              onClick={() => setSelectedLockId(ld.id)}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: ld.type === 'hard' ? '#ef444420' : '#f59e0b20',
                      color: ld.type === 'hard' ? '#ef4444' : '#f59e0b',
                      width: 48,
                      height: 48,
                    }}
                  >
                    <Iconify
                      icon={ld.type === 'hard' ? 'solar:lock-bold' : 'solar:lock-unlocked-bold'}
                      width={24}
                    />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight={700}>
                      {ld.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {ld.description}
                    </Typography>
                  </Box>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
                  <Chip
                    label={ld.enforcementLevel}
                    size="small"
                    color={ld.type === 'hard' ? 'error' : ld.type === 'tax' ? 'warning' : 'info'}
                  />
                  <Chip label={ld.scopeLabel} size="small" variant="outlined" />
                </Stack>
                <Stack spacing={1.1}>
                  <Typography variant="body2">
                    Date: <strong>{ld.lock_date}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Level: <strong>{ld.enforcementLevel}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Scope: <strong>{ld.scopeLabel}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Applies To: <strong>{ld.applies_to}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Audit Owner: <strong>{ld.auditOwner}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Escalation: <strong>{ld.escalationRule}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Impact: <strong>{ld.impactSummary}</strong>
                  </Typography>
                </Stack>
                <Divider sx={{ my: 2 }} />
                <Stack spacing={1}>
                  {ld.history.map((item) => (
                    <Typography key={item.id} variant="caption" color="text.secondary">
                      {item.date} • {item.action} • {item.actor}
                    </Typography>
                  ))}
                </Stack>
                <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ mt: 2 }}>
                  <Tooltip title="View details">
                    <Button
                      component={Link}
                      href={`${BASE_PATH}/${ld.id}`}
                      size="small"
                      variant="text"
                    >
                      View Details
                    </Button>
                  </Tooltip>
                  <Button
                    size="small"
                    variant="outlined"
                    color="inherit"
                    onClick={(event) => {
                      event.stopPropagation();
                      openEditDialog(ld);
                    }}
                  >
                    Edit Lock
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/*
        Enforcement detail section temporarily commented out.
      {selectedLock ? (
        <Card sx={{ borderRadius: 3, mt: 3 }}>
          <CardContent>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              justifyContent="space-between"
              spacing={2}
              sx={{ mb: 2 }}
            >
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  Enforcement Detail
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedLock.name} governs {selectedLock.scopeLabel.toLowerCase()} transactions
                  for {(selectedLock?.applies_to || '').toLowerCase()}.
                </Typography>
              </Box>
              <Button
                variant="outlined"
                color="inherit"
                onClick={() => openEditDialog(selectedLock)}
              >
                Update Policy
              </Button>
            </Stack>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Stack spacing={1.1}>
                  <Typography variant="body2">
                    Close level: <strong>{selectedLock.enforcementLevel}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Lock date: <strong>{selectedLock.lock_date}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Audit owner: <strong>{selectedLock.auditOwner}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Escalation path: <strong>{selectedLock.escalationRule}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Impact summary: <strong>{selectedLock.impactSummary}</strong>
                  </Typography>
                </Stack>
                <Alert
                  severity={
                    selectedLock.type === 'hard'
                      ? 'error'
                      : selectedLock.type === 'tax'
                        ? 'warning'
                        : 'info'
                  }
                  sx={{ mt: 2, borderRadius: 2 }}
                >
                  {selectedLock.type === 'hard'
                    ? 'Hard lock should block posting and require controller exception handling.'
                    : selectedLock.type === 'tax'
                      ? 'Tax lock should allow narrow exception routing with explicit approval.'
                      : 'Soft lock should warn and route approvals before late posting is allowed.'}
                </Alert>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Audit History
                </Typography>
                <Stack spacing={1}>
                  {selectedLock.history.map((item) => (
                    <Box
                      key={item.id}
                      sx={{ p: 1.25, borderRadius: 2, bgcolor: 'background.neutral' }}
                    >
                      <Typography variant="body2" fontWeight={700}>
                        {item.action}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.date} • {item.actor}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                  Protected Workflow Handoff
                </Typography>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1.25}
                  flexWrap="wrap"
                  useFlexGap
                >
                  <Button
                    component={RouterLink}
                    href={paths.dashboard.accountingFinance.transactions.journalEntries}
                    variant="outlined"
                    color="inherit"
                  >
                    Journal Entries
                  </Button>
                  <Button
                    component={RouterLink}
                    href={paths.dashboard.accountingFinance.transactions.customerReceipts}
                    variant="outlined"
                    color="inherit"
                  >
                    Customer Receipts
                  </Button>
                  <Button
                    component={RouterLink}
                    href={paths.dashboard.accountingFinance.transactions.supplierPayments}
                    variant="outlined"
                    color="inherit"
                  >
                    Supplier Payments
                  </Button>
                  <Button
                    component={RouterLink}
                    href={paths.dashboard.accountingFinance.settings.approvalWorkflow}
                    variant="contained"
                  >
                    Approval Routing
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      ) : null}
      */}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingLockId ? 'Edit Lock Date' : 'New Lock Date'}</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Name"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Description"
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                label="Type"
                value={form.type}
                onChange={(event) =>
                  setForm((current) => ({ ...current, type: event.target.value }))
                }
              >
                <MenuItem value="soft">Soft</MenuItem>
                <MenuItem value="tax">Tax</MenuItem>
                <MenuItem value="hard">Hard</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="date"
                label="Lock Date"
                value={form.lock_date}
                onChange={(event) =>
                  setForm((current) => ({ ...current, lock_date: event.target.value }))
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Scope"
                value={form.scope}
                onChange={(event) =>
                  setForm((current) => ({ ...current, scope: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Applies To"
                value={form.applies_to}
                onChange={(event) =>
                  setForm((current) => ({ ...current, applies_to: event.target.value }))
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpen(false);
              setEditingLockId(null);
            }}
          >
            Cancel
          </Button>
          <Button variant="contained" onClick={saveLock}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default LockDates;
