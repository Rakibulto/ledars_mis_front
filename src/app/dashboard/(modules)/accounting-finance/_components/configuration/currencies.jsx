'use client';

import Link from 'next/link';
import { toast } from 'sonner';
import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import TableContainer from '@mui/material/TableContainer';

import { Iconify } from 'src/components/iconify';

import { useCurrenciesApi } from './use-currencies-api';
import { ReferenceConfigToolbar } from './reference-config-toolbar';

const BASE_PATH = '/dashboard/accounting-finance/configuration/currencies';

function MetricCard({ label, value, helper }) {
  return (
    <Card sx={{ borderRadius: 3, height: '100%' }}>
      <CardContent>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h5" fontWeight={800} sx={{ mt: 0.5 }}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
          {helper}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function CurrenciesList() {
  const workspace = useCurrenciesApi();
  const [open, setOpen] = useState(false);
  const [selectedCurrencyId, setSelectedCurrencyId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    code: '',
    name: '',
    symbol: '',
    is_base: false,
    precision: 2,
    rounding_method: '',
    gain_loss_automation: '',
  });

  const selectedCurrency =
    workspace.currencies.find((currency) => String(currency.id) === String(selectedCurrencyId)) ||
    workspace.currencies[0] ||
    null;

  const saveCurrency = async () => {
    if (!form.code.trim() || !form.name.trim() || !form.symbol.trim()) {
      toast.error('Currency code, name, and symbol are required');
      return;
    }

    setSubmitting(true);
    try {
      await workspace.actions.createCurrency(form);
      toast.success('Currency created');
      setOpen(false);
      setForm({
        code: '',
        name: '',
        symbol: '',
        is_base: false,
        precision: 2,
        rounding_method: '',
        gain_loss_automation: '',
      });
    } catch (error) {
      toast.error(error?.message || 'Failed to create currency');
    } finally {
      setSubmitting(false);
    }
  };

  const printContent = (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <thead>
        <tr style={{ background: '#f5f5f5' }}>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>Code</th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>Name</th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Symbol
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>Rate</th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Precision
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>Base</th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Status
          </th>
        </tr>
      </thead>
      <tbody>
        {workspace.currencies.map((currency) => (
          <tr key={currency.id}>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{currency.code}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{currency.name}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{currency.symbol}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
              {currency.is_base ? '1.0000' : Number(currency.exchange_rate || 0).toFixed(4)}
            </td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{currency.precision}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
              {currency.is_base ? 'Yes' : 'No'}
            </td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
              {currency.active ? 'Active' : 'Inactive'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <Box sx={{ p: 3 }}>
      <ReferenceConfigToolbar printTitle="Currencies" printContent={printContent} />

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Currencies
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Activation, precision, base currency control, and FX triangulation readiness.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:add-circle-bold" />}
          onClick={() => setOpen(true)}
        >
          Add Currency
        </Button>
      </Stack>

      <Stack spacing={1.25} sx={{ mb: 3 }}>
        {workspace.alerts.map((alert) => (
          <Alert key={alert.id} severity={alert.severity} sx={{ borderRadius: 2 }}>
            {alert.description}
          </Alert>
        ))}
      </Stack>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Active currencies"
            value={workspace.overview.activeCurrencies}
            helper="Usable for posting and reporting"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Inactive currencies"
            value={workspace.overview.inactiveCurrencies}
            helper="Configured but not available for new posting"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Live rate sources"
            value={workspace.overview.liveRateSources}
            helper="Distinct FX sources feeding conversion"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Base currency"
            value={workspace.currencies.find((currency) => currency.is_base)?.code || '—'}
            helper="Primary reporting currency"
          />
        </Grid>
      </Grid>

      <Card sx={{ borderRadius: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Currency</TableCell>
                <TableCell>Rate Control</TableCell>
                <TableCell>Precision</TableCell>
                <TableCell>Triangulation</TableCell>
                <TableCell>Precision & Revaluation</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {workspace.currencies.map((currency) => (
                <TableRow
                  key={currency.id}
                  hover
                  selected={String(currency.id) === String(selectedCurrency?.id)}
                  onClick={() => setSelectedCurrencyId(currency.id)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar
                        sx={{
                          bgcolor: currency.is_base ? '#dbeafe' : '#f1f5f9',
                          color: currency.is_base ? '#2563eb' : '#475569',
                        }}
                      >
                        {currency.symbol}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={700}>
                          {currency.code} • {currency.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Source: {currency.source}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700}>
                      {currency.is_base ? '1.0000' : Number(currency.exchange_rate || 0).toFixed(4)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Last update {currency.lastRateDate}
                    </Typography>
                  </TableCell>
                  <TableCell>{currency.precision} decimals</TableCell>
                  <TableCell>{currency.triangulation}</TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {currency.precision} decimals • {currency.roundingMethod}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {currency.gainLossAutomation}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      {currency.is_base ? <Chip label="Base" size="small" color="primary" /> : null}
                      <Chip
                        label={currency.active ? 'Active' : 'Inactive'}
                        size="small"
                        color={currency.active ? 'success' : 'default'}
                      />
                    </Stack>
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
                          href={`${BASE_PATH}/${currency.id}`}
                          size="small"
                          variant="text"
                        >
                          View Details
                        </Button>
                      </Tooltip>
                      <Button
                        size="small"
                        variant="outlined"
                        color="inherit"
                        onClick={(event) => {
                          event.stopPropagation();
                          workspace.actions.toggleCurrencyStatus(currency.id);
                        }}
                      >
                        {currency.active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {selectedCurrency ? (
        <Card sx={{ borderRadius: 3, mt: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Currency Control Detail
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Stack spacing={1.1}>
                  <Typography variant="body2">
                    Currency:{' '}
                    <strong>
                      {selectedCurrency.code} • {selectedCurrency.name}
                    </strong>
                  </Typography>
                  <Typography variant="body2">
                    Status:{' '}
                    <strong>
                      {selectedCurrency.active ? 'Active for posting' : 'Inactive for new posting'}
                    </strong>
                  </Typography>
                  <Typography variant="body2">
                    Base posture:{' '}
                    <strong>
                      {selectedCurrency.is_base
                        ? 'Primary reporting currency'
                        : 'Translated into base currency'}
                    </strong>
                  </Typography>
                  <Typography variant="body2">
                    Triangulation: <strong>{selectedCurrency.triangulation}</strong>
                  </Typography>
                </Stack>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Stack spacing={1.1}>
                  <Typography variant="body2">
                    Rate source: <strong>{selectedCurrency.source}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Latest rate date: <strong>{selectedCurrency.lastRateDate}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Precision and rounding:{' '}
                    <strong>
                      {selectedCurrency.precision} decimals • {selectedCurrency.roundingMethod}
                    </strong>
                  </Typography>
                  <Typography variant="body2">
                    Revaluation policy: <strong>{selectedCurrency.gainLossAutomation}</strong>
                  </Typography>
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      ) : null}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Currency</DialogTitle>
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
            <Grid size={{ xs: 12, sm: 5 }}>
              <TextField
                fullWidth
                label="Name"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                fullWidth
                label="Symbol"
                value={form.symbol}
                onChange={(event) =>
                  setForm((current) => ({ ...current, symbol: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                type="number"
                label="Precision"
                value={form.precision}
                onChange={(event) =>
                  setForm((current) => ({ ...current, precision: Number(event.target.value) }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 8 }}>
              <TextField
                fullWidth
                label="Rounding Method"
                value={form.rounding_method}
                onChange={(event) =>
                  setForm((current) => ({ ...current, rounding_method: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Gain / Loss Automation"
                value={form.gain_loss_automation}
                onChange={(event) =>
                  setForm((current) => ({ ...current, gain_loss_automation: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Button
                variant={form.is_base ? 'contained' : 'outlined'}
                onClick={() => setForm((current) => ({ ...current, is_base: !current.is_base }))}
              >
                {form.is_base ? 'Will be base currency' : 'Mark as base currency'}
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveCurrency} disabled={submitting}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
