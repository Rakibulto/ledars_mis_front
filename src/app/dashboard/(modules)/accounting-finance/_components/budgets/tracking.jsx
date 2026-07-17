'use client';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';

import { formatCurrency } from '../utils';
import { useBudgetsWorkspace } from './use-budgets-workspace';
import { BudgetsWorkspaceToolbar } from './budgets-workspace-toolbar';

function SummaryCard({ label, value, helper }) {
  return (
    <Card sx={{ borderRadius: 3, height: '100%' }}>
      <CardContent>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h6" fontWeight={800} sx={{ mt: 0.75 }}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
          {helper}
        </Typography>
      </CardContent>
    </Card>
  );
}

function BudgetTracking() {
  const workspace = useBudgetsWorkspace();
  const [selectedBudgetId, setSelectedBudgetId] = useState(workspace.trackingRows[0]?.id || '');

  useEffect(() => {
    if (!selectedBudgetId && workspace.trackingRows.length) {
      setSelectedBudgetId(workspace.trackingRows[0].id);
    }
  }, [selectedBudgetId, workspace.trackingRows]);

  const selectedTracking =
    workspace.trackingRows.find((row) => String(row.id) === String(selectedBudgetId)) ||
    workspace.trackingRows[0] ||
    null;

  const printContent = (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <thead>
        <tr style={{ background: '#f5f5f5' }}>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>Name</th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Cost Center
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Actual
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Commitments
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Available
          </th>
        </tr>
      </thead>
      <tbody>
        {workspace.trackingRows.map((row) => (
          <tr key={row.id}>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{row.name}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{row.costCenterName}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{row.totalActual}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{row.commitments}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{row.available}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Budget Tracking
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Monitor live commitments, actuals by period, threshold pressure, and available envelope
            across budget plans.
          </Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button
            component={RouterLink}
            href={`${paths.dashboard.accountingFinance.budgets.vsActual}?budget=${selectedBudgetId}`}
            variant="outlined"
            color="inherit"
            startIcon={<Iconify icon="solar:chart-square-bold" />}
          >
            Review Variance
          </Button>
          <Button
            component={RouterLink}
            href={`${paths.dashboard.accountingFinance.budgets.lines}?budget=${selectedBudgetId}`}
            variant="contained"
            startIcon={<Iconify icon="solar:list-check-bold" />}
          >
            Open Lines
          </Button>
        </Stack>
      </Stack>

      <BudgetsWorkspaceToolbar printTitle="Budget Tracking" printContent={printContent} />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Commitments
              </Typography>
              <Typography variant="h6" fontWeight={800}>
                {formatCurrency(workspace.overview.totalCommitments)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Encumbrance
              </Typography>
              <Typography variant="h6" fontWeight={800}>
                {formatCurrency(workspace.overview.totalEncumbrance)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Available Envelope
              </Typography>
              <Typography variant="h6" fontWeight={800}>
                {formatCurrency(workspace.overview.totalAvailable)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Threshold Breaches
              </Typography>
              <Typography variant="h6" fontWeight={800}>
                {workspace.overview.warningPlans + workspace.overview.criticalPlans}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {workspace.trackingRows.map((row) => (
          <Grid key={row.id} size={{ xs: 12, md: 6, xl: 4 }}>
            <Card
              sx={{
                borderRadius: 3,
                borderTop: `4px solid ${row.thresholdStatus === 'critical' ? '#dc2626' : row.thresholdStatus === 'warning' ? '#f59e0b' : '#16a34a'}`,
              }}
              onClick={() => setSelectedBudgetId(row.id)}
            >
              <CardContent>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 1.5 }}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>
                      {row.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {row.owner} • {row.costCenterName}
                    </Typography>
                  </Box>
                  <Chip
                    label={`${row.pressure.toFixed(0)}%`}
                    size="small"
                    color={
                      row.thresholdStatus === 'critical'
                        ? 'error'
                        : row.thresholdStatus === 'warning'
                          ? 'warning'
                          : 'success'
                    }
                  />
                </Stack>
                <Stack spacing={0.75}>
                  <Typography variant="body2" color="text.secondary">
                    Actual {formatCurrency(row.totalActual)} • Commitments{' '}
                    {formatCurrency(row.commitments)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Encumbrance {formatCurrency(row.encumbrance)} • Available{' '}
                    {formatCurrency(row.available)}
                  </Typography>
                </Stack>
                <Button
                  component={RouterLink}
                  href={paths.dashboard.accountingFinance.budgets.trackingDetail(row.id)}
                  size="small"
                  variant="outlined"
                  fullWidth
                  sx={{ mt: 1.5 }}
                  onClick={(event) => event.stopPropagation()}
                >
                  View Details
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default BudgetTracking;
