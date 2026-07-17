'use client';

import Link from 'next/link';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import LockIcon from '@mui/icons-material/Lock';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import ScheduleIcon from '@mui/icons-material/Schedule';
import TableContainer from '@mui/material/TableContainer';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { useFiscalPeriodsApi } from './use-fiscal-periods-api';
import { CoreLedgerConfigToolbar } from './core-ledger-config-toolbar';

const STATUS_COLORS = { closed: 'default', open: 'success', future: 'info' };
const BASE_PATH = '/dashboard/accounting-finance/configuration/fiscal-periods';

export default function FiscalPeriods() {
  const workspace = useFiscalPeriodsApi();
  const { openYear } = workspace;

  const printContent = (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <thead>
        <tr style={{ background: '#f5f5f5' }}>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Period
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Fiscal Year
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>Start</th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>End</th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Status
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Control Note
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            State Machine
          </th>
        </tr>
      </thead>
      <tbody>
        {workspace.fiscalPeriods.map((period) => (
          <tr key={period.id}>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{period.name}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
              {period.fiscalYearName}
            </td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
              {new Date(period.start_date).toLocaleDateString()}
            </td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
              {new Date(period.end_date).toLocaleDateString()}
            </td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{period.status}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{period.controlNote}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{period.stateMachine}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const handleGeneratePeriods = async () => {
    if (!openYear) return;

    try {
      const result = await workspace.actions.generateFiscalPeriods(openYear.id);
      toast.success(result?.detail || 'Fiscal periods generated successfully.');
    } catch (err) {
      toast.error(String(err?.message || err?.detail || 'Failed to generate fiscal periods.'));
    }
  };

  const handleClosePeriod = async (periodId) => {
    try {
      await workspace.actions.closeFiscalPeriod(periodId);
      toast.success('Fiscal period closed successfully.');
    } catch (err) {
      toast.error(String(err?.message || err?.detail || 'Failed to close fiscal period.'));
    }
  };

  const handleReopenPeriod = async (periodId) => {
    try {
      await workspace.actions.reopenFiscalPeriod(periodId);
      toast.success('Fiscal period reopened successfully.');
    } catch (err) {
      toast.error(String(err?.message || err?.detail || 'Failed to reopen fiscal period.'));
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <CoreLedgerConfigToolbar printTitle="Fiscal Periods" printContent={printContent} />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Fiscal Periods
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage monthly period availability, close posture, and fiscal calendar continuity.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Iconify icon="solar:restart-bold" />}
          onClick={handleGeneratePeriods}
        >
          Generate Periods
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Open periods
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mt: 1,
                }}
              >
                <Typography variant="h5" fontWeight={800}>
                  {workspace.overview.openPeriods}
                </Typography>
                <EventAvailableIcon sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Future periods
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mt: 1,
                }}
              >
                <Typography variant="h5" fontWeight={800}>
                  {workspace.overview.futurePeriods}
                </Typography>
                <ScheduleIcon sx={{ fontSize: 40, color: 'info.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Closed periods
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mt: 1,
                }}
              >
                <Typography variant="h5" fontWeight={800}>
                  {workspace.overview.closedPeriods}
                </Typography>
                <LockIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ borderRadius: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Period</TableCell>
                <TableCell>Fiscal Year</TableCell>
                <TableCell>Start</TableCell>
                <TableCell>End</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Control Note</TableCell>
                <TableCell>State Machine</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {workspace.fiscalPeriods.map((period) => (
                <TableRow
                  key={period.id}
                  hover
                  sx={{ bgcolor: period.status === 'open' ? '#22c55e08' : 'transparent' }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={period.status === 'open' ? 700 : 400}>
                      {period.name}
                    </Typography>
                  </TableCell>
                  <TableCell>{period.fiscalYearName}</TableCell>
                  <TableCell>{new Date(period.start_date).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(period.end_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Chip
                      label={period.status}
                      size="small"
                      color={STATUS_COLORS[period.status] || 'default'}
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{period.lockState}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {period.controlNote}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{period.stateMachine}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {period.reopenAllowed ? 'Eligible for reopen' : 'Reopen not required'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Stack
                      direction="row"
                      spacing={1}
                      justifyContent="flex-end"
                      alignItems="center"
                    >
                      <Tooltip title="View details">
                        <Button
                          component={Link}
                          href={`${BASE_PATH}/${period.id}`}
                          size="small"
                          variant="text"
                        >
                          View Details
                        </Button>
                      </Tooltip>
                      {period.status !== 'closed' ? (
                        <Button
                          size="small"
                          variant="outlined"
                          color="inherit"
                          onClick={() => handleClosePeriod(period.id)}
                        >
                          Close Period
                        </Button>
                      ) : (
                        <Button
                          size="small"
                          variant="text"
                          color="warning"
                          onClick={() => handleReopenPeriod(period.id)}
                        >
                          Reopen
                        </Button>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
