'use client';

import Link from 'next/link';
import { toast } from 'sonner';
import { useState } from 'react';

import MapIcon from '@mui/icons-material/Map';
import ShieldIcon from '@mui/icons-material/Shield';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import {
  Box,
  Card,
  Chip,
  Grid,
  Table,
  Button,
  Dialog,
  Tooltip,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  Typography,
  IconButton,
  CardContent,
  DialogTitle,
  Autocomplete,
  DialogContent,
  DialogActions,
  TableContainer,
} from '@mui/material';

import { Iconify } from 'src/components/iconify';

import { useTaxesApi } from './use-taxes-api';
import { PolicyConfigToolbar } from './policy-config-toolbar';
import { useFiscalPositionsApi } from './use-fiscal-positions-api';
import { useChartOfAccountsApi } from './use-chart-of-accounts-api';

const BASE_PATH = '/dashboard/accounting-finance/configuration/fiscal-positions';

function FiscalPositions() {
  const api = useFiscalPositionsApi();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    code: '',
    country: '',
    auto_apply: true,
    previewScenario: '',
    tax_mappings: [{ source_tax: null, destination_tax: null }],
    account_mappings: [{ source_account: null, destination_account: null }],
  });
  const taxesApi = useTaxesApi();
  const accountsApi = useChartOfAccountsApi();
  const [selectedPositionId, setSelectedPositionId] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const EMPTY_FP_FORM = {
    name: '',
    code: '',
    country: '',
    auto_apply: true,
    previewScenario: '',
    tax_mappings: [{ source_tax: null, destination_tax: null }],
    account_mappings: [{ source_account: null, destination_account: null }],
  };

  const selectedPosition =
    api.fiscalPositions.find((item) => String(item.id) === String(selectedPositionId)) ||
    api.fiscalPositions[0] ||
    null;

  const handleCreate = async () => {
    if (!form.name.trim() || !form.country.trim()) {
      toast.error('Name and country are required');
      return;
    }
    try {
      if (editTarget) {
        await api.actions.updateFiscalPosition(editTarget.id, form);
        toast.success('Fiscal position updated');
      } else {
        await api.actions.createFiscalPosition(form);
        toast.success('Fiscal position created');
      }
      setOpen(false);
      setEditTarget(null);
      setForm(EMPTY_FP_FORM);
    } catch {
      toast.error('Failed to save fiscal position');
    }
  };

  const handleOpenEditDialog = (fp) => {
    setEditTarget(fp);
    setForm({
      name: fp.name || '',
      code: fp.code || '',
      country: fp.country || '',
      auto_apply: fp.auto_apply ?? true,
      previewScenario: fp.previewScenario || '',
      tax_mappings: fp.tax_mappings?.length
        ? fp.tax_mappings.map((tm) => ({
            source_tax: tm.source_tax ?? tm.from ?? null,
            destination_tax: tm.destination_tax ?? tm.to ?? null,
          }))
        : [{ source_tax: null, destination_tax: null }],
      account_mappings: fp.account_mappings?.length
        ? fp.account_mappings.map((am) => ({
            source_account: am.source_account ?? am.from ?? null,
            destination_account: am.destination_account ?? am.to ?? null,
          }))
        : [{ source_account: null, destination_account: null }],
    });
    setOpen(true);
  };

  const handleDelete = async () => {
    try {
      await api.actions.deleteFiscalPosition(deleteTarget.id);
      toast.success('Fiscal position deleted');
      setDeleteTarget(null);
    } catch {
      toast.error('Failed to delete fiscal position');
    }
  };

  const printContent = (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <thead>
        <tr style={{ background: '#f5f5f5' }}>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>Name</th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Country
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Auto Apply
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Document Scope
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Status
          </th>
        </tr>
      </thead>
      <tbody>
        {api.fiscalPositions.map((fp) => (
          <tr key={fp.id}>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{fp.name}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{fp.country}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
              {fp.auto_apply ? 'Yes' : 'No'}
            </td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{fp.documentScope}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
              {fp.active ? 'Active' : 'Inactive'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <Box sx={{ p: 3 }}>
      <PolicyConfigToolbar printTitle="Fiscal Positions" printContent={printContent} />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Fiscal Positions
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Map taxes and accounts for different fiscal jurisdictions with automatic application
            rules.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:add-circle-bold" />}
          onClick={() => setOpen(true)}
        >
          New Fiscal Position
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Active fiscal positions
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
                  {api.overview.activeFiscalPositions}
                </Typography>
                <AccountBalanceIcon sx={{ fontSize: 40, color: 'success.main' }} />
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
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Mapping templates
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
                  {api.fiscalPositions.reduce((sum, item) => sum + item.mappingCoverage, 0)}
                </Typography>
                <MapIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ borderRadius: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Country</TableCell>
                <TableCell>Tax Mappings</TableCell>
                <TableCell>Account Mappings</TableCell>
                <TableCell>Auto Apply</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Document Scope</TableCell>
                <TableCell>Preview</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {api.fiscalPositions.map((fp) => (
                <TableRow
                  key={fp.id}
                  hover
                  selected={String(fp.id) === String(selectedPosition?.id)}
                  onClick={() => setSelectedPositionId(fp.id)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {fp.name}
                    </Typography>
                  </TableCell>
                  <TableCell>{fp.country}</TableCell>
                  <TableCell>
                    {fp.tax_mappings?.map((tm, idx) => (
                      <Chip
                        key={idx}
                        label={`${tm.from} → ${tm.to}`}
                        size="small"
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                  </TableCell>
                  <TableCell>
                    {fp.account_mappings?.map((am, idx) => (
                      <Chip
                        key={idx}
                        label={`${am.from} → ${am.to}`}
                        size="small"
                        variant="outlined"
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={fp.auto_apply ? 'Yes' : 'No'}
                      size="small"
                      color={fp.auto_apply ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={fp.active ? 'Active' : 'Inactive'}
                      size="small"
                      color={fp.active ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell>{fp.documentScope}</TableCell>
                  <TableCell>
                    <Typography variant="body2">{fp.previewScenario}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {fp.autoApplyReason}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="View details">
                      <Button
                        component={Link}
                        href={`${BASE_PATH}/${fp.id}`}
                        size="small"
                        variant="text"
                      >
                        View Details
                      </Button>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleOpenEditDialog(fp);
                        }}
                      >
                        <Iconify icon="solar:pen-bold" width={16} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(event) => {
                          event.stopPropagation();
                          setDeleteTarget(fp);
                        }}
                      >
                        <Iconify icon="solar:trash-bin-trash-bold" width={16} />
                      </IconButton>
                    </Tooltip>
                    <Button
                      size="small"
                      variant="outlined"
                      color="inherit"
                      onClick={() => api.actions.toggleFiscalPositionStatus(fp.id)}
                    >
                      {fp.active ? 'Disable' : 'Enable'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {selectedPosition ? (
        <Card sx={{ borderRadius: 3, mt: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Mapping Preview
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="body2">
                  Scenario: {selectedPosition.previewScenario}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Cluster: {selectedPosition.jurisdictionCluster}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Application: {selectedPosition.autoApplyReason}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="body2" fontWeight={700}>
                  Tax mappings
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {selectedPosition.tax_mappings
                    ?.map((item) => `${item.from} -> ${item.to}`)
                    .join(' | ') || 'No tax mappings'}
                </Typography>
                <Typography variant="body2" fontWeight={700} sx={{ mt: 2 }}>
                  Account mappings
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {selectedPosition.account_mappings
                    ?.map((item) => `${item.from} -> ${item.to}`)
                    .join(' | ') || 'No account mappings'}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      ) : null}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editTarget ? 'Edit Fiscal Position' : 'New Fiscal Position'}</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Code"
                value={form.code}
                onChange={(event) =>
                  setForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Name"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Country"
                value={form.country}
                onChange={(event) =>
                  setForm((current) => ({ ...current, country: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Preview Scenario"
                value={form.previewScenario}
                onChange={(event) =>
                  setForm((current) => ({ ...current, previewScenario: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle2" sx={{ mt: 1, mb: 1 }}>
                Tax Mappings
              </Typography>
              {(form.tax_mappings || []).map((row, idx) => (
                <Box key={idx} sx={{ display: 'flex', gap: 2, mb: 1, alignItems: 'center' }}>
                  <Autocomplete
                    sx={{ flex: 1 }}
                    options={taxesApi.taxes || []}
                    getOptionKey={(opt) => opt.id}
                    getOptionLabel={(opt) => opt.name || String(opt.id || '')}
                    value={
                      taxesApi.taxes?.find((t) => String(t.id) === String(row.source_tax)) || null
                    }
                    onChange={(_, val) =>
                      setForm((current) => ({
                        ...current,
                        tax_mappings: current.tax_mappings.map((r, i) =>
                          i === idx ? { ...r, source_tax: val ? val.id : null } : r
                        ),
                      }))
                    }
                    renderInput={(params) => (
                      <TextField {...params} size="small" label="Tax on Product (From)" />
                    )}
                  />
                  <Iconify icon="solar:arrow-right-bold" width={24} />
                  <Autocomplete
                    sx={{ flex: 1 }}
                    options={taxesApi.taxes || []}
                    getOptionKey={(opt) => opt.id}
                    getOptionLabel={(opt) => opt.name || String(opt.id || '')}
                    value={
                      taxesApi.taxes?.find((t) => String(t.id) === String(row.destination_tax)) ||
                      null
                    }
                    onChange={(_, val) =>
                      setForm((current) => ({
                        ...current,
                        tax_mappings: current.tax_mappings.map((r, i) =>
                          i === idx ? { ...r, destination_tax: val ? val.id : null } : r
                        ),
                      }))
                    }
                    renderInput={(params) => (
                      <TextField {...params} size="small" label="Tax to Apply (To)" />
                    )}
                  />
                  <IconButton
                    size="small"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        tax_mappings: current.tax_mappings.filter((_, i) => i !== idx),
                      }))
                    }
                  >
                    <Iconify icon="solar:trash-bin-bold" />
                  </IconButton>
                  {idx === form.tax_mappings.length - 1 && (
                    <IconButton
                      size="small"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          tax_mappings: [
                            ...current.tax_mappings,
                            { source_tax: null, destination_tax: null },
                          ],
                        }))
                      }
                    >
                      <Iconify icon="solar:add-circle-bold" />
                    </IconButton>
                  )}
                </Box>
              ))}
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle2" sx={{ mt: 1, mb: 1 }}>
                Account Mappings
              </Typography>
              {(form.account_mappings || []).map((row, idx) => (
                <Box key={idx} sx={{ display: 'flex', gap: 2, mb: 1, alignItems: 'center' }}>
                  <Autocomplete
                    sx={{ flex: 1 }}
                    options={accountsApi.accounts || []}
                    getOptionKey={(opt) => opt.id}
                    getOptionLabel={(opt) => opt.name || String(opt.id || '')}
                    value={
                      accountsApi.accounts?.find(
                        (a) => String(a.id) === String(row.source_account)
                      ) || null
                    }
                    onChange={(_, val) =>
                      setForm((current) => ({
                        ...current,
                        account_mappings: current.account_mappings.map((r, i) =>
                          i === idx ? { ...r, source_account: val ? val.id : null } : r
                        ),
                      }))
                    }
                    renderInput={(params) => (
                      <TextField {...params} size="small" label="Account on Product (From)" />
                    )}
                  />
                  <Iconify icon="solar:arrow-right-bold" width={24} />
                  <Autocomplete
                    sx={{ flex: 1 }}
                    options={accountsApi.accounts || []}
                    getOptionKey={(opt) => opt.id}
                    getOptionLabel={(opt) => opt.name || String(opt.id || '')}
                    value={
                      accountsApi.accounts?.find(
                        (a) => String(a.id) === String(row.destination_account)
                      ) || null
                    }
                    onChange={(_, val) =>
                      setForm((current) => ({
                        ...current,
                        account_mappings: current.account_mappings.map((r, i) =>
                          i === idx ? { ...r, destination_account: val ? val.id : null } : r
                        ),
                      }))
                    }
                    renderInput={(params) => (
                      <TextField {...params} size="small" label="Account to Use (To)" />
                    )}
                  />
                  <IconButton
                    size="small"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        account_mappings: current.account_mappings.filter((_, i) => i !== idx),
                      }))
                    }
                  >
                    <Iconify icon="solar:trash-bin-bold" />
                  </IconButton>
                  {idx === form.account_mappings.length - 1 && (
                    <IconButton
                      size="small"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          account_mappings: [
                            ...current.account_mappings,
                            { source_account: null, destination_account: null },
                          ],
                        }))
                      }
                    >
                      <Iconify icon="solar:add-circle-bold" />
                    </IconButton>
                  )}
                </Box>
              ))}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpen(false);
              setEditTarget(null);
              setForm(EMPTY_FP_FORM);
            }}
          >
            Cancel
          </Button>
          <Button variant="contained" onClick={handleCreate}>
            {editTarget ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Fiscal Position</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action
            cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default FiscalPositions;
