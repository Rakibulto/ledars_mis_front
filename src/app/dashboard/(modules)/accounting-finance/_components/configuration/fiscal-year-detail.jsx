'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { Iconify } from 'src/components/iconify';
import { toast } from 'sonner';

import { useFiscalYearApi } from './use-fiscal-year-api';

function DetailRow({ label, value }) {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="flex-start"
      spacing={2}
      sx={{ py: 1.25, borderBottom: '1px solid', borderColor: 'divider' }}
    >
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 180 }}>
        {label}
      </Typography>
      <Box textAlign="right">
        {typeof value === 'string' || typeof value === 'number' ? (
          <Typography variant="body2" fontWeight={500}>
            {value ?? '—'}
          </Typography>
        ) : (
          (value ?? (
            <Typography variant="body2" fontWeight={500}>
              —
            </Typography>
          ))
        )}
      </Box>
    </Stack>
  );
}

export default function FiscalYearDetail() {
  const router = useRouter();
  const { id } = useParams();
  const workspace = useFiscalYearApi();
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    start_date: '',
    end_date: '',
    status: 'draft',
  });

  const year = useMemo(
    () => workspace.fiscalYears.find((y) => String(y.id) === String(id)),
    [workspace.fiscalYears, id]
  );

  const handleOpenEditDialog = () => {
    setForm({
      name: year.name || '',
      start_date: year.start_date || '',
      end_date: year.end_date || '',
      status: year.status || 'draft',
    });
    setEditOpen(true);
  };

  const handleUpdate = async () => {
    try {
      await workspace.actions.updateFiscalYear(year.id, form);
      setEditOpen(false);
      toast.success('Fiscal year updated');
    } catch (error) {
      toast.error(error?.message || 'Failed to update fiscal year');
    }
  };

  if (workspace.loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" height={60} sx={{ mb: 2, borderRadius: 2 }} />
        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
      </Box>
    );
  }

  if (!year) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Fiscal year not found.
        </Typography>
        <Button
          sx={{ mt: 2 }}
          startIcon={<Iconify icon="solar:arrow-left-bold" />}
          onClick={() => router.back()}
        >
          Back
        </Button>
      </Box>
    );
  }

  const statusColor =
    year.status === 'open' ? 'success' : year.status === 'closed' ? 'error' : 'default';

  return (
    <Box sx={{ p: 3 }}>
      {/* Breadcrumb */}
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
        <Button
          size="small"
          variant="outlined"
          color="inherit"
          startIcon={<Iconify icon="solar:arrow-left-bold" />}
          onClick={() => router.back()}
        >
          Back
        </Button>
        <Typography variant="body2" color="text.secondary">
          /
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Fiscal Years
        </Typography>
        <Typography variant="body2" color="text.secondary">
          /
        </Typography>
        <Typography variant="body2" fontWeight={600}>
          {year.name}
        </Typography>
      </Stack>

      {/* Title row */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        alignItems={{ md: 'center' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Typography variant="h4" fontWeight={700}>
              {year.name}
            </Typography>
            <Chip
              label={year.status}
              size="small"
              color={statusColor}
              sx={{ textTransform: 'capitalize' }}
            />
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {year.lifecycleState}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button variant="outlined" onClick={handleOpenEditDialog}>
            Edit
          </Button>
          {!year.totalPeriods && (
            <Button
              variant="outlined"
              onClick={() => workspace.actions.generateFiscalPeriods(year.id)}
            >
              Generate Periods
            </Button>
          )}
          {year.status === 'draft' ?(
            <Button
              variant="contained"
              color="success"
              onClick={() => workspace.actions.reopenFiscalYear(year.id)}
            >
              Open Year
            </Button>
          ) : year.status === 'open' ? (
            <Button
              variant="contained"
              color="warning"
              onClick={() => workspace.actions.closeFiscalYear(year.id)}
            >
              Close Year
            </Button>
          ) : (
            <Button
              variant="contained"
              color="success"
              onClick={() => workspace.actions.reopenFiscalYear(year.id)}
            >
              Open Year
            </Button>
          )}
        </Stack>
      </Stack>

      {/* Metric cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 3 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Total Periods
              </Typography>
              <Typography variant="h5" fontWeight={800}>
                {year.totalPeriods}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                generated periods
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Closed Periods
              </Typography>
              <Typography variant="h5" fontWeight={800}>
                {year.closedPeriods}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                of {year.totalPeriods}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Close Readiness
              </Typography>
              <Typography variant="body1" fontWeight={700}>
                {year.closeReadiness}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Next Action
              </Typography>
              <Typography variant="body1" fontWeight={700}>
                {year.nextAction}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardHeader
              title="Fiscal Year Identity"
              titleTypographyProps={{ variant: 'subtitle1', fontWeight: 700 }}
            />
            <Divider />
            <CardContent sx={{ pt: 0 }}>
              <DetailRow label="ID" value={year.id} />
              <DetailRow label="Name" value={year.name} />
              <DetailRow label="Code" value={year.code} />
              <DetailRow
                label="Start Date"
                value={new Date(year.start_date).toLocaleDateString()}
              />
              <DetailRow label="End Date" value={new Date(year.end_date).toLocaleDateString()} />
              <DetailRow
                label="Status"
                value={
                  <Chip
                    label={year.status}
                    size="small"
                    color={statusColor}
                    sx={{ textTransform: 'capitalize' }}
                  />
                }
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardHeader
              title="Lifecycle & Governance"
              titleTypographyProps={{ variant: 'subtitle1', fontWeight: 700 }}
            />
            <Divider />
            <CardContent sx={{ pt: 0 }}>
              <DetailRow label="Lifecycle State" value={year.lifecycleState} />
              <DetailRow label="Close Readiness" value={year.closeReadiness} />
              <DetailRow label="Next Action" value={year.nextAction} />
              <DetailRow label="Reopen Policy" value={year.reopenPolicy} />
              <DetailRow label="Total Periods" value={year.totalPeriods} />
              <DetailRow label="Closed Periods" value={year.closedPeriods} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit fiscal year</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Name"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              fullWidth
            />
            <TextField
              label="Start date"
              type="date"
              value={form.start_date}
              onChange={(event) => setForm((current) => ({ ...current, start_date: event.target.value }))}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="End date"
              type="date"
              value={form.end_date}
              onChange={(event) => setForm((current) => ({ ...current, end_date: event.target.value }))}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              select
              label="Status"
              value={form.status}
              onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
              fullWidth
            >
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="open">Open</MenuItem>
              <MenuItem value="closed">Closed</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdate}>
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
