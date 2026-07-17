'use client';

import { z } from 'zod';
import { mutate } from 'swr';
import { toast } from 'sonner';
import { useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Plus, Edit2, Globe, Trash2, RefreshCw, DollarSign, TrendingUp } from 'lucide-react';

import {
  Grid,
  Stack,
  Dialog,
  Select,
  Tooltip,
  Checkbox,
  MenuItem,
  TextField,
  IconButton,
  InputLabel,
  Pagination,
  DialogTitle,
  FormControl,
  DialogActions,
  DialogContent,
  FormHelperText,
  CircularProgress,
  FormControlLabel,
} from '@mui/material';

import axios, { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { ConfirmDialog } from 'src/components/custom-dialog';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { StatCard } from '../../components/stat-card';
import { Card, CardBody, CardHeader } from '../../components/ui/card';

// â”€â”€ Endpoints â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const CURRENCIES_URL = endpoints.procurement_management.currencies;
const CURRENCY_BY_ID = (id) => endpoints.procurement_management.currency_by_id(id);
const CURRENCY_SET_STATUS = (id) => endpoints.procurement_management.currency_set_status(id);
const EXCHANGE_RATES_URL = endpoints.procurement_management.exchange_rates;
const EXCHANGE_RATE_BY_ID = (id) => endpoints.procurement_management.exchange_rate_by_id(id);

// â”€â”€ Zod Schemas â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const currencySchema = z.object({
  code: z
    .string()
    .min(2, 'Code is required')
    .max(10)
    .transform((v) => v.toUpperCase()),
  name: z.string().min(1, 'Name is required'),
  symbol: z.string().min(1, 'Symbol is required').max(10),
  is_base: z.boolean().default(false),
  status: z.enum(['active', 'inactive']).default('active'),
  notes: z.string().optional().or(z.literal('')),
});

const rateSchema = z.object({
  currency: z.coerce.number({ required_error: 'Select a currency' }),
  rate: z.coerce.number().positive('Rate must be positive'),
  effective_date: z.string().min(1, 'Date is required'),
  source: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

const currencyDefaults = {
  code: '',
  name: '',
  symbol: '',
  is_base: false,
  status: 'active',
  notes: '',
};
const rateDefaults = { currency: '', rate: '', effective_date: '', source: 'manual', notes: '' };

const ROWS_PER_PAGE = 10;

const statusBadge = (s) =>
  s === 'active' ? (
    <Badge variant="success" size="sm">
      Active
    </Badge>
  ) : (
    <Badge variant="default" size="sm">
      Inactive
    </Badge>
  );

export function CurrencySettings() {
  const [tab, setTab] = useState('currencies');
  const [currencyDialog, setCurrencyDialog] = useState({ open: false, editing: null });
  const [rateDialog, setRateDialog] = useState({ open: false, editing: null });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, name: '', type: '' });
  const [statusLoading, setStatusLoading] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);

  // â”€â”€ Fetch data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const { data: currenciesRaw, loading: currenciesLoading } = useGetRequest(CURRENCIES_URL);
  const currencies = useMemo(
    () => (Array.isArray(currenciesRaw) ? currenciesRaw : (currenciesRaw?.results ?? [])),
    [currenciesRaw]
  );

  const { data: ratesRaw, loading: ratesLoading } = useGetRequest(EXCHANGE_RATES_URL);
  const allRates = useMemo(
    () => (Array.isArray(ratesRaw) ? ratesRaw : (ratesRaw?.results ?? [])),
    [ratesRaw]
  );

  // â”€â”€ Stats â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const baseCurrency = currencies.find((c) => c.is_base);
  const activeCurrencies = currencies.filter((c) => c.status === 'active');
  const usdRate = currencies.find((c) => c.code === 'USD');
  const lastUpdate = allRates[0]?.effective_date ?? 'â€”';

  // â”€â”€ Currency form â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const {
    control: cControl,
    handleSubmit: cHandleSubmit,
    reset: cReset,
    formState: { errors: cErrors },
  } = useForm({ resolver: zodResolver(currencySchema), defaultValues: currencyDefaults });

  // â”€â”€ Rate form â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const {
    control: rControl,
    handleSubmit: rHandleSubmit,
    reset: rReset,
    formState: { errors: rErrors },
  } = useForm({ resolver: zodResolver(rateSchema), defaultValues: rateDefaults });

  // â”€â”€ Currency dialog handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const openAddCurrency = () => {
    setCurrencyDialog({ open: true, editing: null });
    cReset(currencyDefaults);
  };

  const openEditCurrency = (c) => {
    setCurrencyDialog({ open: true, editing: c });
    cReset({
      code: c.code,
      name: c.name,
      symbol: c.symbol,
      is_base: c.is_base,
      status: c.status,
      notes: c.notes ?? '',
    });
  };
  const closeCurrencyDialog = () => {
    if (isSubmitting) return;
    setCurrencyDialog({ open: false, editing: null });
    cReset(currencyDefaults);
  };
  const onSubmitCurrency = async (data) => {
    setIsSubmitting(true);
    try {
      if (currencyDialog.editing) {
        await axios.patch(CURRENCY_BY_ID(currencyDialog.editing.id), data);
        toast.success('Currency updated');
      } else {
        await axios.post(CURRENCIES_URL, data);
        toast.success('Currency added');
      }
      await mutate(CURRENCIES_URL);
      closeCurrencyDialog();
    } catch (err) {
      const detail = err?.response?.data;
      toast.error(
        typeof detail === 'string'
          ? detail
          : Object.values(detail ?? {})
              .flat()
              .join(', ') || 'Something went wrong'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // â”€â”€ Rate dialog handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const openAddRate = () => {
    setRateDialog({ open: true, editing: null });
    rReset(rateDefaults);
  };
  const openEditRate = (r) => {
    setRateDialog({ open: true, editing: r });
    rReset({
      currency: r.currency,
      rate: r.rate,
      effective_date: r.effective_date,
      source: r.source ?? 'manual',
      notes: r.notes ?? '',
    });
  };
  const closeRateDialog = () => {
    if (isSubmitting) return;
    setRateDialog({ open: false, editing: null });
    rReset(rateDefaults);
  };
  const onSubmitRate = async (data) => {
    setIsSubmitting(true);
    try {
      if (rateDialog.editing) {
        await axios.patch(EXCHANGE_RATE_BY_ID(rateDialog.editing.id), data);
        toast.success('Rate updated');
      } else {
        await axios.post(EXCHANGE_RATES_URL, data);
        toast.success('Exchange rate added');
      }
      await mutate(EXCHANGE_RATES_URL);
      await mutate(CURRENCIES_URL);
      closeRateDialog();
    } catch (err) {
      const detail = err?.response?.data;
      toast.error(
        typeof detail === 'string'
          ? detail
          : Object.values(detail ?? {})
              .flat()
              .join(', ') || 'Something went wrong'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // â”€â”€ Status toggle â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleToggleStatus = async (currency) => {
    const next = currency.status === 'active' ? 'inactive' : 'active';
    setStatusLoading(currency.id);
    try {
      await axios.patch(CURRENCY_SET_STATUS(currency.id), { status: next });
      toast.success(`Status set to ${next}`);
      await mutate(CURRENCIES_URL);
    } catch {
      toast.error('Failed to update status');
    } finally {
      setStatusLoading(null);
    }
  };

  // â”€â”€ Delete â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      if (deleteConfirm.type === 'currency') {
        await axios.delete(CURRENCY_BY_ID(deleteConfirm.id));
        await mutate(CURRENCIES_URL);
      } else {
        await axios.delete(EXCHANGE_RATE_BY_ID(deleteConfirm.id));
        await mutate(EXCHANGE_RATES_URL);
        await mutate(CURRENCIES_URL);
      }
      toast.success('Deleted successfully');
      setDeleteConfirm({ open: false, id: null, name: '', type: '' });
    } catch {
      toast.error('Delete failed');
    } finally {
      setIsDeleting(false);
    }
  };

  // â”€â”€ Pagination â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const totalHistoryPages = Math.max(1, Math.ceil(allRates.length / ROWS_PER_PAGE));
  const paginatedRates = allRates.slice(
    (historyPage - 1) * ROWS_PER_PAGE,
    historyPage * ROWS_PER_PAGE
  );
  const nonBaseCurrencies = currencies.filter((c) => !c.is_base && c.status === 'active');

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground mb-1">
            Currency &amp; Exchange Rates
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage currencies and exchange rates for multi-currency operations
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={openAddRate}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Add Rate
          </Button>
          <Button variant="primary" onClick={openAddCurrency}>
            <Plus className="w-4 h-4 mr-2" />
            Add Currency
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Base Currency"
          value={baseCurrency?.code ?? 'â€”'}
          icon={DollarSign}
          color="blue"
        />
        <StatCard
          title="Active Currencies"
          value={activeCurrencies.length}
          icon={Globe}
          color="green"
        />
        <StatCard
          title="USD Rate"
          value={usdRate?.latest_rate ? `à§³${Number(usdRate.latest_rate).toFixed(2)}` : 'â€”'}
          icon={TrendingUp}
          color="purple"
        />
        <StatCard
          title="Last Rate Update"
          value={lastUpdate !== 'â€”' ? lastUpdate : 'â€”'}
          icon={RefreshCw}
          color="orange"
        />
      </div>

      {/* Tab buttons */}
      <div className="flex gap-2 mb-4">
        {['currencies', 'history'].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm rounded-md font-medium capitalize transition-colors ${
              tab === t
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-foreground hover:bg-border'
            }`}
          >
            {t === 'currencies' ? 'Currencies' : 'Rate History'}
          </button>
        ))}
      </div>

      {/* Currencies Table */}
      {tab === 'currencies' && (
        <Card>
          <CardHeader title="Configured Currencies" />
          <CardBody>
            {currenciesLoading ? (
              <div className="flex justify-center py-8">
                <CircularProgress size={28} />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead className="border-b-2 border-border">
                    <tr className="text-left">
                      <th className="pb-3 pr-3 text-xs font-semibold text-foreground uppercase">
                        Code
                      </th>
                      <th className="pb-3 pr-3 text-xs font-semibold text-foreground uppercase">
                        Currency Name
                      </th>
                      <th className="pb-3 pr-3 text-xs font-semibold text-foreground uppercase text-center">
                        Symbol
                      </th>
                      <th className="pb-3 pr-3 text-xs font-semibold text-foreground uppercase text-right hidden sm:table-cell">
                        Rate (1 FCY = BDT)
                      </th>
                      <th className="pb-3 pr-3 text-xs font-semibold text-foreground uppercase text-right hidden md:table-cell">
                        1 BDT =
                      </th>
                      <th className="pb-3 pr-3 text-xs font-semibold text-foreground uppercase text-center">
                        Status
                      </th>
                      <th className="pb-3 pr-3 text-xs font-semibold text-foreground uppercase hidden sm:table-cell">
                        Last Updated
                      </th>
                      <th className="pb-3 text-xs font-semibold text-foreground uppercase text-center">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currencies.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-muted-foreground text-sm">
                          No currencies configured. Add one to get started.
                        </td>
                      </tr>
                    )}
                    {currencies.map((c) => (
                      <tr
                        key={c.id}
                        className="border-b border-border hover:bg-secondary/30 transition-colors"
                      >
                        <td className="py-3 pr-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">{c.code}</span>
                            {c.is_base && (
                              <Badge variant="primary" size="sm">
                                Base
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-3 pr-3 text-sm text-foreground">{c.name}</td>
                        <td className="py-3 pr-3 text-sm text-center font-medium">{c.symbol}</td>
                        <td className="py-3 pr-3 text-sm text-right font-mono hidden sm:table-cell">
                          {c.is_base
                            ? '1.000000'
                            : c.latest_rate
                              ? Number(c.latest_rate).toFixed(4)
                              : 'â€”'}
                        </td>
                        <td className="py-3 pr-3 text-sm text-right font-mono hidden md:table-cell">
                          {c.is_base
                            ? '1.000000'
                            : c.latest_rate
                              ? (1 / Number(c.latest_rate)).toFixed(6)
                              : 'â€”'}
                        </td>
                        <td className="py-3 pr-3 text-center">{statusBadge(c.status)}</td>
                        <td className="py-3 pr-3 text-sm text-muted-foreground hidden sm:table-cell">
                          {c.last_updated ?? 'â€”'}
                        </td>
                        <td className="py-3">
                          <div className="flex items-center justify-center gap-1">
                            {!c.is_base && (
                              <Tooltip title={c.status === 'active' ? 'Deactivate' : 'Activate'}>
                                <button
                                  type="button"
                                  disabled={statusLoading === c.id}
                                  onClick={() => handleToggleStatus(c)}
                                  className={`text-xs px-2 py-1 rounded transition-colors disabled:opacity-50 ${
                                    c.status === 'active'
                                      ? 'bg-muted text-muted-foreground hover:bg-border'
                                      : 'bg-success/10 text-success hover:bg-success/20'
                                  }`}
                                >
                                  {statusLoading === c.id
                                    ? '...'
                                    : c.status === 'active'
                                      ? 'Disable'
                                      : 'Enable'}
                                </button>
                              </Tooltip>
                            )}
                            <Tooltip title="Edit">
                              <IconButton size="small" onClick={() => openEditCurrency(c)}>
                                <Edit2 size={14} className="text-primary" />
                              </IconButton>
                            </Tooltip>
                            {!c.is_base && (
                              <Tooltip title="Delete">
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    setDeleteConfirm({
                                      open: true,
                                      id: c.id,
                                      name: c.name,
                                      type: 'currency',
                                    })
                                  }
                                >
                                  <Trash2 size={14} className="text-error" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Rate History */}
      {tab === 'history' && (
        <Card>
          <CardHeader
            title="Exchange Rate History"
            description="Historical rate snapshots (1 FCY = BDT)"
          />
          <CardBody>
            {ratesLoading ? (
              <div className="flex justify-center py-8">
                <CircularProgress size={28} />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[540px]">
                    <thead className="border-b-2 border-border">
                      <tr className="text-left">
                        <th className="pb-3 pr-3 text-xs font-semibold text-foreground uppercase">
                          Currency
                        </th>
                        <th className="pb-3 pr-3 text-xs font-semibold text-foreground uppercase text-right">
                          Rate (1 FCY = BDT)
                        </th>
                        <th className="pb-3 pr-3 text-xs font-semibold text-foreground uppercase text-right hidden sm:table-cell">
                          Inverse (1 BDT)
                        </th>
                        <th className="pb-3 pr-3 text-xs font-semibold text-foreground uppercase">
                          Effective Date
                        </th>
                        <th className="pb-3 pr-3 text-xs font-semibold text-foreground uppercase hidden md:table-cell">
                          Source
                        </th>
                        <th className="pb-3 text-xs font-semibold text-foreground uppercase text-center">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedRates.length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            className="py-8 text-center text-muted-foreground text-sm"
                          >
                            No rate history yet.
                          </td>
                        </tr>
                      )}
                      {paginatedRates.map((r) => (
                        <tr
                          key={r.id}
                          className="border-b border-border hover:bg-secondary/30 transition-colors"
                        >
                          <td className="py-3 pr-3">
                            <div className="text-sm font-semibold">{r.currency_code}</div>
                            <div className="text-xs text-muted-foreground">{r.currency_name}</div>
                          </td>
                          <td className="py-3 pr-3 text-sm text-right font-mono">
                            à§³{Number(r.rate).toFixed(4)}
                          </td>
                          <td className="py-3 pr-3 text-sm text-right font-mono hidden sm:table-cell">
                            {r.rate ? (1 / Number(r.rate)).toFixed(6) : 'â€”'}
                          </td>
                          <td className="py-3 pr-3 text-sm text-foreground">{r.effective_date}</td>
                          <td className="py-3 pr-3 text-sm text-muted-foreground hidden md:table-cell">
                            {r.source ?? 'â€”'}
                          </td>
                          <td className="py-3">
                            <div className="flex items-center justify-center gap-1">
                              <Tooltip title="Edit">
                                <IconButton size="small" onClick={() => openEditRate(r)}>
                                  <Edit2 size={14} className="text-primary" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    setDeleteConfirm({
                                      open: true,
                                      id: r.id,
                                      name: `${r.currency_code} @ ${r.effective_date}`,
                                      type: 'rate',
                                    })
                                  }
                                >
                                  <Trash2 size={14} className="text-error" />
                                </IconButton>
                              </Tooltip>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {totalHistoryPages > 1 && (
                  <div className="flex justify-center mt-4">
                    <Pagination
                      count={totalHistoryPages}
                      page={historyPage}
                      onChange={(_, p) => setHistoryPage(p)}
                      size="small"
                      color="primary"
                    />
                  </div>
                )}
              </>
            )}
          </CardBody>
        </Card>
      )}

      {/* Add / Edit Currency Dialog */}
      <Dialog open={currencyDialog.open} onClose={closeCurrencyDialog} maxWidth="sm" fullWidth>
        <form onSubmit={cHandleSubmit(onSubmitCurrency)}>
          <DialogTitle
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            {currencyDialog.editing ? 'Edit Currency' : 'Add Currency'}
            <IconButton onClick={closeCurrencyDialog} size="small" disabled={isSubmitting}>
              <X size={16} />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2.5} sx={{ pt: 1 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Controller
                    name="code"
                    control={cControl}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Code *"
                        fullWidth
                        size="small"
                        placeholder="USD"
                        inputProps={{ style: { textTransform: 'uppercase' } }}
                        error={!!cErrors.code}
                        helperText={cErrors.code?.message}
                        disabled={!!currencyDialog.editing}
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 5 }}>
                  <Controller
                    name="name"
                    control={cControl}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Currency Name *"
                        fullWidth
                        size="small"
                        placeholder="US Dollar"
                        error={!!cErrors.name}
                        helperText={cErrors.name?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <Controller
                    name="symbol"
                    control={cControl}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Symbol *"
                        fullWidth
                        size="small"
                        placeholder="$"
                        error={!!cErrors.symbol}
                        helperText={cErrors.symbol?.message}
                      />
                    )}
                  />
                </Grid>
              </Grid>

              <Controller
                name="status"
                control={cControl}
                render={({ field }) => (
                  <FormControl fullWidth size="small" error={!!cErrors.status}>
                    <InputLabel>Status</InputLabel>
                    <Select {...field} label="Status">
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="inactive">Inactive</MenuItem>
                    </Select>
                    {cErrors.status && <FormHelperText>{cErrors.status.message}</FormHelperText>}
                  </FormControl>
                )}
              />

              <Controller
                name="is_base"
                control={cControl}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        size="small"
                      />
                    }
                    label="Set as Base Currency (only one allowed)"
                  />
                )}
              />

              <Controller
                name="notes"
                control={cControl}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Notes"
                    fullWidth
                    multiline
                    rows={2}
                    size="small"
                    error={!!cErrors.notes}
                    helperText={cErrors.notes?.message}
                  />
                )}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
            <Button
              variant="outline"
              type="button"
              onClick={closeCurrencyDialog}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting && <CircularProgress size={14} color="inherit" sx={{ mr: 1 }} />}
              {currencyDialog.editing ? 'Save Changes' : 'Add Currency'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Add / Edit Exchange Rate Dialog */}
      <Dialog open={rateDialog.open} onClose={closeRateDialog} maxWidth="sm" fullWidth>
        <form onSubmit={rHandleSubmit(onSubmitRate)}>
          <DialogTitle
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            {rateDialog.editing ? 'Edit Exchange Rate' : 'Add Exchange Rate'}
            <IconButton onClick={closeRateDialog} size="small" disabled={isSubmitting}>
              <X size={16} />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2.5} sx={{ pt: 1 }}>
              <Controller
                name="currency"
                control={rControl}
                render={({ field }) => (
                  <FormControl fullWidth size="small" error={!!rErrors.currency}>
                    <InputLabel>Currency *</InputLabel>
                    <Select {...field} label="Currency *" disabled={!!rateDialog.editing}>
                      {nonBaseCurrencies.map((c) => (
                        <MenuItem key={c.id} value={c.id}>
                          {c.code} â€” {c.name}
                        </MenuItem>
                      ))}
                    </Select>
                    {rErrors.currency && (
                      <FormHelperText>{rErrors.currency.message}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Controller
                    name="rate"
                    control={rControl}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Rate (1 FCY = BDT) *"
                        type="number"
                        fullWidth
                        size="small"
                        inputProps={{ step: '0.000001', min: '0.000001' }}
                        error={!!rErrors.rate}
                        helperText={rErrors.rate?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Controller
                    name="effective_date"
                    control={rControl}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Effective Date *"
                        type="date"
                        fullWidth
                        size="small"
                        slotProps={{ inputLabel: { shrink: true } }}
                        error={!!rErrors.effective_date}
                        helperText={rErrors.effective_date?.message}
                      />
                    )}
                  />
                </Grid>
              </Grid>

              <Controller
                name="source"
                control={rControl}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Source"
                    fullWidth
                    size="small"
                    placeholder="manual / CBR / API â€¦"
                    error={!!rErrors.source}
                    helperText={rErrors.source?.message}
                  />
                )}
              />

              <Controller
                name="notes"
                control={rControl}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Notes"
                    fullWidth
                    multiline
                    rows={2}
                    size="small"
                    error={!!rErrors.notes}
                    helperText={rErrors.notes?.message}
                  />
                )}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
            <Button
              variant="outline"
              type="button"
              onClick={closeRateDialog}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting && <CircularProgress size={14} color="inherit" sx={{ mr: 1 }} />}
              {rateDialog.editing ? 'Save Changes' : 'Add Rate'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, id: null, name: '', type: '' })}
        title={`Delete ${deleteConfirm.type === 'currency' ? 'Currency' : 'Exchange Rate'}`}
        content={`Are you sure you want to delete "${deleteConfirm.name}"? This cannot be undone.`}
        action={
          <Button variant="primary" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting && <CircularProgress size={14} color="inherit" sx={{ mr: 1 }} />}
            Delete
          </Button>
        }
      />
    </div>
  );
}
