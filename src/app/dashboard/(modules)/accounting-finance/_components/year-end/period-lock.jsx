'use client';

import { toast } from 'sonner';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import TableContainer from '@mui/material/TableContainer';

import { Iconify } from 'src/components/iconify';

import { useYearEndWorkspace } from './use-year-end-workspace';
import { YearEndWorkspaceToolbar } from './year-end-workspace-toolbar';
import { exportYearEndCsv, exportYearEndJson, exportYearEndExcel } from './year-end-export';

export default function PeriodLock() {
  const [pendingAction, setPendingAction] = useState(null);
  const {
    selectedFiscalYearId,
    fiscalYears,
    periods,
    lockSummary,
    closeCalendar,
    lockHistory,
    exceptionPermissions,
    actions,
  } = useYearEndWorkspace();
  const selectedYear = fiscalYears.find((year) => year.id === selectedFiscalYearId);
  const openPeriods = periods.filter((period) => period.status !== 'closed').length;

  const exportConfig = useMemo(
    () => ({
      title: 'Period Lock Pack',
      subtitle: selectedYear?.name || 'Fiscal period controls',
      alerts: [
        {
          title: openPeriods ? `${openPeriods} periods are still open` : 'All periods are locked',
          description:
            'Lock posture should only be finalized after reconciliations and close review are complete.',
        },
      ],
      summary: [
        { label: 'Fiscal year', value: selectedYear?.name || 'N/A' },
        { label: 'Open periods', value: openPeriods },
        { label: 'Closed periods', value: periods.length - openPeriods },
      ],
      tables: [
        {
          title: 'Fiscal Periods',
          columns: [
            { key: 'name', label: 'Period' },
            { key: 'start_date', label: 'Start Date' },
            { key: 'end_date', label: 'End Date' },
            { key: 'status', label: 'Status' },
            { key: 'lockType', label: 'Lock Type' },
          ],
          rows: periods,
        },
        {
          title: 'Close Calendar',
          columns: [
            { key: 'name', label: 'Period' },
            { key: 'close_window', label: 'Close Window' },
            { key: 'review_owner', label: 'Review Owner' },
            { key: 'checklist', label: 'Checklist' },
          ],
          rows: closeCalendar,
        },
        {
          title: 'Lock History',
          columns: [
            { key: 'period_name', label: 'Period' },
            { key: 'action', label: 'Action' },
            { key: 'actor', label: 'Actor' },
            { key: 'timestamp', label: 'Timestamp' },
          ],
          rows: lockHistory,
        },
      ],
      payload: {
        selectedYear,
        periods,
        lockSummary,
        closeCalendar,
        lockHistory,
        exceptionPermissions,
      },
    }),
    [
      closeCalendar,
      exceptionPermissions,
      lockHistory,
      lockSummary,
      openPeriods,
      periods,
      selectedYear,
    ]
  );

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

  const printContent = (
    <div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 16 }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
              Period
            </th>
            <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
              Start
            </th>
            <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>End</th>
            <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
              Status
            </th>
            <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
              Lock Type
            </th>
          </tr>
        </thead>
        <tbody>
          {periods.map((period, idx) => (
            <tr key={idx}>
              <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{period.name}</td>
              <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{period.start_date}</td>
              <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{period.end_date}</td>
              <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{period.status}</td>
              <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{period.lockType}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 16 }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
              Period
            </th>
            <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
              Close Window
            </th>
            <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
              Review Owner
            </th>
            <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
              Checklist
            </th>
          </tr>
        </thead>
        <tbody>
          {closeCalendar.map((item, idx) => (
            <tr key={idx}>
              <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{item.name}</td>
              <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{item.close_window}</td>
              <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{item.review_owner}</td>
              <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{item.checklist}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
              Period
            </th>
            <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
              Action
            </th>
            <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
              Actor
            </th>
            <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
              Timestamp
            </th>
          </tr>
        </thead>
        <tbody>
          {lockHistory.map((entry, idx) => (
            <tr key={idx}>
              <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{entry.period_name}</td>
              <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{entry.action}</td>
              <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{entry.actor}</td>
              <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{entry.timestamp}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        spacing={2}
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography variant="h5" fontWeight={800}>
            Period Lock
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Soft and hard close controls for fiscal periods during year-end certification.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<Iconify icon="solar:lock-bold" />}
            onClick={() =>
              runAction(
                'Lock Remaining Periods',
                () => Promise.resolve(actions.lockAllPeriods(selectedFiscalYearId)),
                'All periods locked'
              )
            }
            disabled={pendingAction !== null}
          >
            Lock All
          </Button>
        </Stack>
      </Stack>

      <Alert severity={openPeriods ? 'warning' : 'success'} sx={{ mb: 3, borderRadius: 2 }}>
        {openPeriods
          ? 'Some fiscal periods are still open for posting. Lock them only after controller review is complete.'
          : 'All fiscal periods in scope are locked and ready for close certification.'}
      </Alert>

      <YearEndWorkspaceToolbar
        fiscalYears={fiscalYears}
        selectedFiscalYearId={selectedFiscalYearId}
        onFiscalYearChange={actions.setFiscalYear}
        exportDisabled={pendingAction !== null}
        onExportExcel={() =>
          runAction(
            'Export Locks Excel',
            () => exportYearEndExcel('period-lock', exportConfig),
            'Period lock workbook exported'
          )
        }
        onExportCsv={() =>
          runAction(
            'Export Locks CSV',
            () => exportYearEndCsv('period-lock', exportConfig),
            'Period lock CSV exported'
          )
        }
        onExportJson={() =>
          runAction(
            'Export Locks JSON',
            () => exportYearEndJson('period-lock', exportConfig),
            'Period lock JSON exported'
          )
        }
        printTitle="Period Lock"
        printContent={printContent}
      />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {lockSummary.map((item) => (
          <Grid key={item.id} size={{ xs: 12, md: 6 }}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="body2" fontWeight={700}>
                      {item.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.description}
                    </Typography>
                  </Box>
                  <Chip
                    label={item.type}
                    size="small"
                    color={item.type === 'hard' ? 'error' : 'warning'}
                  />
                </Stack>
                <Typography variant="h6" fontWeight={800} sx={{ mt: 2 }}>
                  {item.lock_date}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          {
            label: 'Open periods',
            value: openPeriods,
            helper: 'Posting windows that still allow late journal activity',
          },
          {
            label: 'Hard close posture',
            value: periods.filter((period) => period.lockType === 'hard').length,
            helper: 'Periods already promoted into hard-close state',
          },
          {
            label: 'Active exceptions',
            value: exceptionPermissions.filter((permission) => permission.active).length,
            helper: 'Roles currently allowed to bypass lock posture',
          },
        ].map((item) => (
          <Grid key={item.label} size={{ xs: 12, md: 4 }}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary">
                  {item.label}
                </Typography>
                <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
                  {item.value}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                  {item.helper}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Close Calendar
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Period</TableCell>
                      <TableCell>Close Window</TableCell>
                      <TableCell>Review Owner</TableCell>
                      <TableCell>Checklist</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {closeCalendar.map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.close_window}</TableCell>
                        <TableCell>{item.review_owner}</TableCell>
                        <TableCell>{item.checklist}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Exception Permissions
              </Typography>
              <Stack spacing={1.5}>
                {exceptionPermissions.map((permission) => (
                  <Box
                    key={permission.id}
                    sx={{ p: 2, borderRadius: 2, bgcolor: 'background.neutral' }}
                  >
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      spacing={1}
                      alignItems="center"
                    >
                      <Box>
                        <Typography variant="body2" fontWeight={700}>
                          {permission.role}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {permission.scope} - {permission.reason}
                        </Typography>
                      </Box>
                      <Button
                        size="small"
                        variant={permission.active ? 'contained' : 'outlined'}
                        color={permission.active ? 'warning' : 'inherit'}
                        onClick={() =>
                          runAction(
                            permission.active
                              ? `Disable ${permission.role}`
                              : `Enable ${permission.role}`,
                            () =>
                              Promise.resolve(
                                actions.updateExceptionPermission(
                                  selectedFiscalYearId,
                                  permission.id,
                                  !permission.active
                                )
                              ),
                            permission.active
                              ? `${permission.role} exception disabled`
                              : `${permission.role} exception enabled`
                          )
                        }
                        disabled={pendingAction !== null}
                      >
                        {permission.active ? 'Disable' : 'Enable'}
                      </Button>
                    </Stack>
                  </Box>
                ))}
              </Stack>
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
                <TableCell>Start Date</TableCell>
                <TableCell>End Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Lock Type</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {periods.map((period) => (
                <TableRow key={period.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700}>
                      {period.name}
                    </Typography>
                  </TableCell>
                  <TableCell>{period.start_date}</TableCell>
                  <TableCell>{period.end_date}</TableCell>
                  <TableCell>
                    <Chip
                      label={period.status}
                      size="small"
                      color={
                        period.status === 'closed'
                          ? 'success'
                          : period.status === 'active'
                            ? 'warning'
                            : 'default'
                      }
                    />
                  </TableCell>
                  <TableCell>{period.lockType}</TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={() =>
                        runAction(
                          `Lock ${period.name}`,
                          () => Promise.resolve(actions.lockPeriod(period.id)),
                          `${period.name} locked`
                        )
                      }
                      disabled={!period.canLock || pendingAction !== null}
                    >
                      Lock
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Card sx={{ borderRadius: 3, mt: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
            Lock History
          </Typography>
          <Stack spacing={1.5}>
            {lockHistory.length ? (
              lockHistory.map((entry) => (
                <Box key={entry.id} sx={{ p: 2, borderRadius: 2, bgcolor: 'background.neutral' }}>
                  <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    justifyContent="space-between"
                    spacing={1}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight={700}>
                        {entry.period_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {entry.action} by {entry.actor} at {entry.timestamp}
                      </Typography>
                    </Box>
                    <Chip
                      label={entry.lock_type}
                      size="small"
                      color={entry.lock_type === 'hard' ? 'error' : 'warning'}
                    />
                  </Stack>
                </Box>
              ))
            ) : (
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                Lock history will appear here as periods are locked or reopened during the year-end
                sequence.
              </Alert>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
