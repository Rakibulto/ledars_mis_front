'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import AlertTitle from '@mui/material/AlertTitle';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import InputAdornment from '@mui/material/InputAdornment';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

import { Iconify } from 'src/components/iconify';

import { formatCurrency } from '../utils';
import { useCurrency } from '../currency-context';
import { useWorkspaceInventoryApi } from './use-workspace-inventory-api';

const STATUS_COLORS = {
  draft: 'default',
  posted: 'success',
};

const MOVEMENT_TYPES = ['Receipt', 'Issue', 'Adjustment', 'Transfer'];

const WAREHOUSES = ['Central Warehouse', 'Field Warehouse', 'Medical Store', 'Regional Hub'];

const INVENTORY_CATEGORIES = [
  'Medical Supplies',
  'Consumables',
  'Equipment',
  'Relief Goods',
  'Stationery',
];

const today = new Date().toISOString().slice(0, 10);

const EMPTY_INVENTORY_FORM = {
  date: today,
  warehouse: 'Central Warehouse',
  category: 'Medical Supplies',
  movementType: 'Receipt',
  itemReference: '',
  quantity: '',
  unitCost: '',
  inventory_account: '',
  cogs_account: '',
  procurementReference: '',
  description: '',
};

export default function InventoryEntries() {
  const { activeCurrency } = useCurrency();
  const {
    inventoryEntries: entries,
    isLoading,
    createEntry,
    updateEntry,
    deleteEntry,
    postEntry,
  } = useWorkspaceInventoryApi();

  const { data: rawAccounts } = useSWR(endpoints.accounting.accounts, fetcher);
  const accounts = useMemo(() => {
    const list = Array.isArray(rawAccounts) ? rawAccounts : rawAccounts?.results ?? [];
    return list.filter((a) => a.is_active !== false);
  }, [rawAccounts]);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draftEntry, setDraftEntry] = useState(EMPTY_INVENTORY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filtered = useMemo(
    () =>
      entries.filter((entry) => {
        const haystack =
          `${entry.number} ${entry.warehouse} ${entry.category} ${entry.description}`.toLowerCase();
        if (search && !haystack.includes(search.toLowerCase())) return false;
        if (status !== 'all' && entry.status !== status) return false;
        return true;
      }),
    [entries, search, status]
  );

  const totalValue = filtered.reduce((sum, entry) => sum + entry.amount, 0);

  const handlePost = async (entryId) => {
    await postEntry(entryId);
  };

  const updateDraftEntry = (field, value) => {
    setDraftEntry((current) => ({ ...current, [field]: value }));
  };

  const handleOpenDialog = () => {
    setDraftEntry(EMPTY_INVENTORY_FORM);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditTarget(null);
    setDraftEntry(EMPTY_INVENTORY_FORM);
  };

  const inventoryAmount = Number(draftEntry.quantity || 0) * Number(draftEntry.unitCost || 0);

  const handleCreateEntry = async () => {
    setSubmitting(true);
    const payload = {
      date: draftEntry.date,
      warehouse: draftEntry.warehouse,
      category: draftEntry.category,
      movement_type: draftEntry.movementType,
      item_reference: draftEntry.itemReference,
      quantity: draftEntry.quantity,
      unit_cost: draftEntry.unitCost,
      inventory_account: draftEntry.inventory_account ? Number(draftEntry.inventory_account) : undefined,
      cogs_account: draftEntry.cogs_account ? Number(draftEntry.cogs_account) : undefined,
      procurement_reference: draftEntry.procurementReference,
      description: draftEntry.description,
    };
    try {
      if (editTarget) {
        await updateEntry(editTarget.id, payload);
      } else {
        await createEntry(payload);
      }
      handleCloseDialog();
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEditDialog = (entry) => {
    setEditTarget(entry);
    setDraftEntry({
      date: entry.date || new Date().toISOString().slice(0, 10),
      warehouse: entry.warehouse ?? '',
      category: entry.category ?? '',
      movementType: entry.movementType ?? entry.movement_type ?? 'issue',
      itemReference: entry.itemReference ?? entry.item_reference ?? '',
      quantity: String(entry.quantity || ''),
      unitCost: String(entry.unitCost ?? entry.unit_cost ?? ''),
      procurementReference: entry.procurementReference ?? entry.procurement_reference ?? '',
      description: entry.description ?? '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteEntry(deleteTarget.id);
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteTarget(null);
    }
  };

  const canCreateEntry =
    draftEntry.description.trim() &&
    draftEntry.itemReference.trim() &&
    Number(draftEntry.quantity) > 0 &&
    Number(draftEntry.unitCost) > 0;

  return (
    <Box sx={{ p: 3 }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Inventory Entries
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Stock accounting workspace for valuation, adjustment, and issue postings.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:add-circle-bold" />}
          onClick={handleOpenDialog}
        >
          New Inventory Entry
        </Button>
      </Stack>

      <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
        <AlertTitle>Inventory posting control active</AlertTitle>
        Inventory entries use live operations data with posting workflow and value tracking.
      </Alert>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Visible movements
              </Typography>
              <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
                {filtered.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Inventory value
              </Typography>
              <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
                {formatCurrency(totalValue)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search warehouse, category, or description"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="solar:magnifer-linear" />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              select
              size="small"
              label="Status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="all">All statuses</MenuItem>
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="posted">Posted</MenuItem>
            </TextField>
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 3 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Number</TableCell>
                  <TableCell>Warehouse</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((entry) => (
                  <TableRow key={entry.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
                        {entry.number}
                      </Typography>
                    </TableCell>
                    <TableCell>{entry.warehouse}</TableCell>
                    <TableCell>{entry.category}</TableCell>
                    <TableCell>{entry.description}</TableCell>
                    <TableCell align="right">{formatCurrency(entry.amount)}</TableCell>
                    <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Chip
                        label={entry.status}
                        size="small"
                        color={STATUS_COLORS[entry.status]}
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" justifyContent="flex-end" spacing={1}>
                        <Tooltip title="Edit entry">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditDialog(entry);
                            }}
                            disabled={entry.status === 'posted'}
                          >
                            <Iconify icon="solar:pen-bold" width={16} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete entry">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(entry);
                            }}
                            disabled={entry.status === 'posted'}
                          >
                            <Iconify icon="solar:trash-bin-trash-bold" width={16} />
                          </IconButton>
                        </Tooltip>
                        <Button
                          size="small"
                          variant="text"
                          component={RouterLink}
                          href={paths.dashboard.accountingFinance.transactions.inventoryEntryDetail(
                            entry.id
                          )}
                        >
                          View
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          disabled={entry.status === 'posted'}
                          onClick={() => handlePost(entry.id)}
                        >
                          Post
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editTarget ? 'Edit Inventory Entry' : 'New Inventory Entry'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              Capture the movement type, warehouse, and valuation inputs before the stock journal is
              created.
            </Alert>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Posting date"
                  value={draftEntry.date}
                  onChange={(event) => updateDraftEntry('date', event.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Movement type"
                  value={draftEntry.movementType}
                  onChange={(event) => updateDraftEntry('movementType', event.target.value)}
                >
                  {MOVEMENT_TYPES.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Warehouse"
                  value={draftEntry.warehouse}
                  onChange={(event) => updateDraftEntry('warehouse', event.target.value)}
                >
                  {WAREHOUSES.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Category"
                  value={draftEntry.category}
                  onChange={(event) => updateDraftEntry('category', event.target.value)}
                >
                  {INVENTORY_CATEGORIES.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Item or SKU reference"
                  placeholder="Item code or stock card reference"
                  value={draftEntry.itemReference}
                  onChange={(event) => updateDraftEntry('itemReference', event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Quantity"
                  value={draftEntry.quantity}
                  onChange={(event) => updateDraftEntry('quantity', event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Unit cost"
                  value={draftEntry.unitCost}
                  onChange={(event) => updateDraftEntry('unitCost', event.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">{activeCurrency.symbol}</InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Inventory asset account"
                  value={draftEntry.inventory_account}
                  onChange={(event) => updateDraftEntry('inventory_account', event.target.value)}
                >
                  <MenuItem value="">Select asset account</MenuItem>
                  {accounts.map((a) => (
                    <MenuItem key={a.id} value={a.id}>
                      {a.code} — {a.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="COGS expense account"
                  value={draftEntry.cogs_account}
                  onChange={(event) => updateDraftEntry('cogs_account', event.target.value)}
                >
                  <MenuItem value="">Select COGS account</MenuItem>
                  {accounts.map((a) => (
                    <MenuItem key={a.id} value={a.id}>
                      {a.code} — {a.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Procurement or issue reference"
                  placeholder="GRN, issue slip, or transfer ref"
                  value={draftEntry.procurementReference}
                  onChange={(event) => updateDraftEntry('procurementReference', event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Derived value"
                  value={formatCurrency(inventoryAmount)}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  label="Description"
                  placeholder="Explain the stock movement, project link, and valuation context"
                  value={draftEntry.description}
                  onChange={(event) => updateDraftEntry('description', event.target.value)}
                />
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateEntry}
            disabled={!canCreateEntry || submitting}
          >
            {submitting ? 'Saving…' : editTarget ? 'Save Changes' : 'Create Entry'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Entry?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete entry <strong>{deleteTarget?.number}</strong>? This
            action cannot be undone.
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
