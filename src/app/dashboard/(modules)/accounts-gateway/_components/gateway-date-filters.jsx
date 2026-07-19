'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { useGatewayProject } from './gateway-project-context';

function monthBounds() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const fmt = (d) => d.toISOString().slice(0, 10);
  return { from: fmt(from), to: fmt(to) };
}

/**
 * Auto-applies date/project filters (no Apply click).
 * Shows Reset when dates or extra filters differ from defaults.
 *
 * @param {object} props
 * @param {(qs: string) => void} props.onApply
 * @param {Record<string, string|number|null|undefined>} [props.extraParams]
 * @param {boolean} [props.disabled] - when true, clears qs (e.g. ledger with no account)
 * @param {() => void} [props.onReset] - clear parent-owned filters (account, bank, …)
 * @param {React.ReactNode} [props.extra]
 */
export function GatewayDateFilters({
  onApply,
  extraParams = null,
  disabled = false,
  onReset = null,
  extra = null,
  onExportCsv = null,
  onExportExcel = null,
  canExport = false,
}) {
  const defaults = useMemo(() => monthBounds(), []);
  const { projectId } = useGatewayProject();
  const [dateFrom, setDateFrom] = useState(defaults.from);
  const [dateTo, setDateTo] = useState(defaults.to);
  const [exporting, setExporting] = useState(false);

  const onApplyRef = useRef(onApply);
  onApplyRef.current = onApply;

  const extraKey = useMemo(() => {
    if (!extraParams) return '';
    return Object.entries(extraParams)
      .filter(([, v]) => v != null && v !== '')
      .map(([k, v]) => `${k}=${v}`)
      .sort()
      .join('&');
  }, [extraParams]);

  const queryString = useMemo(() => {
    const params = new URLSearchParams({ date_from: dateFrom, date_to: dateTo });
    if (projectId) params.set('ngo_project', String(projectId));
    if (extraParams) {
      Object.entries(extraParams).forEach(([key, value]) => {
        if (value != null && value !== '') params.set(key, String(value));
      });
    }
    return params.toString();
  }, [dateFrom, dateTo, projectId, extraParams]);

  // Auto-load whenever filters change
  useEffect(() => {
    if (disabled) {
      onApplyRef.current('');
      return;
    }
    onApplyRef.current(queryString);
  }, [queryString, disabled]);

  const hasExtraFilter = Boolean(extraKey);
  const isFiltered =
    dateFrom !== defaults.from || dateTo !== defaults.to || hasExtraFilter;

  const handleReset = () => {
    setDateFrom(defaults.from);
    setDateTo(defaults.to);
    onReset?.();
  };

  const runExport = async (fn) => {
    if (!fn) return;
    setExporting(true);
    try {
      await fn();
    } catch (err) {
      toast.error(err?.message || 'Export failed.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card sx={{ p: 2, mb: 3 }} className="no-print">
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1.5}
        alignItems={{ md: 'center' }}
        flexWrap="wrap"
        useFlexGap
      >
        <TextField
          size="small"
          type="date"
          label="From"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          size="small"
          type="date"
          label="To"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        {extra}
        {isFiltered && (
          <Button
            variant="outlined"
            color="inherit"
            onClick={handleReset}
            startIcon={<Iconify icon="solar:restart-bold" />}
          >
            Reset
          </Button>
        )}
        <Button
          variant="outlined"
          color="inherit"
          onClick={() => window.print()}
          startIcon={<Iconify icon="solar:printer-bold-duotone" />}
        >
          Print
        </Button>
        {onExportCsv && (
          <Button
            variant="outlined"
            color="inherit"
            disabled={!canExport || exporting}
            onClick={() => runExport(onExportCsv)}
            startIcon={<Iconify icon="solar:file-text-bold-duotone" />}
          >
            CSV
          </Button>
        )}
        {onExportExcel && (
          <Button
            variant="outlined"
            color="inherit"
            disabled={!canExport || exporting}
            onClick={() => runExport(onExportExcel)}
            startIcon={<Iconify icon="solar:file-smile-bold-duotone" />}
          >
            Excel
          </Button>
        )}
      </Stack>
    </Card>
  );
}
