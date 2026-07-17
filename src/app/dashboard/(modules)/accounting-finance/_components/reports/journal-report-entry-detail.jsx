'use client';

import NextLink from 'next/link';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';

import { paths } from 'src/routes/paths';

import { Iconify } from 'src/components/iconify';

import { formatCurrency } from '../utils';
import { getJournalReportEntry } from './mock-data';

const STATUS_COLORS = {
  posted: 'success',
  draft: 'warning',
  pending: 'info',
};

export default function JournalReportEntryDetail({ entryId }) {
  const entry = getJournalReportEntry(entryId);

  if (!entry) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Journal entry not found. The requested record could not be located in the current dataset.
        </Alert>
        <Button
          component={NextLink}
          href={paths.dashboard.accountingFinance.reports.journalReport}
          startIcon={<Iconify icon="solar:list-arrow-left-bold" />}
          variant="outlined"
        >
          Back to Journal Report
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Page Header */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Button
            component={NextLink}
            href={paths.dashboard.accountingFinance.reports.journalReport}
            startIcon={<Iconify icon="solar:list-arrow-left-bold" />}
            variant="text"
            size="small"
            color="inherit"
            sx={{ mb: 0.5, pl: 0 }}
          >
            Journal Report
          </Button>
          <Typography variant="h4" fontWeight={800}>
            {entry.number}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            Full posting detail including line items, partners, and account drilldowns.
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1.25 }} flexWrap="wrap" useFlexGap>
            <Chip label={entry.journal_name} size="small" />
            <Chip
              label={entry.status}
              size="small"
              color={STATUS_COLORS[entry.status] ?? 'default'}
            />
            <Chip label={entry.reviewState} size="small" variant="outlined" />
            <Chip
              label={`${entry.lineCount} line${entry.lineCount !== 1 ? 's' : ''}`}
              size="small"
              variant="outlined"
            />
          </Stack>
        </Box>
      </Stack>

      {/* Metric cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Debit total', value: formatCurrency(entry.debitTotal) },
          { label: 'Credit total', value: formatCurrency(entry.creditTotal) },
          { label: 'Line items', value: entry.lineCount },
          { label: 'Entry date', value: entry.date },
        ].map((item) => (
          <Grid key={item.label} size={{ xs: 12, sm: 6, xl: 3 }}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary">
                  {item.label}
                </Typography>
                <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
                  {item.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Left — Lines table */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Journal Lines
              </Typography>
              <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th
                        align="left"
                        style={{
                          padding: '8px',
                          borderBottom: '1px solid rgba(0,0,0,0.12)',
                          fontWeight: 700,
                          fontSize: 12,
                        }}
                      >
                        Account
                      </th>
                      <th
                        align="left"
                        style={{
                          padding: '8px',
                          borderBottom: '1px solid rgba(0,0,0,0.12)',
                          fontWeight: 700,
                          fontSize: 12,
                        }}
                      >
                        Description
                      </th>
                      <th
                        align="left"
                        style={{
                          padding: '8px',
                          borderBottom: '1px solid rgba(0,0,0,0.12)',
                          fontWeight: 700,
                          fontSize: 12,
                        }}
                      >
                        Partner
                      </th>
                      <th
                        align="right"
                        style={{
                          padding: '8px',
                          borderBottom: '1px solid rgba(0,0,0,0.12)',
                          fontWeight: 700,
                          fontSize: 12,
                        }}
                      >
                        Debit
                      </th>
                      <th
                        align="right"
                        style={{
                          padding: '8px',
                          borderBottom: '1px solid rgba(0,0,0,0.12)',
                          fontWeight: 700,
                          fontSize: 12,
                        }}
                      >
                        Credit
                      </th>
                      <th
                        align="right"
                        style={{
                          padding: '8px',
                          borderBottom: '1px solid rgba(0,0,0,0.12)',
                          fontWeight: 700,
                          fontSize: 12,
                        }}
                      >
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {entry.linesPreview.map((line, index) => (
                      <tr key={line.id || index}>
                        <td style={{ padding: '12px 8px', fontWeight: 600 }}>
                          {line.account_code} — {line.account_name}
                        </td>
                        <td style={{ padding: '12px 8px' }}>{line.description || '—'}</td>
                        <td style={{ padding: '12px 8px' }}>{line.partnerLabel || '—'}</td>
                        <td align="right" style={{ padding: '12px 8px' }}>
                          {line.debit ? formatCurrency(line.debit) : '—'}
                        </td>
                        <td align="right" style={{ padding: '12px 8px' }}>
                          {line.credit ? formatCurrency(line.credit) : '—'}
                        </td>
                        <td align="right" style={{ padding: '12px 8px' }}>
                          <Button
                            size="small"
                            variant="text"
                            component={NextLink}
                            href={paths.dashboard.accountingFinance.transactions.generalLedgerPostingDetail(
                              line.account_code
                            )}
                          >
                            View Account
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td
                        colSpan={3}
                        style={{
                          padding: '10px 8px',
                          borderTop: '2px solid rgba(0,0,0,0.12)',
                          fontWeight: 700,
                        }}
                      >
                        Totals
                      </td>
                      <td
                        align="right"
                        style={{
                          padding: '10px 8px',
                          borderTop: '2px solid rgba(0,0,0,0.12)',
                          fontWeight: 700,
                        }}
                      >
                        {formatCurrency(entry.debitTotal)}
                      </td>
                      <td
                        align="right"
                        style={{
                          padding: '10px 8px',
                          borderTop: '2px solid rgba(0,0,0,0.12)',
                          fontWeight: 700,
                        }}
                      >
                        {formatCurrency(entry.creditTotal)}
                      </td>
                      <td style={{ borderTop: '2px solid rgba(0,0,0,0.12)' }} />
                    </tr>
                  </tfoot>
                </table>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Right — Overview + Partners */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={3}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700}>
                  Entry Overview
                </Typography>
                <Divider sx={{ my: 1.5 }} />
                <Stack spacing={1.25}>
                  {[
                    { label: 'Entry number', value: entry.number },
                    { label: 'Journal', value: entry.journal_name },
                    { label: 'Date', value: entry.date },
                    { label: 'Reference', value: entry.reference || '—' },
                    { label: 'Status', value: entry.status },
                    { label: 'Review state', value: entry.reviewState },
                  ].map((item) => (
                    <Stack
                      key={item.label}
                      direction="row"
                      justifyContent="space-between"
                      spacing={1}
                    >
                      <Typography variant="body2" color="text.secondary">
                        {item.label}
                      </Typography>
                      <Typography variant="body2" fontWeight={600} textAlign="right">
                        {item.value}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700}>
                  Partners
                </Typography>
                <Divider sx={{ my: 1.5 }} />
                {entry.partnerMix.length > 0 ? (
                  <Stack direction="row" flexWrap="wrap" spacing={1} useFlexGap>
                    {entry.partnerMix.map((partner) => (
                      <Chip key={partner} label={partner} size="small" variant="outlined" />
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Internal — no external partners
                  </Typography>
                )}
              </CardContent>
            </Card>

            <Button
              component={NextLink}
              href={paths.dashboard.accountingFinance.reports.journalReport}
              variant="outlined"
              fullWidth
              startIcon={<Iconify icon="solar:list-arrow-left-bold" />}
            >
              Back to Journal Report
            </Button>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
