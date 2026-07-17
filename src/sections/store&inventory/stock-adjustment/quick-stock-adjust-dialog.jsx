'use client';

import { toast } from 'sonner';
import React, { useState } from 'react';

import {
  Box,
  Alert,
  Stack,
  Button,
  Dialog,
  MenuItem,
  TextField,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
} from '@mui/material';

import { endpoints } from 'src/utils/axios';

import { extractErrorMessage, useCreateRequest as createRequest } from 'src/actions/ledars-hook';

const EP = endpoints.storeInventory;

/**
 * QuickStockAdjustDialog
 *
 * approveMode=false  → creates a "Pending Approval" stock adjustment request (no immediate stock change)
 * approveMode=true   → creates an "Approved" adjustment directly (immediately updates global stock)
 */
export default function QuickStockAdjustDialog({
  open,
  product,
  warehouses = [],
  warehousesLoading = false,
  approveMode = false,
  onClose,
  onSuccess,
}) {
  const [warehouseId, setWarehouseId] = useState('');
  const [qty, setQty] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    if (submitting) return;
    setWarehouseId('');
    setQty('');
    onClose();
  };

  const handleSubmit = async () => {
    if (!warehouseId) {
      toast.error('Please select a warehouse.');
      return;
    }

    const amount = Number(qty);
    if (!amount || amount <= 0) {
      toast.error('Enter a valid quantity greater than zero.');
      return;
    }

    const systemQty = Number(product?.on_hand ?? 0);

    if (!approveMode && amount < 0 && systemQty + amount < 0) {
      toast.error('Stock cannot go below zero.');
      return;
    }

    setSubmitting(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const countedQty = systemQty + amount;
      const status = approveMode ? 'Approved' : 'Pending Approval';
      const reason = approveMode ? 'Direct stock approval' : 'Quick stock addition request';

      await createRequest(EP.stock_adjustments, {
        adjustment_date: today,
        adjustment_type: 'Increase',
        reason,
        status,
        warehouse: Number(warehouseId),
        lines: [
          {
            product: product.id,
            item_code: product.code,
            item_name: product.name,
            system_qty: systemQty,
            counted_qty: countedQty,
            difference: amount,
            unit: product.uom_name || product.uom_code || 'Unit',
            unit_price: Number(product.cost ?? 0),
            reason,
          },
        ],
      });

      toast.success(
        approveMode
          ? 'Stock approved and applied successfully.'
          : 'Stock request submitted for approval.'
      );
      setWarehouseId('');
      setQty('');
      onSuccess?.(approveMode ? amount : 0);
    } catch (err) {
      toast.error(extractErrorMessage(err?.response?.data || err));
    } finally {
      setSubmitting(false);
    }
  };

  if (!product) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        {approveMode ? 'Approve & Apply Stock' : 'Add Stock Request'}
        <Typography variant="body2" color="text.secondary" mt={0.25}>
          {product.name}
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {approveMode && (
            <Alert severity="warning" sx={{ borderRadius: 1.5 }}>
              This will immediately update the product’s stock quantity after confirmation.
            </Alert>
          )}

          <TextField
            select
            autoFocus
            fullWidth
            label="Warehouse"
            size="small"
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value)}
            disabled={warehousesLoading}
            helperText="Select the warehouse this stock belongs to"
          >
            <MenuItem value="">Select Warehouse</MenuItem>
            {warehouses.map((wh) => (
              <MenuItem key={wh.id} value={String(wh.id)}>
                {wh.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            label="Quantity to Add"
            type="number"
            size="small"
            inputProps={{ min: 1, step: 'any' }}
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            disabled={!warehouseId}
            helperText={
              <Box component="span">
                Current global stock:{' '}
                <strong>
                  {Number(product?.on_hand ?? 0)} {product.uom_name || ''}
                </strong>
              </Box>
            }
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color={approveMode ? 'success' : 'primary'}
          onClick={handleSubmit}
          disabled={submitting || !qty || !warehouseId}
        >
          {submitting ? 'Saving…' : approveMode ? 'Confirm & Apply Stock' : 'Submit Request'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
