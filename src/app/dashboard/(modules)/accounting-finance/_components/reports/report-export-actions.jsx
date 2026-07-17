'use client';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';

import { Iconify } from 'src/components/iconify';

const ACTION_META = {
  csv: { label: 'Export CSV', icon: 'solar:download-minimalistic-bold', variant: 'outlined' },
  excel: { label: 'Export Excel', icon: 'solar:file-download-bold', variant: 'outlined' },
  json: { label: 'Export JSON', icon: 'solar:code-bold', variant: 'outlined' },
  print: { label: 'Print Pack', icon: 'solar:printer-bold', variant: 'contained' },
};

export function ReportExportActions({ actions = [] }) {
  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
      {actions.filter(Boolean).map((action) => {
        const meta = ACTION_META[action.key] || ACTION_META.csv;

        return (
          <Button
            key={action.key}
            variant={action.variant || meta.variant}
            color={action.color}
            startIcon={<Iconify icon={action.icon || meta.icon} />}
            onClick={action.onClick}
            disabled={Boolean(action.disabled)}
          >
            {action.label || meta.label}
          </Button>
        );
      })}
    </Stack>
  );
}
