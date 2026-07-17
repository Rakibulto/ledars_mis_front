'use client';

import Link from 'next/link';
import { toast } from 'sonner';
import { useState, useMemo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import MenuItem from '@mui/material/MenuItem';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import GavelIcon from '@mui/icons-material/Gavel';
import CardContent from '@mui/material/CardContent';
import DialogTitle from '@mui/material/DialogTitle';
import PercentIcon from '@mui/icons-material/Percent';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import TableContainer from '@mui/material/TableContainer';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PaymentsIcon from '@mui/icons-material/Payments';
import DescriptionIcon from '@mui/icons-material/Description';

import { Iconify } from 'src/components/iconify';

import { useTaxesApi } from './use-taxes-api';
import { FoundationalConfigToolbar } from './foundational-config-toolbar';

const BASE_PATH = '/dashboard/accounting-finance/configuration/taxes';

const TAX_TYPE_COLORS = {
  withholding: '#f59e0b',
  input: '#2563eb',
  output: '#16a34a',
};

const EMPTY_FORM = {
  code: '',
  name: '',
  rate: 0,
  scope: 'sales',
  tax_type: 'percentage',
};

export default function TaxesVAT() {
  const workspace = useTaxesApi();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filteredTaxes = useMemo(() => {
    let list = workspace.taxes;
    if (typeFilter !== 'all') {
      list = list.filter((t) => t.type === typeFilter);
    }
    if (sourceFilter !== 'all') {
      list = list.filter((t) => t.source === sourceFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          String(t.code).toLowerCase().includes(q) ||
          String(t.name).toLowerCase().includes(q)
      );
    }
    return list;
  }, [workspace.taxes, typeFilter, sourceFilter, search]);

  const handleCreate = async () => {
    if (!form.code.trim() || !form.name.trim()) {
      toast.error('Code and name are required');
      return;
    }
    try {
      if (editTarget) {
        await workspace.actions.updateTax(editTarget.id, form);
        toast.success('Tax rule updated');
      } else {
        await workspace.actions.createTax(form);
        toast.success('Tax rule created');
      }
      setOpen(false);
      setEditTarget(null);
      setForm(EMPTY_FORM);
    } catch (err) {
      toast.error(err?.response?.data?.detail || err?.message || 'Failed to save tax rule');
    }
  };

  const handleOpenEditDialog = (tax) => {
    setEditTarget(tax);
    setForm({
      code: tax.code || '',
      name: tax.name || '',
      rate: tax.rate ?? 0,
      scope: tax.scope || tax.type || 'sales',
      tax_type: tax.tax_type || 'percentage',
    });
    setOpen(true);
  };

  const handleDelete = async () => {
    try {
      await workspace.actions.deleteTax(deleteTarget.id);
      toast.success('Tax rule deleted');
      setDeleteTarget(null);
    } catch {
      toast.error('Failed to delete tax rule');
    }
  };

  const printContent = (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <thead>
        <tr style={{ background: '#f5f5f5' }}>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>Code</th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>Name</th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>Rate</th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>Type</th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Tax Type
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Settlement Account
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Status
          </th>
        </tr>
      </thead>
      <tbody>
        {workspace.taxes.map((tax) => (
          <tr key={tax.id}>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{tax.code}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{tax.name}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{tax.rate}%</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{tax.type}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
              {tax.totalTax > 0 ? Number(tax.totalTax).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
            </td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{tax.docCount}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <Box sx={{ p: 3 }}>
      <FoundationalConfigToolbar printTitle="Taxes / VAT" printContent={printContent} />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Taxes / VAT
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Tax rule control for filing boxes, settlement accounts, and input or output VAT
            governance.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:add-circle-bold" />}
          onClick={() => setOpen(true)}
        >
          New Tax Rule
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Input tax (from bills)
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
                  {workspace.overview.totalInputTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
                <ReceiptLongIcon sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Output tax (from invoices)
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
                  {workspace.overview.totalOutputTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
                <PaymentsIcon sx={{ fontSize: 40, color: 'warning.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Average tax rate
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
                  {workspace.overview.averageTaxRate}%
                </Typography>
                <PercentIcon sx={{ fontSize: 40, color: 'info.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ borderRadius: 3, mb: 3 }}>
        <CardContent sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            select
            size="small"
            label="Tax Type"
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="all">All Types</MenuItem>
            <MenuItem value="input">Input (from bills)</MenuItem>
            <MenuItem value="output">Output (from invoices)</MenuItem>
          </TextField>
          <TextField
            select
            size="small"
            label="Source"
            value={sourceFilter}
            onChange={(event) => setSourceFilter(event.target.value)}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="all">All sources</MenuItem>
            <MenuItem value="computed">From bills/invoices</MenuItem>
            <MenuItem value="definition">Manual definitions</MenuItem>
          </TextField>
          <TextField
            size="small"
            label="Search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Code or name"
            sx={{ minWidth: 200, maxWidth: 300 }}
          />
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Code</TableCell>
                <TableCell>Name</TableCell>
                <TableCell align="right">Rate</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="right">Taxable Base</TableCell>
                <TableCell align="right">Tax Amount</TableCell>
                <TableCell align="right">Documents</TableCell>
                <TableCell>Source</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTaxes.map((tax) => (
                <TableRow key={tax.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {tax.code}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {tax.name}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={700}>
                      {tax.rate}%
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ textTransform: 'capitalize' }}>{tax.type}</TableCell>
                  <TableCell align="right">
                    {tax.totalBase > 0 ? Number(tax.totalBase).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={700}>
                      {tax.totalTax > 0 ? Number(tax.totalTax).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">{tax.docCount}</TableCell>
                  <TableCell>
                    <Chip
                      label={tax.source === 'computed' ? 'From bills' : 'Manual'}
                      size="small"
                      color={tax.source === 'computed' ? 'info' : 'default'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Chip
                      label={tax.active ? 'Active' : 'Inactive'}
                      size="small"
                      color={tax.active ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Stack
                      direction="row"
                      spacing={1}
                      justifyContent="flex-end"
                      alignItems="center"
                    >
                      <Tooltip title="View details">
                        <Button
                          component={Link}
                          href={`${BASE_PATH}/${tax.id}`}
                          size="small"
                          variant="text"
                        >
                          View Details
                        </Button>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleOpenEditDialog(tax)}>
                          <Iconify icon="solar:pen-bold" width={16} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => setDeleteTarget(tax)}>
                          <Iconify icon="solar:trash-bin-trash-bold" width={16} />
                        </IconButton>
                      </Tooltip>
                      <Button
                        size="small"
                        variant="outlined"
                        color="inherit"
                        onClick={() => workspace.actions.toggleTaxStatus(tax.id)}
                      >
                        {tax.active ? 'Disable' : 'Enable'}
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editTarget ? 'Edit Tax Rule' : 'New Tax Rule'}</DialogTitle>
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
            <Grid size={{ xs: 12, sm: 8 }}>
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
                type="number"
                label="Rate %"
                value={form.rate}
                onChange={(event) =>
                  setForm((current) => ({ ...current, rate: Number(event.target.value) }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                select
                fullWidth
                label="Scope"
                value={form.scope}
                onChange={(event) =>
                  setForm((current) => ({ ...current, scope: event.target.value }))
                }
              >
                <MenuItem value="sales">Sales (Output)</MenuItem>
                <MenuItem value="purchase">Purchase (Input)</MenuItem>
                <MenuItem value="both">Both</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                select
                fullWidth
                label="Computation"
                value={form.tax_type}
                onChange={(event) =>
                  setForm((current) => ({ ...current, tax_type: event.target.value }))
                }
              >
                <MenuItem value="percentage">Percentage</MenuItem>
                <MenuItem value="fixed">Fixed Amount</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpen(false);
              setEditTarget(null);
              setForm(EMPTY_FORM);
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
        <DialogTitle>Delete Tax Rule</DialogTitle>
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
