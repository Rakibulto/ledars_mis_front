'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { toast } from 'sonner';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CardContent from '@mui/material/CardContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';

import { fetcher } from 'src/utils/axios';

import { Iconify } from 'src/components/iconify';

import { formatCurrency } from '../utils';
import { useAssetsWorkspace } from './use-assets-workspace';
import { AssetsWorkspaceToolbar } from './assets-workspace-toolbar';

function SummaryCard({ label, value, helper }) {
  return (
    <Card sx={{ borderRadius: 3, height: '100%' }}>
      <CardContent>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
          {helper}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function AssetRegister() {
  const workspace = useAssetsWorkspace();
  const { formatAssetStatus } = workspace;

  const { data: rawUsers } = useSWR('/api/auth/users/', fetcher);
  const users = useMemo(() => {
    const list = Array.isArray(rawUsers)
      ? rawUsers
      : Array.isArray(rawUsers?.results)
        ? rawUsers.results
        : [];
    return list;
  }, [rawUsers]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [pendingAction, setPendingAction] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [editAsset, setEditAsset] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [impairmentAsset, setImpairmentAsset] = useState(null);
  const [impairmentForm, setImpairmentForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    amount: '',
    reason: '',
    reviewer: 'Finance Controller',
  });
  const [transferAssetId, setTransferAssetId] = useState(null);
  const [transferForm, setTransferForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    toLocation: '',
    assignee: '',
    reason: '',
    costCenterId: '',
  });
  const [addAssetOpen, setAddAssetOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    code: '',
    categoryId: '',
    purchaseDate: new Date().toISOString().slice(0, 10),
    purchaseCost: '',
    salvageValue: '',
    usefulLifeMonths: 60,
    depreciationMethod: 'straight_line',
    serialNumber: '',
    location: '',
    custodian: '',
    condition: 'good',
    vendorId: '',
    costCenterId: '',
    projectName: '',
    description: '',
    mode: 'capitalize',
    userId: '',
  });

  const printContent = (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <thead>
        <tr style={{ background: '#f5f5f5' }}>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>Asset</th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Category
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>Owner</th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>Cost</th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Book Value
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Monthly Depreciation
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Status
          </th>
        </tr>
      </thead>
      <tbody>
        {workspace.assets.map((asset) => (
          <tr key={asset.id}>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{asset.name}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{asset.categoryName}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{asset.custodian}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
              {asset.purchaseCost || asset.purchase_cost}
            </td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{asset.current_value}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
              {asset.monthlyDepreciation}
            </td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{asset.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const filteredAssets = useMemo(
    () =>
      workspace.assets.filter((asset) => {
        if (statusFilter !== 'all' && asset.status !== statusFilter) return false;
        if (categoryFilter !== 'all' && String(asset.categoryId) !== String(categoryFilter))
          return false;
        if (!search) return true;

        return [asset.code, asset.name, asset.categoryName, asset.location, asset.custodian]
          .join(' ')
          .toLowerCase()
          .includes(search.toLowerCase());
      }),
    [categoryFilter, search, statusFilter, workspace.assets]
  );

  const openEdit = (asset) => {
    setEditAsset(asset.id);
    setEditForm({
      name: asset.name,
      code: asset.code,
      status: asset.status,
      location: asset.location,
      custodian: asset.custodian,
    });
  };

  const openAddAsset = () => {
    setAddForm({
      name: '',
      code: '',
      categoryId: '',
      purchaseDate: new Date().toISOString().slice(0, 10),
      purchaseCost: '',
      salvageValue: '',
      usefulLifeMonths: 60,
      depreciationMethod: 'straight_line',
      serialNumber: '',
      location: '',
      custodian: '',
      condition: 'good',
      vendorId: '',
      costCenterId: '',
      projectName: '',
      description: '',
      mode: 'capitalize',
      userId: '',
    });
    setAddAssetOpen(true);
  };

  const runWorkspaceAction = async (label, action, successMessage, onDone) => {
    const loadingId = toast.loading(`${label}...`);
    setPendingAction(label);

    try {
      await action();
      toast.dismiss(loadingId);
      toast.success(successMessage);
      onDone?.();
    } catch (error) {
      toast.dismiss(loadingId);
      toast.error(error?.message || `${label} failed`);
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <Box>
      <AssetsWorkspaceToolbar printTitle="Asset Register" printContent={printContent} />

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Asset Register
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Portfolio register with impairment, transfer, depreciation, and lifecycle controls in
            one workspace.
          </Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button
            variant="contained"
            color="success"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
            disabled={pendingAction !== null}
            onClick={openAddAsset}
          >
            Add Asset
          </Button>
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:danger-triangle-bold" />}
            disabled={pendingAction !== null || !workspace.assets.length}
            onClick={() => {
              const target = workspace.assets.find((a) =>
                ['active', 'fully_depreciated'].includes(a.status)
              );
              if (!target) return;
              setImpairmentAsset(target.id);
              setImpairmentForm({
                date: new Date().toISOString().slice(0, 10),
                amount: '',
                reason: '',
                reviewer: 'Finance Controller',
              });
            }}
          >
            Record Impairment
          </Button>
        </Stack>
      </Stack>

      <Stack spacing={1.25} sx={{ mb: 3 }}>
        {workspace.alerts.map((alert) => (
          <Alert key={alert.id} severity={alert.severity} sx={{ borderRadius: 2 }}>
            <Typography variant="subtitle2" fontWeight={700}>
              {alert.title}
            </Typography>
            {alert.description}
          </Alert>
        ))}
      </Stack>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <SummaryCard
            label="Tracked assets"
            value={workspace.assets.length}
            helper={`${workspace.overview.activeCount} active and ${workspace.overview.disposedCount} disposed`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <SummaryCard
            label="Portfolio cost"
            value={formatCurrency(workspace.overview.totalCost)}
            helper="Capitalized cost across the fixed asset base"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <SummaryCard
            label="Book value"
            value={formatCurrency(workspace.overview.bookValue)}
            helper="Current carrying value after depreciation and impairment"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <SummaryCard
            label="Pending depreciation"
            value={formatCurrency(workspace.overview.pendingDepreciationValue)}
            helper="Next monthly charge still waiting to be posted"
          />
        </Grid>
      </Grid>

      <Card sx={{ borderRadius: 3, mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 5 }}>
              <TextField
                fullWidth
                label="Search assets"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Code, name, location, custodian"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3.5 }}>
              <TextField
                select
                fullWidth
                label="Status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <MenuItem value="all">All status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="fully_depreciated">Fully depreciated</MenuItem>
                <MenuItem value="disposed">Disposed</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 3.5 }}>
              <TextField
                select
                fullWidth
                label="Category"
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
              >
                <MenuItem value="all">All categories</MenuItem>
                {workspace.categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 3, mb: 3 }}>
        <CardContent>
          {workspace.isLoading && workspace.assets.length === 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          )}
          <Box
            sx={{
              overflowX: 'auto',
              display: workspace.isLoading && workspace.assets.length === 0 ? 'none' : 'block',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th align="left">Asset</th>
                  <th align="left">Category</th>
                  <th align="left">Control owner</th>
                  <th align="right">Cost</th>
                  <th align="right">Book value</th>
                  <th align="right">Monthly depreciation</th>
                  <th align="left">Next period</th>
                  <th align="left">Status</th>
                  <th align="right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.map((asset) => (
                  <tr key={asset.id}>
                    <td style={{ padding: '12px 8px' }}>
                      <Stack spacing={0.5}>
                        <Typography variant="body2" fontWeight={700}>
                          {asset.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {asset.code} • {asset.location}
                        </Typography>
                      </Stack>
                    </td>
                    <td style={{ padding: '12px 8px' }}>{asset.categoryName}</td>
                    <td style={{ padding: '12px 8px' }}>
                      <Stack spacing={0.25}>
                        <Typography variant="body2">{asset.custodian}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {asset.costCenterName}
                        </Typography>
                      </Stack>
                    </td>
                    <td align="right" style={{ padding: '12px 8px' }}>
                      {formatCurrency(asset.purchaseCost)}
                    </td>
                    <td align="right" style={{ padding: '12px 8px', fontWeight: 700 }}>
                      {formatCurrency(asset.currentValue)}
                    </td>
                    <td align="right" style={{ padding: '12px 8px' }}>
                      {formatCurrency(asset.monthlyDepreciation)}
                    </td>
                    <td style={{ padding: '12px 8px' }}>{asset.nextDepreciationPeriod}</td>
                    <td style={{ padding: '12px 8px' }}>
                      <Chip
                        label={formatAssetStatus(asset.status)}
                        size="small"
                        color={
                          asset.status === 'disposed'
                            ? 'error'
                            : asset.status === 'fully_depreciated'
                              ? 'warning'
                              : 'success'
                        }
                      />
                    </td>
                    <td align="right" style={{ padding: '12px 8px' }}>
                      <Stack direction="row" justifyContent="flex-end" spacing={0.5}>
                        <IconButton
                          size="small"
                          component={Link}
                          href={`/dashboard/accounting-finance/assets/register/${asset.id}`}
                          title="View Details"
                        >
                          <Iconify icon="solar:eye-bold" width={18} />
                        </IconButton>
                        <IconButton size="small" onClick={() => openEdit(asset)}>
                          <Iconify icon="solar:pen-bold" width={18} />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setTransferAssetId(asset.id);
                            setTransferForm({
                              date: new Date().toISOString().slice(0, 10),
                              toLocation: asset.location,
                              assignee: asset.custodian,
                              reason: '',
                              costCenterId: asset.costCenterId || '',
                            });
                          }}
                        >
                          <Iconify icon="solar:transfer-horizontal-bold" width={18} />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() =>
                            runWorkspaceAction(
                              'Recalculate Asset Schedule',
                              () => workspace.actions.recalculateAssetSchedule(asset.id),
                              `${asset.code} schedule recalculated`
                            )
                          }
                          disabled={pendingAction !== null}
                        >
                          <Iconify icon="solar:restart-bold" width={18} />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteId(asset.id)}
                        >
                          <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                        </IconButton>
                      </Stack>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        </CardContent>
      </Card>

      <Dialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)}>
        <DialogTitle>Delete Asset</DialogTitle>
        <DialogContent>
          <Typography>This removes the asset record from the mock register.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={async () => {
              try {
                await workspace.actions.deleteAssetRecord(deleteId);
                toast.success('Asset deleted');
                setDeleteId(null);
                setSelectedAssetId('');
              } catch (error) {
                toast.error(error?.message || 'Delete failed');
              }
            }}
            disabled={pendingAction !== null}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(editAsset)} onClose={() => setEditAsset(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Register Asset</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <Stack spacing={2}>
            <TextField
              label="Asset name"
              value={editForm.name || ''}
              onChange={(event) => setEditForm({ ...editForm, name: event.target.value })}
              fullWidth
            />
            <TextField
              label="Asset code"
              value={editForm.code || ''}
              onChange={(event) => setEditForm({ ...editForm, code: event.target.value })}
              fullWidth
            />
            <TextField
              label="Location"
              value={editForm.location || ''}
              onChange={(event) => setEditForm({ ...editForm, location: event.target.value })}
              fullWidth
            />
            <TextField
              label="Custodian"
              value={editForm.custodian || ''}
              onChange={(event) => setEditForm({ ...editForm, custodian: event.target.value })}
              fullWidth
            />
            <TextField
              select
              label="Status"
              value={editForm.status || ''}
              onChange={(event) => setEditForm({ ...editForm, status: event.target.value })}
              fullWidth
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="fully_depreciated">Fully depreciated</MenuItem>
              <MenuItem value="disposed">Disposed</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditAsset(null)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={async () => {
              try {
                await workspace.actions.updateAssetRecord(editAsset, editForm);
                toast.success('Asset updated');
                setEditAsset(null);
              } catch (error) {
                toast.error(error?.message || 'Update failed');
              }
            }}
            disabled={pendingAction !== null}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(impairmentAsset)}
        onClose={() => setImpairmentAsset(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Record Impairment</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <Stack spacing={2}>
            <TextField
              select
              label="Asset"
              value={impairmentAsset || ''}
              onChange={(event) => setImpairmentAsset(Number(event.target.value))}
              fullWidth
            >
              {workspace.assets
                .filter((asset) => asset.status !== 'disposed')
                .map((asset) => (
                  <MenuItem key={asset.id} value={asset.id}>
                    {asset.code} • {asset.name}
                  </MenuItem>
                ))}
            </TextField>
            <TextField
              label="Impairment date"
              type="date"
              value={impairmentForm.date}
              onChange={(event) =>
                setImpairmentForm({ ...impairmentForm, date: event.target.value })
              }
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Amount"
              type="number"
              value={impairmentForm.amount}
              onChange={(event) =>
                setImpairmentForm({ ...impairmentForm, amount: event.target.value })
              }
              fullWidth
            />
            <TextField
              label="Reason"
              value={impairmentForm.reason}
              onChange={(event) =>
                setImpairmentForm({ ...impairmentForm, reason: event.target.value })
              }
              multiline
              rows={3}
              fullWidth
            />
            <TextField
              label="Reviewed by"
              value={impairmentForm.reviewer}
              onChange={(event) =>
                setImpairmentForm({ ...impairmentForm, reviewer: event.target.value })
              }
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImpairmentAsset(null)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() =>
              runWorkspaceAction(
                'Record Impairment',
                () => workspace.actions.recordAssetImpairment(impairmentAsset, impairmentForm),
                'Impairment posted',
                () => setImpairmentAsset(null)
              )
            }
            disabled={pendingAction !== null || !impairmentForm.amount || !impairmentForm.reason}
          >
            Post Impairment
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(transferAssetId)}
        onClose={() => setTransferAssetId(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Transfer Asset</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <Stack spacing={2}>
            <TextField
              label="Transfer date"
              type="date"
              value={transferForm.date}
              onChange={(event) => setTransferForm({ ...transferForm, date: event.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="To location"
              value={transferForm.toLocation}
              onChange={(event) =>
                setTransferForm({ ...transferForm, toLocation: event.target.value })
              }
              fullWidth
            />
            <TextField
              label="New custodian"
              value={transferForm.assignee}
              onChange={(event) =>
                setTransferForm({ ...transferForm, assignee: event.target.value })
              }
              fullWidth
            />
            <TextField
              select
              label="Cost center"
              value={transferForm.costCenterId}
              onChange={(event) =>
                setTransferForm({ ...transferForm, costCenterId: event.target.value })
              }
              fullWidth
            >
              {workspace.costCenters.map((center) => (
                <MenuItem key={center.id} value={center.id}>
                  {center.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Reason"
              value={transferForm.reason}
              onChange={(event) => setTransferForm({ ...transferForm, reason: event.target.value })}
              multiline
              rows={3}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTransferAssetId(null)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() =>
              runWorkspaceAction(
                'Transfer Asset',
                () => workspace.actions.transferAsset(transferAssetId, transferForm),
                'Asset transferred',
                () => setTransferAssetId(null)
              )
            }
            disabled={
              pendingAction !== null ||
              !transferForm.toLocation ||
              !transferForm.assignee ||
              !transferForm.reason
            }
          >
            Confirm Transfer
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={addAssetOpen} onClose={() => setAddAssetOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Asset</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Asset name *"
                value={addForm.name}
                onChange={(event) => setAddForm({ ...addForm, name: event.target.value })}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Asset code"
                value={addForm.code}
                onChange={(event) => setAddForm({ ...addForm, code: event.target.value })}
                fullWidth
                helperText="Auto-generated if left blank"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Serial number"
                value={addForm.serialNumber}
                onChange={(event) => setAddForm({ ...addForm, serialNumber: event.target.value })}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                select
                label="Condition"
                value={addForm.condition}
                onChange={(event) => setAddForm({ ...addForm, condition: event.target.value })}
                fullWidth
              >
                <MenuItem value="new">New</MenuItem>
                <MenuItem value="good">Good</MenuItem>
                <MenuItem value="fair">Fair</MenuItem>
                <MenuItem value="poor">Poor</MenuItem>
                <MenuItem value="retired">Retired</MenuItem>
              </TextField>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Divider>
                <Typography variant="caption" color="text.secondary">
                  Category &amp; Financials
                </Typography>
              </Divider>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                select
                label="Category *"
                value={addForm.categoryId}
                onChange={(event) => setAddForm({ ...addForm, categoryId: event.target.value })}
                fullWidth
              >
                {workspace.categories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Purchase date *"
                type="date"
                value={addForm.purchaseDate}
                onChange={(event) => setAddForm({ ...addForm, purchaseDate: event.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Purchase cost *"
                type="number"
                value={addForm.purchaseCost}
                onChange={(event) => setAddForm({ ...addForm, purchaseCost: event.target.value })}
                fullWidth
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Salvage value"
                type="number"
                value={addForm.salvageValue}
                onChange={(event) => setAddForm({ ...addForm, salvageValue: event.target.value })}
                fullWidth
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Useful life (months)"
                type="number"
                value={addForm.usefulLifeMonths}
                onChange={(event) =>
                  setAddForm({ ...addForm, usefulLifeMonths: event.target.value })
                }
                fullWidth
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                select
                label="Depreciation method"
                value={addForm.depreciationMethod}
                onChange={(event) =>
                  setAddForm({ ...addForm, depreciationMethod: event.target.value })
                }
                fullWidth
              >
                <MenuItem value="straight_line">Straight Line</MenuItem>
                <MenuItem value="declining_balance">Declining Balance</MenuItem>
                <MenuItem value="sum_of_years">Sum of Years&#39; Digits</MenuItem>
                <MenuItem value="units_of_production">Units of Production</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                select
                label="Initial status"
                value={addForm.mode}
                onChange={(event) => setAddForm({ ...addForm, mode: event.target.value })}
                fullWidth
              >
                <MenuItem value="capitalize">Running (capitalize now)</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
              </TextField>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Divider>
                <Typography variant="caption" color="text.secondary">
                  Location &amp; Assignment
                </Typography>
              </Divider>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                select
                label="User"
                value={addForm.userId}
                onChange={(event) => {
                  const selectedUser = users.find(
                    (u) => String(u.id) === String(event.target.value)
                  );
                  setAddForm({
                    ...addForm,
                    userId: event.target.value,
                    custodian: selectedUser
                      ? selectedUser.username || selectedUser.email || ''
                      : addForm.custodian,
                  });
                }}
                fullWidth
              >
                <MenuItem value="">— None —</MenuItem>
                {users.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.username || user.email}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Location"
                value={addForm.location}
                onChange={(event) => setAddForm({ ...addForm, location: event.target.value })}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Custodian"
                value={addForm.custodian}
                onChange={(event) => setAddForm({ ...addForm, custodian: event.target.value })}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                select
                label="Vendor"
                value={addForm.vendorId}
                onChange={(event) => setAddForm({ ...addForm, vendorId: event.target.value })}
                fullWidth
              >
                <MenuItem value="">— None —</MenuItem>
                {workspace.vendors.map((vendor) => (
                  <MenuItem key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                select
                label="Cost center"
                value={addForm.costCenterId}
                onChange={(event) => setAddForm({ ...addForm, costCenterId: event.target.value })}
                fullWidth
              >
                <MenuItem value="">— None —</MenuItem>
                {workspace.costCenters.map((center) => (
                  <MenuItem key={center.id} value={center.id}>
                    {center.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Divider>
                <Typography variant="caption" color="text.secondary">
                  Additional
                </Typography>
              </Divider>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Project name"
                value={addForm.projectName}
                onChange={(event) => setAddForm({ ...addForm, projectName: event.target.value })}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Description"
                value={addForm.description}
                onChange={(event) => setAddForm({ ...addForm, description: event.target.value })}
                fullWidth
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddAssetOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() =>
              runWorkspaceAction(
                'Add Asset',
                () => workspace.actions.createAssetAcquisition(addForm),
                'Asset created',
                () => setAddAssetOpen(false)
              )
            }
            disabled={
              pendingAction !== null ||
              !addForm.name ||
              !addForm.categoryId ||
              !addForm.purchaseDate ||
              !addForm.purchaseCost
            }
          >
            Create Asset
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
