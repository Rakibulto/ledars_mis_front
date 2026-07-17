'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import PdfPrintLayout from 'src/app/dashboard/(modules)/accounting-finance/_components/shared/pdf-print-layout';

import { Iconify } from 'src/components/iconify';

const NAV_ITEMS = [
  { label: 'Overview', href: paths.dashboard.accountingFinance.yearEnd.root },
  { label: 'Closing', href: paths.dashboard.accountingFinance.yearEnd.yearEndClosing },
  { label: 'Opening Entries', href: paths.dashboard.accountingFinance.yearEnd.openingEntries },
  { label: 'Period Lock', href: paths.dashboard.accountingFinance.yearEnd.periodLock },
];

export function YearEndWorkspaceToolbar({
  fiscalYears,
  selectedFiscalYearId,
  onFiscalYearChange,
  exportDisabled,
  onExportExcel,
  onExportCsv,
  onExportJson,
  printTitle = 'Year-End Workspace',
  printContent = null,
}) {
  const pathname = usePathname();
  const [printOpen, setPrintOpen] = useState(false);

  return (
    <Box sx={{ mb: 3 }}>
      <Stack
        direction={{ xs: 'column', lg: 'row' }}
        spacing={1.5}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', lg: 'center' }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.25}>
          <TextField
            select
            size="small"
            label="Fiscal year"
            value={selectedFiscalYearId || ''}
            onChange={(event) => onFiscalYearChange(Number(event.target.value))}
            sx={{ minWidth: 220 }}
          >
            {fiscalYears.map((year) => (
              <MenuItem key={year.id} value={year.id}>
                {year.name}
              </MenuItem>
            ))}
          </TextField>
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
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<Iconify icon="solar:document-bold" />}
            onClick={onExportExcel}
            disabled={exportDisabled}
          >
            Export Excel
          </Button>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<Iconify icon="solar:download-minimalistic-bold" />}
            onClick={onExportCsv}
            disabled={exportDisabled}
          >
            Export CSV
          </Button>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<Iconify icon="solar:code-bold" />}
            onClick={onExportJson}
            disabled={exportDisabled}
          >
            Export JSON
          </Button>
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:printer-bold" />}
            onClick={() => setPrintOpen(true)}
            disabled={exportDisabled}
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
