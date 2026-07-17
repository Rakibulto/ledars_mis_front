'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import React, { useMemo, useState } from 'react';

import { alpha, useTheme } from '@mui/material/styles';
import {
  Box,
  Card,
  Grid,
  Alert,
  Stack,
  Table,
  Button,
  Switch,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  IconButton,
  Pagination,
  Typography,
  Autocomplete,
  TableContainer,
  FormControlLabel,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import { useBoolean } from 'src/hooks/use-boolean';

import { endpoints } from 'src/utils/axios';

import {
  useGetRequest,
  extractErrorMessage,
  usePutRequest as putRequest,
  useCreateRequest as createRequest,
  useDeleteRequest as deleteRequest,
} from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import TableRowSkeleton from 'src/components/table/tableRowSkeleton';

import { renderBooleanChip } from '../shared/inventory-desk-page';
import {
  toBomOptions,
  formatBomAmount,
  getEmptyBomForm,
  validateBomForm,
  bomFormToPayload,
  normalizeBomForm,
  KittingBomFormDialog,
  buildKittingBomQuery,
  sortBomOptionsByName,
  BOM_STATUS_FILTER_OPTIONS,
} from './kitting-bom-form-dialog';

const EP = endpoints.storeInventory;

function KittingBomRow({ row, serialNumber, onOpenDetails, onEdit, onDelete }) {
  return (
    <TableRow
      hover
      onClick={() => onOpenDetails(row.id)}
      sx={{
        cursor: 'pointer',
        '&:hover': {
          bgcolor: 'action.hover',
        },
      }}
    >
      <TableCell align="center" sx={{ width: 56 }}>
        <Typography variant="body2" fontWeight={700} color="text.secondary">
          {serialNumber}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" fontWeight={700} color="text.primary">
          {row.name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {row.code || 'No code'}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" color="text.secondary">
          {row.product_name || 'Unlinked'}
        </Typography>
      </TableCell>
      <TableCell align="center">
        <Typography variant="body2" color="text.secondary">
          {row.component_count || 0}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Typography variant="body2" color="text.secondary">
          {formatBomAmount(row.total_component_qty || 0)}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Typography variant="body2" color="text.secondary">
          {Number(row.assembly_time_minutes || 0)} min
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Typography variant="body2" fontWeight={700} color="text.primary">
          Tk {formatBomAmount(row.total_cost || 0)}
        </Typography>
      </TableCell>
      <TableCell align="center">{renderBooleanChip(row.is_active, 'Active', 'Inactive')}</TableCell>
      <TableCell align="center">
        <Stack direction="row" spacing={0.5} justifyContent="center">
          <IconButton
            size="small"
            color="primary"
            onClick={(event) => {
              event.stopPropagation();
              onEdit(row);
            }}
          >
            <Iconify icon="solar:pen-bold" width={18} />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(row);
            }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" width={18} />
          </IconButton>
        </Stack>
      </TableCell>
    </TableRow>
  );
}

export default function KittingBomMain() {
  const confirm = useBoolean();
  const router = useRouter();
  const theme = useTheme();

  const isDark = theme.palette.mode === 'dark';
  const panelSx = {
    borderRadius: 3,
    border: `1px solid ${theme.palette.divider}`,
    bgcolor: theme.palette.background.paper,
  };
  const tableHeadBg = alpha(theme.palette.text.primary, isDark ? 0.12 : 0.04);
  const primaryGradient = `linear-gradient(90deg, ${theme.palette.info.main}, ${theme.palette.success.main})`;
  const primaryGradientHover = `linear-gradient(90deg, ${theme.palette.info.dark}, ${theme.palette.success.dark})`;

  const [page, setPage] = useState(0);
  const [dense, setDense] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBom, setEditingBom] = useState(null);
  const [form, setForm] = useState(getEmptyBomForm());
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const listUrl = useMemo(
    () =>
      `${EP.kitting_bom}?${buildKittingBomQuery({ search: searchQuery, productId: productFilter, status: statusFilter, page })}`,
    [page, productFilter, searchQuery, statusFilter]
  );

  const { data: rawBomList, loading: bomListLoading, error: bomListError } = useGetRequest(listUrl);
  const { data: rawProducts } = useGetRequest(EP.products);

  const products = useMemo(() => sortBomOptionsByName(toBomOptions(rawProducts)), [rawProducts]);

  const rows = useMemo(() => {
    const bomList = Array.isArray(rawBomList?.results)
      ? rawBomList.results
      : toBomOptions(rawBomList);

    return bomList.map((bom) => ({
      ...bom,
      component_count: bom.component_count ?? bom.components?.length ?? 0,
      total_component_qty:
        bom.total_component_qty ??
        (Array.isArray(bom.components)
          ? bom.components.reduce((sum, component) => sum + Number(component.quantity || 0), 0)
          : 0),
      total_cost: Number(bom.total_cost || 0),
    }));
  }, [rawBomList]);

  const summaryMetrics = useMemo(
    () => ({
      total: rawBomList?.count ?? rows.length,
      active: rows.filter((row) => row.is_active).length,
      withComponents: rows.filter((row) => Number(row.component_count || 0) > 0).length,
      totalCost: rows.reduce((sum, row) => sum + Number(row.total_cost || 0), 0),
    }),
    [rawBomList, rows]
  );

  const totalPages = rawBomList?.total_pages || 1;
  const rowsPerPage = rawBomList?.page_size || 10;

  const revalidateBomQueries = async () => {
    await mutate((key) => typeof key === 'string' && key.startsWith(EP.kitting_bom));
  };

  const openDetails = (id) => {
    router.push(paths.dashboard.storeInventory.kittingBom_detail(id));
  };

  const openCreateDialog = () => {
    setEditingBom(null);
    setForm(getEmptyBomForm());
    setDialogOpen(true);
  };

  const openEditDialog = (bom) => {
    setEditingBom(bom);
    setForm(normalizeBomForm(bom));
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (submitting) {
      return;
    }

    setDialogOpen(false);
    setEditingBom(null);
    setForm(getEmptyBomForm());
  };

  const handleSubmit = async () => {
    const validationMessage = validateBomForm(form);

    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    setSubmitting(true);

    try {
      const payload = bomFormToPayload(form);

      if (editingBom) {
        await putRequest(EP.kitting_bom_by_id(editingBom.id), payload);
        toast.success('BOM updated successfully.');
      } else {
        await createRequest(EP.kitting_bom, payload);
        toast.success('BOM created successfully.');
      }

      closeDialog();
      await revalidateBomQueries();
    } catch (requestError) {
      toast.error(extractErrorMessage(requestError?.response?.data || requestError));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      await deleteRequest(EP.kitting_bom_by_id(deleteTarget.id));
      toast.success('BOM deleted successfully.');
      await revalidateBomQueries();
    } catch (requestError) {
      toast.error(extractErrorMessage(requestError?.response?.data || requestError));
    } finally {
      confirm.onFalse();
      setDeleteTarget(null);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setProductFilter('');
    setStatusFilter('');
    setPage(0);
  };

  return (
    <Box sx={{ p: 3, minHeight: '100vh', bgcolor: 'background.default' }}>
      <Stack spacing={3}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'flex-start', md: 'center' }}
          justifyContent="space-between"
          spacing={2}
        >
          <Box>
            <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
              <Iconify icon="solar:box-bold-duotone" width={28} />
              <Typography variant="h4" fontWeight={800} color="text.primary">
                Kitting / Bill of Materials
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Design and maintain finished-good BOMs with nested component lines, backend filters,
              and row-to-detail navigation.
            </Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={openCreateDialog}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              color: theme.palette.primary.contrastText,
              background: primaryGradient,
              '&:hover': {
                background: primaryGradientHover,
              },
            }}
          >
            Add BOM
          </Button>
        </Stack>

        <Alert severity={bomListError ? 'error' : 'info'} sx={{ borderRadius: 2 }}>
          {bomListError
            ? 'Failed to load BOM records. Check the backend response or active filters and try again.'
            : 'This page now uses the real BOM API with backend pagination, server-side search, writable component lines, and full CRUD support.'}
        </Alert>

        <Grid container spacing={3}>
          {[
            {
              label: 'Matching BOMs',
              value: summaryMetrics.total,
              helper: 'Records matched on the backend by the current filters.',
              color: theme.palette.primary.main,
              icon: 'solar:box-bold-duotone',
            },
            {
              label: 'Active on Page',
              value: summaryMetrics.active,
              helper: 'Visible BOMs currently available for production use.',
              color: theme.palette.success.main,
              icon: 'solar:check-circle-bold-duotone',
            },
            {
              label: 'Structured BOMs',
              value: summaryMetrics.withComponents,
              helper: 'Visible BOMs that already contain component lines.',
              color: theme.palette.info.main,
              icon: 'solar:clipboard-list-bold-duotone',
            },
            {
              label: 'Visible Cost Rollup',
              value: `Tk ${formatBomAmount(summaryMetrics.totalCost)}`,
              helper: 'Combined cost from the current visible page.',
              color: theme.palette.warning.main,
              icon: 'solar:wad-of-money-bold-duotone',
            },
          ].map((card) => (
            <Grid key={card.label} size={{ xs: 12, sm: 6, lg: 3 }}>
              <Card sx={panelSx}>
                <Box sx={{ p: 3 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="overline" color="text.secondary">
                        {card.label}
                      </Typography>
                      <Typography variant="h4" fontWeight={800} color="text.primary">
                        {bomListLoading ? '...' : card.value}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        width: 42,
                        height: 42,
                        borderRadius: 2,
                        bgcolor: alpha(card.color, isDark ? 0.22 : 0.12),
                        color: card.color,
                        display: 'grid',
                        placeItems: 'center',
                      }}
                    >
                      <Iconify icon={card.icon} width={22} />
                    </Box>
                  </Stack>
                  <Typography variant="body2" color="text.secondary" mt={1.5}>
                    {card.helper}
                  </Typography>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Card sx={panelSx}>
          <Box sx={{ p: 2.5 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, md: 5 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search by BOM name, code, product, or description"
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    setPage(0);
                  }}
                  InputProps={{
                    startAdornment: (
                      <Iconify
                        icon="solar:magnifer-linear"
                        width={18}
                        sx={{ mr: 1, color: 'text.secondary' }}
                      />
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Autocomplete
                  size="small"
                  options={products}
                  value={products.find((product) => product.id === Number(productFilter)) || null}
                  onChange={(event, nextValue) => {
                    setProductFilter(nextValue?.id ? String(nextValue.id) : '');
                    setPage(0);
                  }}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  getOptionLabel={(option) => option?.name || ''}
                  renderInput={(params) => <TextField {...params} label="Filter by Product" />}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <Autocomplete
                  size="small"
                  options={BOM_STATUS_FILTER_OPTIONS}
                  value={
                    BOM_STATUS_FILTER_OPTIONS.find((option) => option.id === statusFilter) ||
                    BOM_STATUS_FILTER_OPTIONS[0]
                  }
                  onChange={(event, nextValue) => {
                    setStatusFilter(nextValue?.id ?? '');
                    setPage(0);
                  }}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  getOptionLabel={(option) => option?.label || ''}
                  renderInput={(params) => <TextField {...params} label="Status" />}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <Stack
                  direction="row"
                  spacing={1.5}
                  justifyContent={{ xs: 'flex-start', md: 'flex-end' }}
                  alignItems="center"
                >
                  <FormControlLabel
                    control={
                      <Switch
                        checked={dense}
                        onChange={(event) => setDense(event.target.checked)}
                      />
                    }
                    label="Dense"
                  />
                  <Button onClick={handleResetFilters} sx={{ textTransform: 'none' }}>
                    Reset
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </Box>
        </Card>

        <Card sx={panelSx}>
          <TableContainer>
            <Table size={dense ? 'small' : 'medium'}>
              <TableHead>
                <TableRow sx={{ bgcolor: tableHeadBg }}>
                  <TableCell align="center" sx={{ width: 56, fontWeight: 700 }}>
                    SL
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>BOM</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Product</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>
                    Components
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    Total Qty
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    Assembly
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    Total Cost
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>
                    Status
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bomListLoading
                  ? Array.from({ length: 5 }, (_, index) => (
                      <TableRowSkeleton
                        key={index}
                        columns={[
                          { type: 'text', width: 20, align: 'center' },
                          { type: 'text', width: 170 },
                          { type: 'text', width: 140 },
                          { type: 'text', width: 60, align: 'center' },
                          { type: 'text', width: 80, align: 'right' },
                          { type: 'text', width: 80, align: 'right' },
                          { type: 'text', width: 90, align: 'right' },
                          { type: 'rect', width: 72, height: 24, align: 'center' },
                          { type: 'circle', count: 2, size: 30, align: 'center' },
                        ]}
                      />
                    ))
                  : rows.map((row, index) => (
                      <KittingBomRow
                        key={row.id}
                        row={row}
                        serialNumber={page * rowsPerPage + index + 1}
                        onOpenDetails={openDetails}
                        onEdit={openEditDialog}
                        onDelete={(bom) => {
                          setDeleteTarget(bom);
                          confirm.onTrue();
                        }}
                      />
                    ))}

                {!bomListLoading && !rows.length && (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                      <Stack alignItems="center" spacing={2}>
                        <Iconify
                          icon="solar:box-minimalistic-bold-duotone"
                          width={56}
                          sx={{ color: 'text.disabled' }}
                        />
                        <Typography variant="h6" color="text.secondary">
                          No BOM records found
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Adjust the filters or add a new bill of materials.
                        </Typography>
                      </Stack>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Box
            sx={{
              px: 2.5,
              py: 2,
              borderTop: `1px solid ${theme.palette.divider}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 2,
              flexWrap: 'wrap',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {rawBomList?.count ?? 0} records matched on the backend.
            </Typography>

            <Pagination
              count={totalPages}
              page={page + 1}
              onChange={(event, nextPage) => setPage(nextPage - 1)}
              variant="outlined"
              shape="rounded"
            />
          </Box>
        </Card>
      </Stack>

      <KittingBomFormDialog
        open={dialogOpen}
        title={editingBom ? 'Edit Kitting / BOM' : 'Add Kitting / BOM'}
        submitLabel={submitting ? 'Saving...' : editingBom ? 'Update BOM' : 'Create BOM'}
        form={form}
        setForm={setForm}
        products={products}
        submitting={submitting}
        onClose={closeDialog}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete Kitting / BOM"
        content={`Are you sure you want to delete ${deleteTarget?.name || 'this BOM'}?`}
        action={
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        }
      />
    </Box>
  );
}

// 'use client';

// import React, { useMemo, useState } from 'react';
// import { toast } from 'sonner';
// import { mutate } from 'swr';

// import {
//   Box,
//   Button,
//   Card,
//   Dialog,
//   DialogActions,
//   DialogContent,
//   DialogTitle,
//   Grid,
//   IconButton,
//   InputAdornment,
//   Pagination,
//   Stack,
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   TextField,
//   Typography,
// } from '@mui/material';

// import { Iconify } from 'src/components/iconify';
// import { ConfirmDialog } from 'src/components/custom-dialog';
// import { useBoolean } from 'src/hooks/use-boolean';
// import { endpoints } from 'src/utils/axios';
// import { useGetRequest, useCreateRequest, usePutRequest, useDeleteRequest } from 'src/actions/ledars-hook';

// export default function KittingBomMain() {
//   const [searchTerm, setSearchTerm] = useState('');
//   const [page, setPage] = useState(1);
//   const rowsPerPage = 10;

//   const { data: rawBom } = useGetRequest(endpoints.storeInventory.kitting_bom);
//   const bomData = Array.isArray(rawBom) ? rawBom : rawBom?.results || [];

//   const { data: rawProducts } = useGetRequest(endpoints.storeInventory.products);
//   const productsData = Array.isArray(rawProducts) ? rawProducts : rawProducts?.results || [];

//   const rows = bomData.map(k => ({ ...k, product_name: productsData.find(p => p.id === k.product_id)?.name || k.name, component_count: Array.isArray(k.components) ? k.components.length : 0 }));
//   const tableData = rows;

//   const filtered = useMemo(() => {
//     if (!searchTerm) return tableData;
//     return tableData.filter((row) =>
//       Object.values(row).some((val) =>
//         String(val).toLowerCase().includes(searchTerm.toLowerCase())
//       )
//     );
//   }, [searchTerm, tableData]);

//   const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

//   const [dialogOpen, setDialogOpen] = useState(false);
//   const [editingItem, setEditingItem] = useState(null);
//   const [form, setForm] = useState({ name: '', product_name: '', component_count: '', is_active: true });
//   const [deleteId, setDeleteId] = useState(null);
//   const confirm = useBoolean();

//   const EP = endpoints.storeInventory;

//   const handleCreate = async () => {
//     try {
//       await useCreateRequest(EP.kitting_bom, form);
//       toast.success('Created successfully');
//       setDialogOpen(false);
//       setForm({ name: '', product_name: '', component_count: '', is_active: true });
//       mutate(EP.kitting_bom);
//     } catch (err) {
//       toast.error('Failed to create');
//     }
//   };

//   const handleUpdate = async () => {
//     try {
//       await usePutRequest(EP.kitting_bom_by_id(editingItem.id), form);
//       toast.success('Updated successfully');
//       setDialogOpen(false);
//       setEditingItem(null);
//       setForm({ name: '', product_name: '', component_count: '', is_active: true });
//       mutate(EP.kitting_bom);
//     } catch (err) {
//       toast.error('Failed to update');
//     }
//   };

//   const handleDelete = async () => {
//     try {
//       await useDeleteRequest(EP.kitting_bom_by_id(deleteId));
//       toast.success('Deleted successfully');
//       mutate(EP.kitting_bom);
//     } catch (err) {
//       toast.error('Failed to delete');
//     } finally {
//       confirm.onFalse();
//       setDeleteId(null);
//     }
//   };

//   const handleEdit = (item) => {
//     setEditingItem(item);
//     setForm({ name: item.name || '', product_name: item.product_name || '', component_count: item.component_count || '', is_active: item.is_active ?? true });
//     setDialogOpen(true);
//   };

//   const openCreate = () => {
//     setEditingItem(null);
//     setForm({ name: '', product_name: '', component_count: '', is_active: true });
//     setDialogOpen(true);
//   };

//   const handleSubmit = editingItem ? handleUpdate : handleCreate;

//   return (
//     <Box sx={{ p: 3 }}>
//       <Typography variant="h4" sx={{ mb: 3 }}>Kitting / Bill of Materials</Typography>

//       <Grid container spacing={3} sx={{ mb: 3 }}>
//             <Grid item xs={12} sm={6} md={4}>
//               <Card sx={{ p: 3, textAlign: 'center' }}>
//                 <Iconify icon="solar:layers-bold-duotone" width={40} sx={{ mb: 1, color: 'primary.main' }} />
//                 <Typography variant="h4">{rows.length}</Typography>
//                 <Typography variant="body2" sx={{ color: 'text.secondary' }}>Total BOMs</Typography>
//               </Card>
//             </Grid>
//             <Grid item xs={12} sm={6} md={4}>
//               <Card sx={{ p: 3, textAlign: 'center' }}>
//                 <Iconify icon="solar:check-circle-bold-duotone" width={40} sx={{ mb: 1, color: 'primary.main' }} />
//                 <Typography variant="h4">{rows.filter(r => r.is_active).length}</Typography>
//                 <Typography variant="body2" sx={{ color: 'text.secondary' }}>Active Kits</Typography>
//               </Card>
//             </Grid>
//       </Grid>

//       <Card sx={{ p: 2 }}>
//         <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
//           <TextField
//             size="small"
//             placeholder="Search..."
//             value={searchTerm}
//             onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
//             InputProps={{
//               startAdornment: (
//                 <InputAdornment position="start">
//                   <Iconify icon="solar:magnifer-bold-duotone" />
//                 </InputAdornment>
//               ),
//             }}
//             sx={{ width: 300 }}
//           />
//           <Button variant="contained" startIcon={<Iconify icon="mingcute:add-line" />} onClick={openCreate}>
//             Add New
//           </Button>
//         </Stack>

//         <TableContainer>
//           'use client';

//           import { endpoints } from 'src/utils/axios';
//           import { useGetRequest } from 'src/actions/ledars-hook';

//           import InventoryCrudDeskPage from '../shared/inventory-crud-desk-page';
//           import { renderBooleanChip } from '../shared/inventory-desk-page';

//           const EP = endpoints.storeInventory;
//           const DEFAULT_FORM = { name: '', product_name: '', component_count: '', is_active: true };

//           export default function KittingBomMain() {
//             const { data: rawBom } = useGetRequest(EP.kitting_bom);
//             const { data: rawProducts } = useGetRequest(EP.products);
//             const kittingBom = Array.isArray(rawBom) ? rawBom : rawBom?.results || [];
//             const products = Array.isArray(rawProducts) ? rawProducts : rawProducts?.results || [];

//             const rows = kittingBom.map((item) => ({
//               ...item,
//               product_name: products.find((product) => product.id === item.product_id)?.name || item.name,
//               component_count: item.components?.length || 0,
//             }));

//             return (
//               <InventoryCrudDeskPage
//                 title="Kitting / Bill of Materials"
//                 dialogTitle="BOM"
//                 description="Maintain kit structures and component counts so assembly, pre-positioning, and humanitarian pack preparation stay consistent across runs."
//                 icon="solar:box-bold-duotone"
//                 rows={rows}
//                 columns={[
//                   { key: 'id', label: 'ID' },
//                   { key: 'name', label: 'Kit Name' },
//                   { key: 'product_name', label: 'Product' },
//                   { key: 'component_count', label: 'Components' },
//                   { key: 'is_active', label: 'Active', render: (row) => renderBooleanChip(row.is_active, 'Active', 'Inactive') },
//                 ]}
//                 summaryCards={[
//                   { label: 'Total BOMs', value: rows.length, icon: 'solar:box-bold-duotone', helper: 'Kit definitions available to operations.' },
//                   { label: 'Active kits', value: rows.filter((row) => row.is_active).length, icon: 'solar:check-circle-bold-duotone', color: 'success', helper: 'Live kits ready for assembly workflows.' },
//                 ]}
//                 queueItems={(allRows) => [
//                   { label: 'Inactive BOMs', value: allRows.filter((row) => !row.is_active).length, color: 'default', helper: 'These BOMs should be archived or reactivated intentionally.' },
//                   { label: 'Lean kits', value: allRows.filter((row) => Number(row.component_count || 0) <= 1).length, color: 'warning', helper: 'Kits with very low component count may need validation.' },
//                 ]}
//                 reviewFields={[
//                   { label: 'Product', render: (row) => row.product_name || 'Unlinked product' },
//                   { label: 'Components', render: (row) => row.component_count },
//                   { label: 'Status', render: (row) => renderBooleanChip(row.is_active, 'Active', 'Inactive') },
//                 ]}
//                 defaultForm={DEFAULT_FORM}
//                 fields={[
//                   { key: 'name', label: 'Kit Name' },
//                   { key: 'product_name', label: 'Product Name' },
//                   { key: 'component_count', label: 'Component Count', type: 'number' },
//                   { key: 'is_active', label: 'Active', options: [{ label: 'Active', value: true }, { label: 'Inactive', value: false }] },
//                 ]}
//                 createEndpoint={EP.kitting_bom}
//                 updateEndpoint={(id) => EP.kitting_bom_by_id(id)}
//                 deleteEndpoint={(id) => EP.kitting_bom_by_id(id)}
//                 mutateKey={EP.kitting_bom}
//                 getRowTitle={(row) => row.name || 'Unnamed kit'}
//                 getRowSubtitle={(row) => `${row.component_count} components for ${row.product_name || 'unlinked product'}`}
//               />
//             );
//           }
//                 onChange={(e) => setForm({ ...form, component_count: e.target.value })} />
