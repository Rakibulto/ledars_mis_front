'use client';

import { z } from 'zod';
import { mutate } from 'swr';
import { toast } from 'sonner';
import { useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Edit, Lock, Plus, Trash2 } from 'lucide-react';

import {
  Grid,
  Stack,
  Dialog,
  Select,
  Tooltip,
  MenuItem,
  TextField,
  IconButton,
  InputLabel,
  DialogTitle,
  FormControl,
  DialogActions,
  DialogContent,
  FormHelperText,
  CircularProgress,
} from '@mui/material';

import axios, { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { ConfirmDialog } from 'src/components/custom-dialog';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardBody, CardHeader } from '../../components/ui/card';

// ── Endpoints ─────────────────────────────────────────────────────────────────
const FY_URL = endpoints.procurement_management.fiscal_years;
const FY_BY_ID = (id) => endpoints.procurement_management.fiscal_year_by_id(id);
const FY_CHANGE_STATUS = (id) => endpoints.procurement_management.fiscal_year_change_status(id);
const FY_PERIODS = (id) => endpoints.procurement_management.fiscal_year_periods(id);
const PERIOD_CLOSE = (id) => endpoints.procurement_management.accounting_period_close(id);
const PERIOD_REOPEN = (id) => endpoints.procurement_management.accounting_period_reopen(id);

// ── Zod Schema ────────────────────────────────────────────────────────────────
const fySchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    start_date: z.string().min(1, 'Start date is required'),
    end_date: z.string().min(1, 'End date is required'),
    total_budget: z.coerce.number().min(0).default(0),
    description: z.string().optional().or(z.literal('')),
    status: z.enum(['draft', 'active', 'closed']).default('draft'),
  })
  .refine((d) => new Date(d.end_date) > new Date(d.start_date), {
    message: 'End date must be after start date',
    path: ['end_date'],
  });

const defaultValues = {
  name: '',
  start_date: '',
  end_date: '',
  total_budget: 0,
  description: '',
  status: 'draft',
};

// ── Status badge ──────────────────────────────────────────────────────────────
const statusBadge = (s) => {
  switch (s) {
    case 'active':
      return <Badge variant="success">Active</Badge>;
    case 'closed':
      return <Badge variant="default">Closed</Badge>;
    case 'draft':
      return <Badge variant="info">Draft</Badge>;
    case 'open':
      return (
        <Badge variant="success" size="sm">
          Open
        </Badge>
      );
    default:
      return (
        <Badge variant="default" size="sm">
          {s}
        </Badge>
      );
  }
};

export function FiscalYearSettings() {
  const [selectedFY, setSelectedFY] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingFY, setEditingFY] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, name: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusLoading, setStatusLoading] = useState(null); // id of FY being status-changed
  const [periodLoading, setPeriodLoading] = useState(null); // id of period being toggled

  // ── Fetch all fiscal years ─────────────────────────────────────────────────
  const { data: fyRaw, loading: fyLoading } = useGetRequest(FY_URL);
  const fiscalYears = useMemo(
    () => (Array.isArray(fyRaw) ? fyRaw : Array.isArray(fyRaw?.results) ? fyRaw.results : []),
    [fyRaw]
  );

  // ── Auto-select first FY when data loads ──────────────────────────────────
  const selectedFYObj = useMemo(() => {
    if (selectedFY) return fiscalYears.find((f) => f.id === selectedFY) ?? null;
    return fiscalYears.find((f) => f.status === 'active') ?? fiscalYears[0] ?? null;
  }, [fiscalYears, selectedFY]);

  // ── Fetch periods for selected FY ─────────────────────────────────────────
  const periodsUrl = selectedFYObj ? FY_PERIODS(selectedFYObj.id) : null;
  const { data: periodsRaw, loading: periodsLoading } = useGetRequest(periodsUrl);
  const periods = useMemo(() => (Array.isArray(periodsRaw) ? periodsRaw : []), [periodsRaw]);

  // ── React Hook Form ───────────────────────────────────────────────────────
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(fySchema), defaultValues });

  // ── Dialog handlers ───────────────────────────────────────────────────────
  const handleOpenCreate = () => {
    setEditingFY(null);
    reset(defaultValues);
    setOpenDialog(true);
  };

  const handleOpenEdit = (fy) => {
    setEditingFY(fy);
    reset({
      name: fy.name || '',
      start_date: fy.start_date || '',
      end_date: fy.end_date || '',
      total_budget: Number(fy.total_budget) || 0,
      description: fy.description || '',
      status: fy.status || 'draft',
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    if (isSubmitting) return;
    setOpenDialog(false);
    setEditingFY(null);
    reset(defaultValues);
  };

  // ── Submit (create or update) ─────────────────────────────────────────────
  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const payload = {
        name: data.name,
        start_date: data.start_date,
        end_date: data.end_date,
        total_budget: Number(data.total_budget),
        description: data.description || '',
        status: data.status,
      };
      if (editingFY) {
        await axios.patch(FY_BY_ID(editingFY.id), payload);
        toast.success('Fiscal year updated successfully');
      } else {
        const res = await axios.post(FY_URL, payload);
        // Auto-select the newly created FY
        if (res.data?.id) setSelectedFY(res.data.id);
        toast.success('Fiscal year created with 12 accounting periods');
      }
      await mutate(FY_URL);
      handleCloseDialog();
    } catch (error) {
      const detail = error?.response?.data || error;
      const msg =
        typeof detail === 'string'
          ? detail
          : Object.values(detail || {})
              .flat()
              .join(', ') || 'Something went wrong';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Delete FY ─────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await axios.delete(FY_BY_ID(deleteConfirm.id));
      toast.success('Fiscal year deleted');
      await mutate(FY_URL);
      if (selectedFY === deleteConfirm.id) setSelectedFY(null);
      setDeleteConfirm({ open: false, id: null, name: '' });
    } catch {
      toast.error('Failed to delete fiscal year');
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Change FY status ──────────────────────────────────────────────────────
  const handleChangeStatus = async (fy, newStatus) => {
    setStatusLoading(fy.id);
    try {
      await axios.patch(FY_CHANGE_STATUS(fy.id), { status: newStatus });
      toast.success(`Status changed to ${newStatus}`);
      await mutate(FY_URL);
    } catch {
      toast.error('Failed to change status');
    } finally {
      setStatusLoading(null);
    }
  };

  // ── Close / Reopen a period ───────────────────────────────────────────────
  const handlePeriodToggle = async (period) => {
    setPeriodLoading(period.id);
    try {
      if (period.status === 'open') {
        await axios.patch(PERIOD_CLOSE(period.id));
        toast.success(`${period.month} closed`);
      } else {
        await axios.patch(PERIOD_REOPEN(period.id));
        toast.success(`${period.month} reopened`);
      }
      await mutate(periodsUrl);
      await mutate(FY_URL);
    } catch {
      toast.error('Failed to update period');
    } finally {
      setPeriodLoading(null);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground mb-1">
            Fiscal Year Management
          </h1>
          <p className="text-muted-foreground text-sm">
            Configure fiscal years and manage accounting periods
          </p>
        </div>
        <Button variant="primary" onClick={handleOpenCreate}>
          <Plus className="w-4 h-4 mr-2" />
          New Fiscal Year
        </Button>
      </div>

      {/* Fiscal Years Cards */}
      {fyLoading && (
        <div className="flex justify-center py-8">
          <CircularProgress size={28} />
        </div>
      )}
      {!fyLoading && fiscalYears.length === 0 && (
        <Card className="mb-6">
          <CardBody>
            <p className="text-center text-muted-foreground py-6">
              No fiscal years yet. Create one to get started.
            </p>
          </CardBody>
        </Card>
      )}

      {!fyLoading && fiscalYears.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {fiscalYears.map((fy) => (
            <div
              key={fy.id}
              className={`cursor-pointer ${selectedFYObj?.id === fy.id ? 'ring-2 ring-primary rounded-lg' : ''}`}
              onClick={() => setSelectedFY(fy.id)}
            >
              <Card hover>
                <CardBody>
                  {/* Card header row */}
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <h3 className="text-base font-semibold text-foreground leading-tight">
                      {fy.name}
                    </h3>
                    <div className="flex items-center gap-1 shrink-0">{statusBadge(fy.status)}</div>
                  </div>

                  {/* Dates + budget */}
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div>
                      <span className="text-xs text-muted-foreground">Start</span>
                      <p className="font-medium">{fy.start_date}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">End</span>
                      <p className="font-medium">{fy.end_date}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Budget</span>
                      <p className="font-medium">
                        ৳{(Number(fy.total_budget) / 1000000).toFixed(1)}M
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Spent</span>
                      <p className="font-medium">৳{(Number(fy.spent) / 1000000).toFixed(1)}M</p>
                    </div>
                  </div>

                  {/* Period progress for active */}
                  {fy.status === 'active' && (
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Period Progress</span>
                        <span>
                          {fy.closed_periods}/{fy.periods}
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary rounded-full h-2 transition-all"
                          style={{
                            width: `${fy.periods > 0 ? (fy.closed_periods / fy.periods) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div
                    className="flex flex-wrap gap-1 pt-2 border-t border-border"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Status change */}
                    {fy.status !== 'active' && (
                      <Tooltip title="Set as Active">
                        <button
                          type="button"
                          disabled={statusLoading === fy.id}
                          onClick={() => handleChangeStatus(fy, 'active')}
                          className="text-xs px-2 py-1 rounded bg-success/10 text-success hover:bg-success/20 transition-colors disabled:opacity-50"
                        >
                          {statusLoading === fy.id ? '...' : 'Activate'}
                        </button>
                      </Tooltip>
                    )}
                    {fy.status === 'active' && (
                      <Tooltip title="Close this fiscal year">
                        <button
                          type="button"
                          disabled={statusLoading === fy.id}
                          onClick={() => handleChangeStatus(fy, 'closed')}
                          className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground hover:bg-border transition-colors disabled:opacity-50"
                        >
                          {statusLoading === fy.id ? '...' : 'Close FY'}
                        </button>
                      </Tooltip>
                    )}
                    {fy.status === 'closed' && (
                      <Tooltip title="Revert to Draft">
                        <button
                          type="button"
                          disabled={statusLoading === fy.id}
                          onClick={() => handleChangeStatus(fy, 'draft')}
                          className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground hover:bg-border transition-colors disabled:opacity-50"
                        >
                          {statusLoading === fy.id ? '...' : 'Reopen'}
                        </button>
                      </Tooltip>
                    )}

                    {/* Edit */}
                    <Tooltip title="Edit">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(fy)}
                        className="p-1.5 hover:bg-muted rounded transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5 text-primary" />
                      </button>
                    </Tooltip>

                    {/* Delete */}
                    <Tooltip title="Delete">
                      <button
                        type="button"
                        onClick={() => setDeleteConfirm({ open: true, id: fy.id, name: fy.name })}
                        className="p-1.5 hover:bg-muted rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-error" />
                      </button>
                    </Tooltip>
                  </div>
                </CardBody>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Accounting Periods Table */}
      {selectedFYObj && (
        <Card>
          <CardHeader
            title={`Accounting Periods — ${selectedFYObj.name}`}
            description="Monthly period management"
          />
          <CardBody>
            {periodsLoading ? (
              <div className="flex justify-center py-8">
                <CircularProgress size={24} />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px]">
                  <thead className="border-b-2 border-border">
                    <tr className="text-left">
                      <th className="pb-3 text-xs font-semibold text-foreground uppercase pr-3">
                        Period
                      </th>
                      <th className="pb-3 text-xs font-semibold text-foreground uppercase text-center pr-3">
                        Status
                      </th>
                      <th className="pb-3 text-xs font-semibold text-foreground uppercase pr-3 hidden sm:table-cell">
                        Closed Date
                      </th>
                      <th className="pb-3 text-xs font-semibold text-foreground uppercase pr-3 hidden md:table-cell">
                        Closed By
                      </th>
                      <th className="pb-3 text-xs font-semibold text-foreground uppercase text-center">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {periods.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-muted-foreground text-sm">
                          No periods found.
                        </td>
                      </tr>
                    )}
                    {periods.map((p, idx) => {
                      const isLast =
                        p.status === 'closed' &&
                        idx === periods.filter((pp) => pp.status === 'closed').length - 1;
                      const isLoading = periodLoading === p.id;
                      return (
                        <tr key={p.id} className="border-b border-border">
                          <td className="py-3 pr-3 text-sm font-medium text-foreground">
                            {p.month}
                          </td>
                          <td className="py-3 pr-3 text-center">
                            {p.status === 'closed' ? (
                              <Badge variant="default" size="sm">
                                <Lock className="w-3 h-3 mr-1 inline" />
                                Closed
                              </Badge>
                            ) : (
                              <Badge variant="success" size="sm">
                                Open
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 pr-3 text-sm text-muted-foreground hidden sm:table-cell">
                            {p.closed_date_display || '—'}
                          </td>
                          <td className="py-3 pr-3 text-sm text-muted-foreground hidden md:table-cell">
                            {p.closed_by_name || '—'}
                          </td>
                          <td className="py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {p.status === 'open' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handlePeriodToggle(p)}
                                  disabled={isLoading}
                                >
                                  {isLoading ? (
                                    <CircularProgress size={12} color="inherit" sx={{ mr: 0.5 }} />
                                  ) : (
                                    <Lock className="w-3.5 h-3.5 mr-1" />
                                  )}
                                  Close Period
                                </Button>
                              )}
                              {isLast && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs"
                                  onClick={() => handlePeriodToggle(p)}
                                  disabled={isLoading}
                                >
                                  {isLoading ? (
                                    <CircularProgress size={12} color="inherit" sx={{ mr: 0.5 }} />
                                  ) : null}
                                  Reopen
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* ── Create / Edit Dialog ─────────────────────────────────────────────── */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            {editingFY ? 'Edit Fiscal Year' : 'New Fiscal Year'}
            <IconButton onClick={handleCloseDialog} size="small" disabled={isSubmitting}>
              <X size={16} />
            </IconButton>
          </DialogTitle>

          <DialogContent dividers>
            <Stack spacing={2.5} sx={{ pt: 1 }}>
              {/* Name */}
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Fiscal Year Name *"
                    fullWidth
                    size="small"
                    placeholder="e.g. FY 2025-2026"
                    error={!!errors.name}
                    helperText={errors.name?.message}
                  />
                )}
              />

              {/* Start + End dates */}
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Controller
                    name="start_date"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Start Date *"
                        type="date"
                        fullWidth
                        size="small"
                        slotProps={{ inputLabel: { shrink: true } }}
                        error={!!errors.start_date}
                        helperText={errors.start_date?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Controller
                    name="end_date"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="End Date *"
                        type="date"
                        fullWidth
                        size="small"
                        slotProps={{ inputLabel: { shrink: true } }}
                        error={!!errors.end_date}
                        helperText={errors.end_date?.message}
                      />
                    )}
                  />
                </Grid>
              </Grid>

              {/* Total Budget */}
              <Controller
                name="total_budget"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Total Budget (৳)"
                    type="number"
                    fullWidth
                    size="small"
                    inputProps={{ min: 0, step: '0.01' }}
                    error={!!errors.total_budget}
                    helperText={errors.total_budget?.message}
                  />
                )}
              />

              {/* Status */}
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth size="small" error={!!errors.status}>
                    <InputLabel>Status</InputLabel>
                    <Select {...field} label="Status">
                      <MenuItem value="draft">Draft</MenuItem>
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="closed">Closed</MenuItem>
                    </Select>
                    {errors.status && <FormHelperText>{errors.status.message}</FormHelperText>}
                  </FormControl>
                )}
              />

              {/* Description */}
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Description"
                    fullWidth
                    multiline
                    rows={2}
                    size="small"
                    error={!!errors.description}
                    helperText={errors.description?.message}
                  />
                )}
              />

              {!editingFY && (
                <p className="text-xs text-muted-foreground bg-muted px-3 py-2 rounded">
                  12 monthly accounting periods will be generated automatically.
                </p>
              )}
            </Stack>
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
            <Button
              variant="outline"
              type="button"
              onClick={handleCloseDialog}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} /> : null}
              {editingFY ? 'Save Changes' : 'Create Fiscal Year'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ── Delete Confirm ───────────────────────────────────────────────────── */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, id: null, name: '' })}
        title="Delete Fiscal Year"
        content={`Are you sure you want to delete "${deleteConfirm.name}"? All accounting periods will also be deleted. This cannot be undone.`}
        action={
          <Button variant="primary" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} /> : null}
            Delete
          </Button>
        }
      />
    </div>
  );
}
