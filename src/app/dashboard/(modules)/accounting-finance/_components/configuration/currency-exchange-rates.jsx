'use client';

import Link from 'next/link';
import { toast } from 'sonner';
import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import MenuItem from '@mui/material/MenuItem';
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

import { useExchangeRatesApi } from './use-exchange-rates-api';
import { ReferenceConfigToolbar } from './reference-config-toolbar';

const BASE_PATH = '/dashboard/accounting-finance/configuration/currency-exchange-rates';

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

export default function CurrencyExchangeRates() {
  const workspace = useExchangeRatesApi();
  const [open, setOpen] = useState(false);
  const [selectedRateId, setSelectedRateId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    from_currency: 'BDT',
    to_currency: 'USD',
    rate: '',
    date: '2026-03-30',
    source: 'Manual',
    import_mode: '',
    gain_loss_automation: '',
  });

  const selectedRate =
    workspace.exchangeRates.find((rate) => String(rate.id) === String(selectedRateId)) ||
    workspace.exchangeRates[0] ||
    null;

  const saveRate = async () => {
    if (!form.to_currency || Number(form.rate) <= 0 || !form.date) {
      toast.error('To currency, positive rate, and effective date are required');
      return;
    }

    setSubmitting(true);
    try {
      await workspace.actions.createExchangeRate(form);
      toast.success('Exchange rate added');
      setOpen(false);
      setForm({
        from_currency: 'BDT',
        to_currency: 'USD',
        rate: '',
        date: '2026-03-30',
        source: 'Manual',
        import_mode: '',
        gain_loss_automation: '',
      });
    } catch (error) {
      toast.error(error?.message || 'Failed to create exchange rate');
    } finally {
      setSubmitting(false);
    }
  };

  const printContent = (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <thead>
        <tr style={{ background: '#f5f5f5' }}>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>Pair</th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>Rate</th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Inverse
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Effective Date
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Source
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Variance
          </th>
        </tr>
      </thead>
      <tbody>
        {workspace.exchangeRates.map((rate) => (
          <tr key={rate.id}>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
              {rate.from_currency}/{rate.to_currency}
            </td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
              {Number(rate.rate).toFixed(4)}
            </td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
              {Number(rate.inverseRate).toFixed(6)}
            </td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{rate.effective_date}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{rate.source}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
              {rate.varianceFlag === 'watch' ? 'Review' : 'Stable'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <Box sx={{ p: 3 }}>
      <ReferenceConfigToolbar printTitle="Currency Exchange Rates" printContent={printContent} />

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Currency Exchange Rates
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Effective-date FX control with source monitoring, inverse rates, and treasury
            synchronization.
          </Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button
            variant="outlined"
            startIcon={<Iconify icon="solar:refresh-circle-bold" />}
            onClick={() =>
              workspace.actions.syncExchangeRates().then(() => toast.success('Rates synchronized'))
            }
          >
            Sync Live Rates
          </Button>
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
            onClick={() => setOpen(true)}
          >
            Add Rate
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Configured pairs"
            value={workspace.exchangeRates.length}
            helper="Active FX conversion pairs in treasury control"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Sources"
            value={workspace.overview.liveRateSources}
            helper="Distinct feeds or manual sources in use"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Watchlist rates"
            value={workspace.exchangeRates.filter((rate) => rate.varianceFlag === 'watch').length}
            helper="Pairs outside normal treasury range"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Base anchor"
            value={workspace.currencies.find((currency) => currency.is_base)?.code || '—'}
            helper="Primary currency for translation"
          />
        </Grid>
      </Grid>

      <Card sx={{ borderRadius: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Pair</TableCell>
                <TableCell align="right">Rate</TableCell>
                <TableCell align="right">Inverse</TableCell>
                <TableCell>Effective Date</TableCell>
                <TableCell>Source</TableCell>
                <TableCell>Automation</TableCell>
                <TableCell>Variance Flag</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {workspace.exchangeRates.map((rate) => (
                <TableRow
                  key={rate.id}
                  hover
                  selected={String(rate.id) === String(selectedRate?.id)}
                  onClick={() => setSelectedRateId(rate.id)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>
                    <Chip
                      label={`${rate.from_currency}/${rate.to_currency}`}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">{Number(rate.rate).toFixed(4)}</TableCell>
                  <TableCell align="right">{Number(rate.inverseRate).toFixed(6)}</TableCell>
                  <TableCell>{rate.effective_date}</TableCell>
                  <TableCell>{rate.source}</TableCell>
                  <TableCell>
                    <Typography variant="body2">{rate.importMode}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {rate.gainLossAutomation}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={rate.varianceFlag === 'watch' ? 'Review' : 'Stable'}
                      size="small"
                      color={rate.varianceFlag === 'watch' ? 'warning' : 'success'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="View details">
                      <Button
                        component={Link}
                        href={`${BASE_PATH}/${rate.id}`}
                        size="small"
                        variant="text"
                      >
                        View Details
                      </Button>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {selectedRate ? (
        <Card sx={{ borderRadius: 3, mt: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Treasury Rate Detail
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Stack spacing={1.1}>
                  <Typography variant="body2">
                    Pair:{' '}
                    <strong>
                      {selectedRate.from_currency}/{selectedRate.to_currency}
                    </strong>
                  </Typography>
                  <Typography variant="body2">
                    Effective date: <strong>{selectedRate.effective_date}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Rate / inverse:{' '}
                    <strong>
                      {Number(selectedRate.rate).toFixed(4)} /{' '}
                      {Number(selectedRate.inverseRate).toFixed(6)}
                    </strong>
                  </Typography>
                  <Typography variant="body2">
                    Source: <strong>{selectedRate.source}</strong>
                  </Typography>
                </Stack>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Stack spacing={1.1}>
                  <Typography variant="body2">
                    Import mode: <strong>{selectedRate.importMode}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Variance posture:{' '}
                    <strong>
                      {selectedRate.varianceFlag === 'watch'
                        ? 'Treasury review required'
                        : 'Within normal band'}
                    </strong>
                  </Typography>
                  <Typography variant="body2">
                    Gain/loss policy: <strong>{selectedRate.gainLossAutomation}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Settlement anchor: <strong>{selectedRate.toSymbol} translation target</strong>
                  </Typography>
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      ) : null}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Exchange Rate</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="From Currency"
                value={form.from_currency}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    from_currency: event.target.value.toUpperCase(),
                  }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                label="To Currency"
                value={form.to_currency}
                onChange={(event) =>
                  setForm((current) => ({ ...current, to_currency: event.target.value }))
                }
              >
                {workspace.currencies
                  .filter((currency) => currency.code !== form.from_currency)
                  .map((currency) => (
                    <MenuItem key={currency.id} value={currency.code}>
                      {currency.code} • {currency.name}
                    </MenuItem>
                  ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Rate"
                value={form.rate}
                onChange={(event) =>
                  setForm((current) => ({ ...current, rate: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="date"
                label="Date"
                value={form.date}
                onChange={(event) =>
                  setForm((current) => ({ ...current, date: event.target.value }))
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Source"
                value={form.source}
                onChange={(event) =>
                  setForm((current) => ({ ...current, source: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Import Mode"
                value={form.import_mode}
                onChange={(event) =>
                  setForm((current) => ({ ...current, import_mode: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Gain / Loss Automation"
                value={form.gain_loss_automation}
                onChange={(event) =>
                  setForm((current) => ({ ...current, gain_loss_automation: event.target.value }))
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveRate} disabled={submitting}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
