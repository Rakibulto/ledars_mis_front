'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useState } from 'react';
import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';

// MUI imports
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import { TableFooter } from '@mui/material';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import Container from '@mui/material/Container';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import TableContainer from '@mui/material/TableContainer';

import { endpoints } from 'src/utils/axios';

import {
  useGetRequest,
  usePutRequest,
  usePatchRequest,
  useDeleteRequest,
} from 'src/actions/ledars-hook';

import { ConfirmDialog } from 'src/components/custom-dialog';

import PurchaseOrderDownload from './po-pdf-button';
import AddItemsForOrderModal from './add-item-for-order-modal';

export default function PODetails() {
  const [openAddItemsModal, setOpenAddItemsModal] = useState(false);
  const deleteData = useDeleteRequest;
  const putData = usePutRequest;
  const patchData = usePatchRequest;
  const poId = new URLSearchParams(window.location.search).get('po_id');
  // console.log(poId);

  const {
    data: poDetailsData,
    loading: poDetailsLoading,
    error: poDetailsError,
  } = useGetRequest(`${endpoints.procurement.purchase_orders}${poId}/`);

  const poData = poDetailsData;
  const router = useRouter();

  // State management
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleteItemDialog, setDeleteItemDialog] = useState(false);
  const [editItemDialog, setEditItemDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Submitted':
        return { bg: '#e3f2fd', color: '#1976d2' };
      case 'Approved':
        return { bg: '#e8f5e9', color: '#2e7d32' };
      case 'Rejected':
        return { bg: '#ffebee', color: '#c62828' };
      case 'Pending':
        return { bg: '#fff3e0', color: '#f57c00' };
      default:
        return { bg: '#f5f5f5', color: '#616161' };
    }
  };

  const getStockStatusColor = (status) => {
    switch (status) {
      case 'In Stock':
        return { bg: '#e8f5e9', color: '#2e7d32' };
      case 'Low Stock':
        return { bg: '#fff3e0', color: '#f57c00' };
      case 'Out of Stock':
        return { bg: '#ffebee', color: '#c62828' };
      default:
        return { bg: '#f5f5f5', color: '#616161' };
    }
  };

  const handleEdit = () => {
    router.push(`/dashboard/procurement/purchase-orders/add-po/?edit_po=${poData?.id}`);
  };
  const handleAddItem = () => {
    router.push(
      `/dashboard/procurement/purchase-orders/add-po/?edit_po=${poData?.id}&add_items=true`
    );
  };

  const handleDelete = async () => {
    try {
      await deleteData(`${endpoints.procurement.purchase_orders}${poId}/`);
      setDeleteDialog(false);
      toast.success('Purchase Order deleted successfully');
      mutate(
        (key) => typeof key === 'string' && key.startsWith(endpoints.procurement.purchase_orders),
        undefined,
        { revalidate: true }
      );

      router.push('/dashboard/procurement/purchase-orders/');
    } catch (error) {
      toast.error('Purchase Order delete Failed!');
      setDeleteDialog(false);
    }
  };

  const handleEditItem = (item) => {
    setSelectedItem(item);
    setEditItemDialog(true);
    // console.log('Edit item:', item);
  };

  const handleDeleteItem = (item) => {
    setSelectedItem(item);
    setDeleteItemDialog(true);
  };

  const handleSaveItem = async () => {
    // console.log('Save item:', selectedItem);
    await patchData(`${endpoints.procurement.items_for_order}${selectedItem?.id}/`, selectedItem);

    mutate(`${endpoints.procurement.purchase_orders}${poId}/`);
    mutate(`${endpoints.procurement.items_for_order}${selectedItem?.id}/`);

    setEditItemDialog(false);
    toast.success('Item updated successfully (Console logged)');
  };

  const confirmDeleteItem = async () => {
    // console.log('Delete selected item:', selectedItem);
    await deleteData(`${endpoints.procurement.items_for_order}${selectedItem?.id}/`);
    mutate(`${endpoints.procurement.purchase_orders}${poId}/`);
    setDeleteItemDialog(false);
    setSelectedItem(null);
    toast.success('Item deleted successfully (Console logged)');
  };

  const statusColor = getStatusColor(poData?.approval_status);

  return (
    <Container maxWidth="2xl" sx={{ py: { xs: 2, sm: 3, md: 4 } }}>
      {/* Header Section */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: { xs: 2, md: 4 } }}
      >
        <Box>
          <Typography
            variant="h4"
            fontWeight={700}
            gutterBottom
            sx={{
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' },
            }}
          >
            Purchase Order Details
          </Typography>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
          >
            <Typography variant="h6" color="primary" fontWeight={600}>
              {poData?.po_number}
            </Typography>
            <Chip
              label={poData?.approval_status}
              size="medium"
              sx={{
                bgcolor: statusColor.bg,
                color: statusColor.color,
                fontWeight: 600,
                borderRadius: '16px',
                px: 1,
                ':hover': {
                  backgroundColor: 'transparent',
                },
              }}
            />
          </Stack>
        </Box>

        <Stack
          direction="row"
          sx={{ justifyContent: 'space-between', alignContent: 'center', alignItems: 'center' }}
          spacing={1.5}
          flexWrap="wrap"
        >
          <Button
            variant="outlined"
            startIcon={<Icon icon="solar:add-circle-bold" width={20} />}
            onClick={() => setOpenAddItemsModal(true)}
            sx={{
              borderRadius: 2,
              px: { xs: 2, sm: 3 },
              textTransform: 'none',
              fontWeight: 600,
              borderWidth: 2,
              '&:hover': {
                borderWidth: 2,
                backgroundColor: 'primary.lighter',
              },
            }}
          >
            Add items
          </Button>
          <Button
            variant="outlined"
            startIcon={<Icon icon="solar:pen-bold" width={20} />}
            onClick={handleEdit}
            sx={{
              borderRadius: 2,
              px: { xs: 2, sm: 3 },
              textTransform: 'none',
              fontWeight: 600,
              borderWidth: 2,
              '&:hover': {
                borderWidth: 2,
                backgroundColor: 'primary.lighter',
              },
            }}
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<Icon icon="solar:trash-bin-trash-bold" width={20} />}
            onClick={() => setDeleteDialog(true)}
            sx={{
              borderRadius: 2,
              px: { xs: 2, sm: 3 },
              textTransform: 'none',
              fontWeight: 600,
              borderWidth: 2,
              '&:hover': {
                borderWidth: 2,
                backgroundColor: 'error.lighter',
              },
            }}
          >
            Delete
          </Button>
          <Box>
            <PurchaseOrderDownload data={poData} />
          </Box>
        </Stack>
      </Stack>

      {/* PR Summary Section */}
      <Card
        sx={{
          p: { xs: 2, sm: 3 },
          mb: 3,
          borderRadius: 3,
          boxShadow: '0 0 24px rgba(145, 158, 171, 0.12)',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <Icon icon="solar:document-text-bold-duotone" width={28} style={{ color: '#2563eb' }} />
          <Typography variant="h6" fontWeight={700}>
            Order Summary
          </Typography>
        </Stack>
        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                bgcolor: '#f8fafc',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Stack spacing={0.75}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={600}
                  textTransform="uppercase"
                >
                  PO Number
                </Typography>
                <Typography variant="body1" fontWeight={700} color="primary.main">
                  {poData?.po_number}
                </Typography>
              </Stack>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                bgcolor: '#f8fafc',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Stack spacing={0.75}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={600}
                  textTransform="uppercase"
                >
                  Approval Status
                </Typography>
                <Box>
                  <Chip
                    label={poData?.approval_status}
                    size="small"
                    sx={{
                      bgcolor: statusColor.bg,
                      color: statusColor.color,
                      fontWeight: 600,
                      borderRadius: '12px',
                    }}
                  />
                </Box>
              </Stack>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                bgcolor: '#f8fafc',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Stack spacing={0.75}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={600}
                  textTransform="uppercase"
                >
                  Supplier
                </Typography>
                <Typography variant="body1" fontWeight={700}>
                  {poData?.supplier_name}
                </Typography>
              </Stack>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                bgcolor: '#f8fafc',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Stack spacing={0.75}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={600}
                  textTransform="uppercase"
                >
                  Delivery Date
                </Typography>
                <Typography variant="body1" fontWeight={700}>
                  {new Date(poData?.delivery_date)?.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </Typography>
              </Stack>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                bgcolor: '#f8fafc',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Stack spacing={0.75}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={600}
                  textTransform="uppercase"
                >
                  Created By
                </Typography>
                <Typography variant="body1" fontWeight={700}>
                  {poData?.created_by?.employee_name || '--'}
                </Typography>
              </Stack>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                bgcolor: '#f8fafc',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Stack spacing={0.75}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={600}
                  textTransform="uppercase"
                >
                  Created Date
                </Typography>
                <Typography variant="body1" fontWeight={700}>
                  {new Date(poData?.created_at)?.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </Typography>
              </Stack>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                bgcolor: '#f8fafc',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Stack spacing={0.75}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={600}
                  textTransform="uppercase"
                >
                  Item Count
                </Typography>
                <Typography variant="body1" fontWeight={700}>
                  {poData?.item_count}
                </Typography>
              </Stack>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                bgcolor: 'primary.lighter',
                borderRadius: 2,
                border: '2px solid',
                borderColor: 'primary.main',
              }}
            >
              <Stack spacing={0.75}>
                <Typography
                  variant="caption"
                  color="primary.dark"
                  fontWeight={600}
                  textTransform="uppercase"
                >
                  Total Amount
                </Typography>
                <Typography variant="h6" fontWeight={800} color="primary.darker">
                  ${poData?.total_amount?.toLocaleString()}
                </Typography>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Card>

      {/* Items Section */}
      <Card
        sx={{
          borderRadius: 3,
          boxShadow: '0 0 24px rgba(145, 158, 171, 0.12)',
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ p: { xs: 2, sm: 3 }, pb: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Icon icon="solar:box-bold-duotone" width={28} style={{ color: '#2563eb' }} />
            <Typography variant="h6" fontWeight={700}>
              Ordered Items
            </Typography>
          </Stack>
        </Box>
        <Divider />

        <TableContainer sx={{ overflow: 'auto' }}>
          <Table sx={{ minWidth: { xs: 800, md: 1000 } }}>
            <TableHead>
              <TableRow
                sx={{
                  bgcolor: 'grey.100',
                  '& th': {
                    fontWeight: 700,
                    color: 'text.primary',
                    py: 2,
                    fontSize: '0.875rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  },
                }}
              >
                <TableCell>Item Code</TableCell>
                <TableCell>Item Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="center">Stock</TableCell>
                <TableCell align="center">Unit</TableCell>
                <TableCell align="right">Unit Price</TableCell>
                <TableCell align="center">Quantity</TableCell>
                <TableCell align="right">Total Price</TableCell>
                <TableCell align="center" sx={{ minWidth: 100 }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {poData?.po_items?.map((item, index) => {
                const stockColor = getStockStatusColor(item?.stock_status);
                const itemStatusColor = getStatusColor(item?.status);

                return (
                  <TableRow
                    key={`${item?.id || 'item'}-${index}`}
                    sx={{
                      '&:hover': {
                        bgcolor: 'action.hover',
                        '& .action-buttons': {
                          opacity: 1,
                        },
                      },
                      transition: 'all 0.2s',
                      '& td': {
                        py: 2,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                      },
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={700} color="primary.main">
                        {item?.item_code}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {item?.item_name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight={600} color="text.primary">
                          {item?.category}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item?.subcategory}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={item?.current_stock}
                        size="small"
                        sx={{
                          bgcolor: stockColor.bg,
                          color: stockColor.color,
                          fontWeight: 700,
                          minWidth: 60,
                          ':hover': {
                            backgroundColor: 'transparent',
                          },
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" color="text.secondary" fontWeight={600}>
                        <Chip
                          label={item?.unit}
                          size="small"
                          sx={{
                            bgcolor: stockColor.bg,
                            color: stockColor.color,
                            fontWeight: 700,
                            minWidth: 60,
                            ':hover': {
                              backgroundColor: 'transparent',
                            },
                          }}
                        />
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={700}>
                        ${item?.unit_price}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" fontWeight={700} color="primary.main">
                        {item?.quantity}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={800} color="success.main">
                        ${item?.total_price}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Stack
                        direction="row"
                        spacing={0.5}
                        justifyContent="center"
                        className="action-buttons"
                        sx={{
                          opacity: { xs: 1, md: 0.6 },
                          transition: 'opacity 0.2s',
                        }}
                      >
                        <Tooltip title="Edit Item" placement="top">
                          <IconButton
                            size="small"
                            onClick={() => handleEditItem(item)}
                            sx={{
                              color: 'primary.main',
                              bgcolor: 'primary.lighter',
                              '&:hover': {
                                bgcolor: 'primary.light',
                                transform: 'scale(1.1)',
                              },
                              transition: 'all 0.2s',
                            }}
                          >
                            <Icon icon="solar:pen-bold" width={18} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Item" placement="top">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteItem(item)}
                            sx={{
                              color: 'error.main',
                              bgcolor: 'error.lighter',
                              '&:hover': {
                                bgcolor: 'error.light',
                                transform: 'scale(1.1)',
                              },
                              transition: 'all 0.2s',
                            }}
                          >
                            <Icon icon="solar:trash-bin-trash-bold" width={18} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            <TableFooter>
              <TableRow align="right">
                <TableCell align="right" colSpan={8} sx={{ marginRight: 6 }}>
                  <Typography variant="body2" fontWeight={800}>
                    {`Total Price : $${poData?.total_amount?.toLocaleString()}`}
                  </Typography>
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>

        {poData?.po_items?.length === 0 && (
          <Box sx={{ p: { xs: 4, sm: 6 }, textAlign: 'center' }}>
            <Icon
              icon="solar:box-minimalistic-bold-duotone"
              width={80}
              style={{ color: '#cbd5e1', marginBottom: 16 }}
            />
            <Typography variant="h6" color="text.secondary" fontWeight={600}>
              No items found
            </Typography>
            <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
              Add items to this purchase order
            </Typography>
          </Box>
        )}
      </Card>

      {/* Delete PR Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialog}
        onClose={() => setDeleteDialog(false)}
        title="Delete Purchase Order"
        content={`Are you sure you want to delete ${poData?.po_number}? This action cannot be undone.`}
        action={
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Delete
          </Button>
        }
      />

      {/* Delete Item Confirmation Dialog */}
      <ConfirmDialog
        open={deleteItemDialog}
        onClose={() => {
          setDeleteItemDialog(false);
          setSelectedItem(null);
        }}
        title="Delete Item"
        content={`Are you sure you want to delete "${selectedItem?.item_name}"? This action cannot be undone.`}
        action={
          <Button
            variant="contained"
            color="error"
            onClick={confirmDeleteItem}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Delete Item
          </Button>
        }
      />

      {/* Edit Item Modal */}
      <Dialog
        open={editItemDialog}
        onClose={() => setEditItemDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
          },
        }}
      >
        <DialogTitle
          sx={{
            pb: 2,
            pt: 3,
            px: 3,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'primary.lighter',
              }}
            >
              <Icon icon="solar:pen-bold-duotone" width={28} style={{ color: '#2563eb' }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={700}>
                Edit Item
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Update item Quantity
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ p: 3 }}>
          <TextField
            fullWidth
            label="Quantity"
            type="number"
            value={selectedItem?.quantity || ''}
            onChange={(e) => setSelectedItem({ ...selectedItem, quantity: e.target.value })}
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />
        </DialogContent>

        <Divider />

        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button
            onClick={() => setEditItemDialog(false)}
            variant="outlined"
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 2,
              px: 3,
              borderWidth: 2,
              '&:hover': {
                borderWidth: 2,
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveItem}
            variant="contained"
            startIcon={<Icon icon="solar:check-circle-bold" width={20} />}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 2,
              px: 3,
              boxShadow: '0 8px 16px 0 rgba(37, 99, 235, 0.24)',
            }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
      <AddItemsForOrderModal
        po_number={poData?.po_number}
        onClose={() => setOpenAddItemsModal(false)}
        onOpen={openAddItemsModal}
      />
    </Container>
  );
}
