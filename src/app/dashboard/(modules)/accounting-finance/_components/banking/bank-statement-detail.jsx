'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CardContent from '@mui/material/CardContent';
import LinearProgress from '@mui/material/LinearProgress';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';

import { formatCurrency } from '../utils';
import { useCurrency } from '../currency-context';
import { useBankingWorkspace } from './use-banking-workspace';

const STATUS_COLORS = {
  completed: 'success',
  in_progress: 'warning',
  imported: 'info',
  draft: 'default',
};

const LINE_STATUS_COLORS = {
  matched: 'success',
  writeoff: 'info',
  counterpart_created: 'primary',
  suggested: 'warning',
  unmatched: 'default',
  duplicate: 'error',
};

function DetailRow({ label, value }) {
  return (
    <TableRow>
      <TableCell sx={{ color: 'text.secondary', width: '40%' }}>{label}</TableCell>
      <TableCell sx={{ fontWeight: 600 }}>{value ?? '—'}</TableCell>
    </TableRow>
  );
}

export default function BankStatementDetail({ id }) {
  useCurrency();
  const { accounts, statements, formatBankingStatus, isLoading } = useBankingWorkspace();

  const statementId = Number(id);
  const statement = statements.find((s) => s.id === statementId);
  const account = statement ? accounts.find((a) => a.id === statement.bankAccountId) : null;

  const resolvedCount =
    statement?.lines.filter((l) =>
      ['matched', 'writeoff', 'counterpart_created'].includes(l.status)
    ).length || 0;
  const resolutionRate = statement?.lines.length
    ? Math.round((resolvedCount / statement.lines.length) * 100)
    : 0;

  if (isLoading && !statement) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!statement) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Bank statement not found.</Alert>
        <Button
          component={RouterLink}
          href={paths.dashboard.accountingFinance.banking.bankStatements}
          startIcon={<Iconify icon="solar:arrow-left-bold" />}
          sx={{ mt: 2 }}
        >
          Back to Bank Statements
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <IconButton
            component={RouterLink}
            href={paths.dashboard.accountingFinance.banking.bankStatements}
          >
            <Iconify icon="solar:arrow-left-bold" />
          </IconButton>
          <Box>
            <Typography variant="h4" fontWeight={800}>
              {statement.bankAccountName} — {statement.period}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {statement.source} via {statement.parser} • Mapping: {statement.mappingProfile}
            </Typography>
          </Box>
          <Chip
            label={formatBankingStatus(statement.status)}
            color={STATUS_COLORS[statement.status]}
          />
        </Stack>
        <Stack direction="row" spacing={1.5}>
          <Button
            component={RouterLink}
            href={paths.dashboard.accountingFinance.banking.reconciliation}
            variant="contained"
            startIcon={<Iconify icon="solar:check-circle-bold" />}
          >
            Send to Reconciliation
          </Button>
        </Stack>
      </Stack>

      {/* Summary cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Opening Balance
              </Typography>
              <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
                {formatCurrency(statement.openingBalance)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                Period start
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Closing Balance
              </Typography>
              <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
                {formatCurrency(statement.closingBalance)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                Period end
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Resolution Rate
              </Typography>
              <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
                {resolutionRate}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={resolutionRate}
                color={resolutionRate === 100 ? 'success' : 'warning'}
                sx={{ mt: 1, borderRadius: 999 }}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Lines
              </Typography>
              <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
                {statement.importedLines}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                {statement.unmatchedCount} open • {statement.duplicateCount} duplicate
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Statement metadata */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
                Statement Info
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <DetailRow label="Bank Account" value={statement.bankAccountName} />
                    <DetailRow label="Account Number" value={account?.maskedNumber} />
                    <DetailRow label="Currency" value={account?.currency} />
                    <DetailRow label="Period" value={statement.period} />
                    <DetailRow
                      label="Start Date"
                      value={
                        statement.startDate
                          ? new Date(statement.startDate).toLocaleDateString()
                          : '—'
                      }
                    />
                    <DetailRow
                      label="End Date"
                      value={
                        statement.endDate ? new Date(statement.endDate).toLocaleDateString() : '—'
                      }
                    />
                    <DetailRow
                      label="Statement Date"
                      value={new Date(statement.statementDate).toLocaleDateString()}
                    />
                    <DetailRow label="Source" value={statement.source} />
                    <DetailRow label="Parser" value={statement.parser} />
                    <DetailRow label="Mapping Profile" value={statement.mappingProfile} />
                    <DetailRow label="Feed Batch" value={statement.feedBatch || '—'} />
                    <DetailRow
                      label="Last Import"
                      value={
                        statement.lastImportAt
                          ? new Date(statement.lastImportAt).toLocaleString()
                          : '—'
                      }
                    />
                    <DetailRow label="Imported Lines" value={statement.importedLines} />
                    <DetailRow label="Unmatched" value={statement.unmatchedCount} />
                    <DetailRow label="Duplicates" value={statement.duplicateCount} />
                    <DetailRow label="Status" value={formatBankingStatus(statement.status)} />
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Lines */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 2 }}
              >
                <Typography variant="h6" fontWeight={800}>
                  Statement Lines
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Chip label={`${resolvedCount} resolved`} size="small" color="success" />
                  <Chip label={`${statement.unmatchedCount} open`} size="small" color="warning" />
                  {statement.duplicateCount > 0 && (
                    <Chip
                      label={`${statement.duplicateCount} duplicate`}
                      size="small"
                      color="error"
                    />
                  )}
                </Stack>
              </Stack>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Reference</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Recommendation</TableCell>
                      <TableCell>Confidence</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {statement.lines.map((line) => (
                      <TableRow key={line.id} hover>
                        <TableCell>{new Date(line.date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {line.description}
                          </Typography>
                          {line.note && (
                            <Typography variant="caption" color="text.secondary">
                              {line.note}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ fontFamily: 'monospace' }}>
                          {line.reference || '—'}
                        </TableCell>
                        <TableCell align="right">
                          <Typography
                            variant="body2"
                            fontWeight={700}
                            color={line.amount >= 0 ? 'success.main' : 'error.main'}
                          >
                            {line.amount >= 0 ? '+' : ''}
                            {formatCurrency(line.amount)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={line.type}
                            size="small"
                            color={line.type === 'credit' ? 'success' : 'error'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={formatBankingStatus(line.status)}
                            size="small"
                            color={LINE_STATUS_COLORS[line.status]}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{line.recommendation || '—'}</Typography>
                          {line.counterpartLabel && (
                            <Typography variant="caption" color="text.secondary">
                              {line.counterpartLabel}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={`${line.confidence}%`}
                            size="small"
                            color={
                              line.confidence >= 90
                                ? 'success'
                                : line.confidence >= 70
                                  ? 'info'
                                  : 'warning'
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
