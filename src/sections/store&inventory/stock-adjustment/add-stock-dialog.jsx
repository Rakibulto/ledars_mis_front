'use client';

import { toast } from 'sonner';
import React, { useRef, useMemo, useState, useEffect } from 'react';

import {
  Box,
  Chip,
  Stack,
  Button,
  Dialog,
  Divider,
  MenuItem,
  TextField,
  IconButton,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
} from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useGetRequest, extractErrorMessage } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';

const EP = endpoints.storeInventory;
const PM = endpoints.procurement_management;

function normalizeCollection(payload) {
  if (Array.isArray(payload)) return payload;
  return Array.isArray(payload?.results) ? payload.results : [];
}

let _rowCounter = 0;
function createEmptyRow() {
  _rowCounter += 1;
  return { rowKey: `row-${Date.now()}-${_rowCounter}`, officeId: '', qty: '' };
}

export default function AddStockDialog({ open, product, onClose, onSuccess }) {
  const [rows, setRows] = useState(() => [createEmptyRow()]);
  const [submitting, setSubmitting] = useState(false);
  // officeStockMap: { [officeId]: number | null }  null = loading, number = qty
  const [officeStockMap, setOfficeStockMap] = useState({});
  const fetchedRef = useRef(new Set());

  const officesUrl = open ? `${PM.office_management}?pagination=false` : null;
  const { data: rawOffices, loading: officesLoading } = useGetRequest(officesUrl);

  const officeOptions = useMemo(
    () =>
      normalizeCollection(rawOffices)
        .filter((o) => o.type === 'office' || o.type === 'warehouse')
        .sort((a, b) =>
          String(a.name || '').localeCompare(String(b.name || ''), undefined, {
            sensitivity: 'base',
          })
        ),
    [rawOffices]
  );

  // Collect unique office IDs selected across all rows
  const selectedOfficeIds = useMemo(
    () => [...new Set(rows.filter((r) => r.officeId).map((r) => r.officeId))],
    [rows]
  );

  // Fetch location-stock record for each newly-selected office via /api/location-stocks/
  useEffect(() => {
    if (!open || !product) return;

    selectedOfficeIds.forEach((officeId) => {
      if (fetchedRef.current.has(officeId)) return;
      fetchedRef.current.add(officeId);
      setOfficeStockMap((prev) => ({ ...prev, [officeId]: null })); // null = loading

      axiosInstance
        .get(EP.location_stocks, {
          params: { product: product.id, office_location: officeId, pagination: 'false' },
        })
        .then((res) => {
          const items = Array.isArray(res.data) ? res.data : (res.data?.results ?? []);
          const match = items.find(
            (item) =>
              String(item.product) === String(product.id) &&
              String(item.office_location) === String(officeId)
          );
          setOfficeStockMap((prev) => ({
            ...prev,
            [officeId]: match
              ? { id: match.id, qty: Number(match.quantity ?? 0) }
              : { id: null, qty: 0 },
          }));
        })
        .catch(() => {
          setOfficeStockMap((prev) => ({ ...prev, [officeId]: { id: null, qty: 0 } }));
        });
    });
  }, [selectedOfficeIds, open, product]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      fetchedRef.current = new Set();
      setOfficeStockMap({});
    }
  }, [open]);

  const handleClose = () => {
    if (submitting) return;
    setRows([createEmptyRow()]);
    onClose();
  };

  const handleRowChange = (rowKey, field, value) => {
    setRows((prev) => prev.map((r) => (r.rowKey === rowKey ? { ...r, [field]: value } : r)));
  };

  const addRow = () => setRows((prev) => [...prev, createEmptyRow()]);

  const removeRow = (rowKey) => {
    if (rows.length === 1) return;
    setRows((prev) => prev.filter((r) => r.rowKey !== rowKey));
  };

  const handleSubmit = async () => {
    const validRows = rows.filter((r) => r.officeId && Number(r.qty) > 0);
    if (!validRows.length) {
      toast.error('Add at least one warehouse / office with a quantity greater than zero.');
      return;
    }

    setSubmitting(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      await axiosInstance.post(EP.stock_in_batch, {
        product: product.id,
        adjustment_date: today,
        rows: validRows.map((row) => ({
          office_location: Number(row.officeId),
          qty: Number(row.qty),
        })),
      });

      toast.success(
        validRows.length === 1
          ? 'Stock addition request submitted for approval.'
          : `${validRows.length} stock addition requests submitted for approval.`
      );
      setRows([createEmptyRow()]);
      onSuccess?.();
    } catch (err) {
      toast.error(extractErrorMessage(err?.response?.data || err));
    } finally {
      setSubmitting(false);
    }
  };

  if (!product) return null;

  const totalQty = rows.reduce((sum, r) => sum + Number(r.qty || 0), 0);

  // Set of office IDs already chosen in OTHER rows (used to exclude from each row's dropdown)
  const getUsedOfficeIds = (currentRowKey) =>
    new Set(rows.filter((r) => r.rowKey !== currentRowKey && r.officeId).map((r) => r.officeId));

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        Add Stock Request
        <Typography variant="body2" color="text.secondary" mt={0.5}>
          {product.name}
          {product.code ? ` · ${product.code}` : ''} — Current global stock:{' '}
          <strong>
            {Number(product.on_hand ?? 0)} {product.uom_name || ''}
          </strong>
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ pt: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            Specify the office / warehouse and the quantity to add. Each row creates a{' '}
            <strong>Pending Approval</strong> request — stock is not updated until an authorised
            user approves the request.
          </Typography>

          <Divider />

          <Stack spacing={2}>
            {rows.map((row, index) => {
              const usedIds = getUsedOfficeIds(row.rowKey);

              return (
                <Stack key={row.rowKey} spacing={1}>
                  <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <Box sx={{ display: 'flex', alignItems: 'center', pt: 1 }}>
                      <Typography
                        variant="caption"
                        fontWeight={700}
                        color="text.disabled"
                        sx={{ minWidth: 18 }}
                      >
                        {index + 1}
                      </Typography>
                    </Box>

                    <TextField
                      select
                      label="Office / Warehouse *"
                      size="small"
                      value={row.officeId}
                      onChange={(e) => handleRowChange(row.rowKey, 'officeId', e.target.value)}
                      disabled={officesLoading || submitting}
                      sx={{ flex: 1 }}
                      SelectProps={{ MenuProps: { PaperProps: { sx: { maxHeight: 280 } } } }}
                    >
                      <MenuItem value="">
                        {officesLoading ? 'Loading…' : 'Select Office / Warehouse'}
                      </MenuItem>
                      {officeOptions.map((o) => (
                        <MenuItem
                          key={o.id}
                          value={String(o.id)}
                          disabled={usedIds.has(String(o.id))}
                        >
                          <Stack spacing={0}>
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              color={usedIds.has(String(o.id)) ? 'text.disabled' : 'inherit'}
                            >
                              {o.name}
                              {usedIds.has(String(o.id)) && (
                                <Typography
                                  component="span"
                                  variant="caption"
                                  color="text.disabled"
                                  sx={{ ml: 1 }}
                                >
                                  (already added)
                                </Typography>
                              )}
                            </Typography>
                            {o.location && (
                              <Typography variant="caption" color="text.secondary">
                                {o.location}
                              </Typography>
                            )}
                          </Stack>
                        </MenuItem>
                      ))}
                    </TextField>

                    <TextField
                      label="Quantity *"
                      type="number"
                      size="small"
                      value={row.qty}
                      onChange={(e) => handleRowChange(row.rowKey, 'qty', e.target.value)}
                      inputProps={{ min: 1, step: 'any' }}
                      disabled={!row.officeId || submitting}
                      sx={{ width: 110 }}
                    />

                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => removeRow(row.rowKey)}
                      disabled={rows.length === 1 || submitting}
                      sx={{ mt: 0.5 }}
                    >
                      <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                    </IconButton>
                  </Stack>

                  {/* Current stock at selected office */}
                  {row.officeId && (
                    <Box sx={{ pl: 4 }}>
                      {officeStockMap[row.officeId] === null ? (
                        <Typography variant="caption" color="text.disabled">
                          Loading current stock…
                        </Typography>
                      ) : (
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="caption" color="text.secondary">
                            Current stock at this location:
                          </Typography>
                          <Chip
                            size="small"
                            label={`${officeStockMap[row.officeId]?.qty ?? 0} ${product.uom_name || ''}`}
                            color={officeStockMap[row.officeId]?.qty > 0 ? 'default' : 'warning'}
                            variant="soft"
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                        </Stack>
                      )}
                    </Box>
                  )}
                </Stack>
              );
            })}
          </Stack>

          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Button
              size="small"
              variant="outlined"
              startIcon={<Iconify icon="solar:add-circle-bold" />}
              onClick={addRow}
              disabled={submitting || rows.length >= officeOptions.length}
            >
              Add Row
            </Button>
            {totalQty > 0 && (
              <Typography variant="body2" color="text.secondary">
                Total qty:{' '}
                <strong>
                  +{totalQty} {product.uom_name || ''}
                </strong>
              </Typography>
            )}
          </Stack>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={submitting}
          startIcon={<Iconify icon="solar:clipboard-add-bold" />}
        >
          {submitting ? 'Submitting…' : 'Submit for Approval'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
