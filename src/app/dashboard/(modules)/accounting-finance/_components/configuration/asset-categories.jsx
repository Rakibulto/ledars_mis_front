'use client';

import Link from 'next/link';
import { mutate } from 'swr';
import { toast } from 'sonner';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import { Button } from '@mui/material';
import Table from '@mui/material/Table';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import { Link as LinkIcon, Class as ClassIcon, Timer as TimerIcon } from '@mui/icons-material';
import CardContent from '@mui/material/CardContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import TableContainer from '@mui/material/TableContainer';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';

const BASE_PATH = '/dashboard/accounting-finance/configuration/asset-categories';

const EP = endpoints.accounting;

export default function AssetCategories() {
  const { data: rawCats } = useGetRequest(EP.asset_categories);
  const { data: rawAccounts } = useGetRequest(EP.accounts);
  const ASSET_CATEGORIES = Array.isArray(rawCats) ? rawCats : rawCats?.results || [];
  const ASSETS = Array.isArray(rawAccounts) ? rawAccounts : rawAccounts?.results || [];

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [createForm, setCreateForm] = useState({
    name: '',
    depreciation_method: 'straight_line',
    useful_life: 5,
    salvage_percent: 5,
  });
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);

  const enrichedCategories = useMemo(
    () =>
      ASSET_CATEGORIES.map((category, index) => {
        const assetCount = ASSETS.filter((asset) => asset.category_id === category.id).length;
        const annualRate = category.useful_life
          ? Number((100 / Number(category.useful_life)).toFixed(2))
          : 0;

        return {
          ...category,
          assetCount,
          annualRate,
          depreciationAccount: `${String(category.name || 'Asset')
            .slice(0, 3)
            .toUpperCase()} Depreciation Expense`,
          disposalAccount: `${String(category.name || 'Asset')
            .slice(0, 3)
            .toUpperCase()} Disposal Gain/Loss`,
          setupProfile:
            category.depreciation_method === 'straight_line'
              ? 'Even periodic depreciation with predictable carrying value'
              : 'Accelerated recognition for higher early-period expense',
        };
      }),
    [ASSET_CATEGORIES, ASSETS]
  );

  const totalLinkedAssets = enrichedCategories.reduce((sum, item) => sum + item.assetCount, 0);
  const selectedCategory =
    enrichedCategories.find((item) => String(item.id) === String(selectedCategoryId)) ||
    enrichedCategories[0] ||
    null;

  const handleDelete = async (id) => {
    setDeleteId(id);
    setDeleting(true);
    try {
      await axiosInstance.delete(EP.asset_category_by_id(id));
      mutate(EP.asset_categories);
      toast.success('Category deleted');
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleteId(null);
      setDeleting(false);
    }
  };
  const handleCreate = async () => {
    if (!createForm.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    setCreating(true);
    try {
      await axiosInstance.post(EP.asset_categories, createForm);
      mutate(EP.asset_categories);
      toast.success('Category created');
      setCreateOpen(false);
      setCreateForm({
        name: '',
        depreciation_method: 'straight_line',
        useful_life: 5,
        salvage_percent: 5,
      });
    } catch {
      toast.error('Create failed');
    } finally {
      setCreating(false);
    }
  };
  const handleEdit = async () => {
    if (!editItem) return;
    setEditing(true);
    try {
      await axiosInstance.patch(EP.asset_category_by_id(editItem), editForm);
      mutate(EP.asset_categories);
      toast.success('Category updated');
      setEditItem(null);
      setEditForm({});
    } catch {
      toast.error('Update failed');
    } finally {
      setEditing(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Asset Categories
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Define depreciation setup, disposal posture, and default accounting behavior by asset
            class.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:add-circle-bold" />}
          onClick={() => setCreateOpen(true)}
        >
          Add Category
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Categories
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
                  {enrichedCategories.length}
                </Typography>
                <ClassIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Linked assets
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
                  {totalLinkedAssets}
                </Typography>
                <LinkIcon sx={{ fontSize: 40, color: 'info.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Avg useful life
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
                  {enrichedCategories.length
                    ? Math.round(
                        enrichedCategories.reduce(
                          (sum, item) => sum + Number(item.useful_life || 0),
                          0
                        ) / enrichedCategories.length
                      )
                    : 0}{' '}
                  years
                </Typography>
                <TimerIcon sx={{ fontSize: 40, color: 'warning.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ borderRadius: 3, mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle2" fontWeight={700}>
            Lifecycle control
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Each category now surfaces depreciation pace, default depreciation account posture, and
            disposal account guidance before assets are capitalized.
          </Typography>
        </CardContent>
      </Card>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Category</TableCell>
                <TableCell>Method</TableCell>
                <TableCell>Useful Life</TableCell>
                <TableCell>Depreciation Setup</TableCell>
                <TableCell>Default Accounts</TableCell>
                <TableCell>Assets</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[...enrichedCategories].reverse().map((ac) => (
                <TableRow
                  key={ac.id}
                  hover
                  selected={String(ac.id) === String(selectedCategory?.id)}
                  onClick={() => setSelectedCategoryId(ac.id)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {ac.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={ac.depreciation_method.replace('_', ' ')}
                      size="small"
                      sx={{ height: 22, textTransform: 'capitalize' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{ac.useful_life} years</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Salvage {ac.salvage_percent}%
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{ac.annualRate}% p.a.</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {ac.setupProfile}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{ac.depreciationAccount}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {ac.disposalAccount}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={ac.assetCount}
                      size="small"
                      variant="outlined"
                      sx={{ height: 22 }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="View details">
                      <Button
                        component={Link}
                        href={`${BASE_PATH}/${ac.id}`}
                        size="small"
                        variant="text"
                      >
                        View Details
                      </Button>
                    </Tooltip>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setEditItem(ac.id);
                        setEditForm(ac);
                      }}
                    >
                      <Iconify icon="solar:pen-bold" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(ac.id)}>
                      <Iconify icon="solar:trash-bin-trash-bold" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* {selectedCategory ? (
        <Card sx={{ borderRadius: 3, mt: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Category Control Detail
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="body2">Category: {selectedCategory.name}</Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Depreciation method: {selectedCategory.depreciation_method}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Useful life: {selectedCategory.useful_life} years
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="body2">
                  Default depreciation account: {selectedCategory.depreciationAccount}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Default disposal account: {selectedCategory.disposalAccount}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Lifecycle posture: {selectedCategory.setupProfile}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      ) : null} */}

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Asset Category</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Category Name"
                value={createForm.name}
                onChange={(event) =>
                  setCreateForm((current) => ({ ...current, name: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Depreciation Method"
                value={createForm.depreciation_method}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    depreciation_method: event.target.value,
                  }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                fullWidth
                type="number"
                label="Useful Life"
                value={createForm.useful_life}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    useful_life: Number(event.target.value),
                  }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                fullWidth
                type="number"
                label="Salvage %"
                value={createForm.salvage_percent}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    salvage_percent: Number(event.target.value),
                  }))
                }
              />
            </Grid>
          </Grid>
          <Divider sx={{ my: 2 }} />
          <Typography variant="caption" color="text.secondary">
            Preview:{' '}
            {createForm.useful_life ? Number((100 / Number(createForm.useful_life)).toFixed(2)) : 0}
            % annual depreciation, default disposal posture based on category naming.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={creating}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(editItem)}
        onClose={() => {
          setEditItem(null);
          setEditForm({});
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Asset Category</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Category Name"
                value={editForm.name || ''}
                onChange={(event) =>
                  setEditForm((current) => ({ ...current, name: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Depreciation Method"
                value={editForm.depreciation_method || ''}
                onChange={(event) =>
                  setEditForm((current) => ({
                    ...current,
                    depreciation_method: event.target.value,
                  }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                fullWidth
                type="number"
                label="Useful Life"
                value={editForm.useful_life || 0}
                onChange={(event) =>
                  setEditForm((current) => ({
                    ...current,
                    useful_life: Number(event.target.value),
                  }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                fullWidth
                type="number"
                label="Salvage %"
                value={editForm.salvage_percent || 0}
                onChange={(event) =>
                  setEditForm((current) => ({
                    ...current,
                    salvage_percent: Number(event.target.value),
                  }))
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setEditItem(null);
              setEditForm({});
            }}
          >
            Cancel
          </Button>
          <Button variant="contained" onClick={handleEdit} disabled={editing}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
