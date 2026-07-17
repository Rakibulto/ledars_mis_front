'use client';

import { toast } from 'sonner';
import { useState } from 'react';
import { usePathname } from 'next/navigation';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import PdfPrintLayout from 'src/app/dashboard/(modules)/accounting-finance/_components/shared/pdf-print-layout';

import { Iconify } from 'src/components/iconify';

import { useCoreLedgerConfigWorkspace } from './use-core-ledger-config-workspace';
import {
  exportCoreLedgerConfigCsv,
  exportCoreLedgerConfigJson,
  exportCoreLedgerConfigExcel,
  buildCoreLedgerConfigExportConfig,
} from './core-ledger-config-export';

const NAV_ITEMS = [
  { label: 'Overview', href: paths.dashboard.accountingFinance.configuration.root },
  { label: 'Journals', href: paths.dashboard.accountingFinance.configuration.journals },
  { label: 'Fiscal Year', href: paths.dashboard.accountingFinance.configuration.fiscalYear },
  { label: 'Fiscal Periods', href: paths.dashboard.accountingFinance.configuration.fiscalPeriods },
];

export function CoreLedgerConfigToolbar({ printTitle = 'Document', printContent = null }) {
  const pathname = usePathname();
  const workspace = useCoreLedgerConfigWorkspace();
  const exportConfig = buildCoreLedgerConfigExportConfig(workspace);
  const [pendingAction, setPendingAction] = useState(null);
  const [printOpen, setPrintOpen] = useState(false);

  const runAction = async (label, action, successMessage) => {
    const loadingId = toast.loading(`${label}...`);
    setPendingAction(label);

    try {
      await action();
      toast.dismiss(loadingId);
      toast.success(successMessage);
    } catch (error) {
      toast.dismiss(loadingId);
      toast.error(error?.message || `${label} failed`);
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Stack
        direction={{ xs: 'column', lg: 'row' }}
        spacing={1.5}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', lg: 'center' }}
      >
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {NAV_ITEMS.map((item) => (
            <Chip
              key={item.href}
              label={item.label}
              component={RouterLink}
              href={item.href}
              clickable
              color={pathname === item.href ? 'primary' : 'default'}
              variant={pathname === item.href ? 'filled' : 'outlined'}
              sx={{ borderRadius: 2 }}
            />
          ))}
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<Iconify icon="solar:download-minimalistic-bold" />}
            onClick={() =>
              runAction(
                'Export Core Ledger CSV',
                () => exportCoreLedgerConfigCsv('configuration-core-ledger', exportConfig),
                'Core ledger CSV exported'
              )
            }
            disabled={pendingAction !== null}
          >
            Export CSV
          </Button>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<Iconify icon="solar:document-bold" />}
            onClick={() =>
              runAction(
                'Export Core Ledger Excel',
                () => exportCoreLedgerConfigExcel('configuration-core-ledger', exportConfig),
                'Core ledger workbook exported'
              )
            }
            disabled={pendingAction !== null}
          >
            Export Excel
          </Button>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<Iconify icon="solar:code-bold" />}
            onClick={() =>
              runAction(
                'Export Core Ledger JSON',
                () => exportCoreLedgerConfigJson('configuration-core-ledger', exportConfig),
                'Core ledger JSON exported'
              )
            }
            disabled={pendingAction !== null}
          >
            Export JSON
          </Button>
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:printer-bold" />}
            onClick={() => setPrintOpen(true)}
            disabled={pendingAction !== null}
          >
            Print Pack
          </Button>
        </Stack>
      </Stack>
      {printOpen && (
        <PdfPrintLayout title={printTitle} onClose={() => setPrintOpen(false)}>
          {printContent}
        </PdfPrintLayout>
      )}
    </Box>
  );
}
