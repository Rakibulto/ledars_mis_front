'use client';

import { toast } from 'sonner';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Radio from '@mui/material/Radio';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import InputAdornment from '@mui/material/InputAdornment';
import TableContainer from '@mui/material/TableContainer';

import { Iconify } from 'src/components/iconify';

import { useCurrency, WORLD_CURRENCIES, DEFAULT_EXCHANGE_RATES } from '../currency-context';

// ── Helpers ───────────────────────────────────────────────────────────────────

function InfoRow({ label, value }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 0.75 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={700}>
        {value}
      </Typography>
    </Stack>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function CurrencyRates() {
  const {
    activeCurrency,
    activeCurrencyCode,
    exchangeRates,
    setActiveCurrency,
    updateExchangeRate,
    updateAllRates,
  } = useCurrency();

  // Local draft of rate edits before saving
  const [draftRates, setDraftRates] = useState(() =>
    Object.fromEntries(
      WORLD_CURRENCIES.map((c) => [
        c.code,
        String(exchangeRates[c.code] ?? DEFAULT_EXCHANGE_RATES[c.code] ?? 1),
      ])
    )
  );

  const [isDirty, setIsDirty] = useState(false);
  const [search, setSearch] = useState('');

  const filteredCurrencies = useMemo(
    () =>
      WORLD_CURRENCIES.filter(
        (c) =>
          c.code.toLowerCase().includes(search.toLowerCase()) ||
          c.name.toLowerCase().includes(search.toLowerCase())
      ),
    [search]
  );

  const handleRateChange = (code, value) => {
    setDraftRates((prev) => ({ ...prev, [code]: value }));
    setIsDirty(true);
  };

  const handleSaveAll = () => {
    const parsed = {};
    let hasError = false;
    WORLD_CURRENCIES.forEach((c) => {
      const val = Number(draftRates[c.code]);
      if (!Number.isFinite(val) || val <= 0) {
        hasError = true;
      } else {
        parsed[c.code] = val;
      }
    });
    if (hasError) {
      toast.error('Some exchange rates contain invalid values. Please enter positive numbers.');
      return;
    }
    updateAllRates(parsed);
    setIsDirty(false);
    toast.success('Exchange rates saved and applied globally.');
  };

  const handleReset = () => {
    setDraftRates(
      Object.fromEntries(
        WORLD_CURRENCIES.map((c) => [c.code, String(DEFAULT_EXCHANGE_RATES[c.code] ?? 1)])
      )
    );
    updateAllRates({ ...DEFAULT_EXCHANGE_RATES });
    setIsDirty(false);
    toast.success('Exchange rates reset to defaults.');
  };

  const handleSetActive = (code) => {
    setActiveCurrency(code);
    toast.success(
      `Base currency changed to ${code}. All displayed amounts now convert to ${code}.`
    );
  };

  // Quick stats
  const nonDefaultCount = useMemo(
    () =>
      WORLD_CURRENCIES.filter((c) => {
        const current = exchangeRates[c.code];
        const def = DEFAULT_EXCHANGE_RATES[c.code];
        return current !== undefined && current !== def;
      }).length,
    [exchangeRates]
  );

  const activeCurrencyObj = WORLD_CURRENCIES.find((c) => c.code === activeCurrencyCode);
  const bdtEquivalent =
    activeCurrencyCode === 'BDT'
      ? '1 BDT = 1 BDT'
      : `1 ${activeCurrencyCode} = ${exchangeRates[activeCurrencyCode] ?? 1} BDT`;

  return (
    <Box sx={{ p: 3 }}>
      {/* ── Header ── */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Currency &amp; Rates
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Select the active display currency and configure exchange rates. All monetary values in
            the Accounting &amp; Finance module will display in the selected currency.
          </Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="flex-start">
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<Iconify icon="solar:refresh-bold" />}
            onClick={handleReset}
          >
            Reset Defaults
          </Button>
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:diskette-bold" />}
            onClick={handleSaveAll}
            disabled={!isDirty}
          >
            Save Rates
          </Button>
        </Stack>
      </Stack>

      {isDirty && (
        <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
          You have unsaved exchange rate changes. Click <strong>Save Rates</strong> to apply them
          globally.
        </Alert>
      )}

      {/* ── Summary cards ── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Active currency
              </Typography>
              <Typography variant="h4" fontWeight={800} sx={{ mt: 0.75 }}>
                {activeCurrencyObj?.flag} {activeCurrencyCode}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                {activeCurrencyObj?.name}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Symbol
              </Typography>
              <Typography variant="h4" fontWeight={800} sx={{ mt: 0.75 }}>
                {activeCurrencyObj?.symbol}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                Used in all displayed amounts
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                BDT rate
              </Typography>
              <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
                {bdtEquivalent}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                Relative to BDT base
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Custom rates
              </Typography>
              <Typography variant="h4" fontWeight={800} sx={{ mt: 0.75 }}>
                {nonDefaultCount}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                Currencies with overridden rates
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── Active currency quick-set banner ── */}
      <Card sx={{ borderRadius: 3, mb: 3, bgcolor: 'primary.lighter' }}>
        <CardContent>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            spacing={2}
            alignItems={{ md: 'center' }}
          >
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>
                Active display currency: {activeCurrencyObj?.flag} {activeCurrencyCode} —{' '}
                {activeCurrencyObj?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                All monetary values across the Accounting &amp; Finance module display and convert
                to this currency in real time. Stored data and API payloads are not affected.
              </Typography>
            </Box>
            <Chip
              label={`${activeCurrencyObj?.symbol} ${activeCurrencyCode}`}
              color="primary"
              sx={{ fontWeight: 700, fontSize: 14, px: 1, minWidth: 90 }}
            />
          </Stack>
        </CardContent>
      </Card>

      {/* ── Currency table ── */}
      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ pb: 1 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            spacing={2}
            alignItems={{ sm: 'center' }}
            sx={{ mb: 2 }}
          >
            <Typography variant="h6" fontWeight={700}>
              All Currencies
            </Typography>
            <TextField
              size="small"
              placeholder="Search currency…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="solar:magnifier-bold" width={16} />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 220 }}
            />
          </Stack>
        </CardContent>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Set Active</TableCell>
                <TableCell>Flag</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Symbol</TableCell>
                <TableCell>Rate (1 unit = X BDT)</TableCell>
                <TableCell>Converted 1 BDT →</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCurrencies.map((currency) => {
                const isActive = currency.code === activeCurrencyCode;
                const currentRate =
                  exchangeRates[currency.code] ?? DEFAULT_EXCHANGE_RATES[currency.code] ?? 1;
                const defaultRate = DEFAULT_EXCHANGE_RATES[currency.code] ?? 1;
                const isCustom = currentRate !== defaultRate;
                const draftVal = draftRates[currency.code] ?? String(currentRate);
                const draftNum = Number(draftVal);
                const isInvalid = !Number.isFinite(draftNum) || draftNum <= 0;
                const bdtToThis = currentRate > 0 ? (1 / currentRate).toFixed(4) : '—';

                return (
                  <TableRow
                    key={currency.code}
                    hover
                    sx={isActive ? { bgcolor: 'primary.lighter' } : undefined}
                  >
                    <TableCell>
                      <Tooltip
                        title={
                          isActive ? 'Currently active' : `Set ${currency.code} as active currency`
                        }
                      >
                        <Radio
                          checked={isActive}
                          onChange={() => handleSetActive(currency.code)}
                          size="small"
                          color="primary"
                        />
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Typography variant="h5" sx={{ lineHeight: 1 }}>
                        {currency.flag}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
                        {currency.code}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{currency.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700}>
                        {currency.symbol}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ minWidth: 200 }}>
                      <TextField
                        size="small"
                        type="number"
                        value={draftVal}
                        onChange={(e) => handleRateChange(currency.code, e.target.value)}
                        disabled={currency.code === 'BDT'}
                        error={isInvalid && currency.code !== 'BDT'}
                        helperText={
                          isInvalid && currency.code !== 'BDT' ? 'Must be > 0' : undefined
                        }
                        InputProps={{
                          endAdornment: <InputAdornment position="end">BDT</InputAdornment>,
                        }}
                        inputProps={{ min: 0.0001, step: 0.01 }}
                        sx={{ width: 160 }}
                        onBlur={() => {
                          if (!isInvalid) updateExchangeRate(currency.code, draftNum);
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontFamily: 'monospace' }}
                      >
                        {currency.symbol}
                        {bdtToThis}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                        {isActive && <Chip label="Active" size="small" color="primary" />}
                        {isCustom && (
                          <Chip
                            label="Custom rate"
                            size="small"
                            color="warning"
                            variant="outlined"
                          />
                        )}
                        {!isActive && !isCustom && (
                          <Chip label="Default" size="small" variant="outlined" />
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {filteredCurrencies.length === 0 && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No currencies match your search.
            </Typography>
          </Box>
        )}
      </Card>

      {/* ── Operating notes ── */}
      <Card sx={{ borderRadius: 3, mt: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5 }}>
            How Currency &amp; Rates Works
          </Typography>
          <Stack spacing={1}>
            {[
              'Select the radio button next to any currency to make it the active display currency. All monetary values in the module update immediately.',
              'Exchange rates represent how many BDT equal 1 unit of the currency (e.g. 1 USD = 110 BDT).',
              "Rates are saved to your browser's local storage and persist across sessions.",
              'The converted amount is displayed in real time. Underlying stored data and API payloads remain unchanged.',
              'Click Save Rates to commit rate edits. Individual rate fields also auto-save on blur.',
              'Click Reset Defaults to restore the built-in reference rates.',
            ].map((note) => (
              <Stack key={note} direction="row" spacing={1} alignItems="flex-start">
                <Iconify
                  icon="solar:info-circle-bold"
                  width={16}
                  sx={{ mt: 0.25, color: 'text.secondary', flexShrink: 0 }}
                />
                <Typography variant="body2" color="text.secondary">
                  {note}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
