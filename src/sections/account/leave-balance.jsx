import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import InputAdornment from '@mui/material/InputAdornment';
import LinearProgress from '@mui/material/LinearProgress';

import { useSetState } from 'src/hooks/use-set-state';

import { fDate } from 'src/utils/format-time';

import Loading from 'src/app/dashboard/loading';
import { useGetLeaveBalanceByYear } from 'src/actions/leave';

import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';

import { LeaveRequestListView } from 'src/sections/leave/view/leave-request-list-view';

export function LeaveBalanceDashboard({ employee }) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, idx) => currentYear - idx);

  const filters = useSetState({ year: currentYear, search: '' });

  const { data: leaveBalances = [], dataLoading } = useGetLeaveBalanceByYear(
    employee?.employee_id,
    filters.state.year
  );

  // Filter leave types by search
  const filteredBalances = useMemo(() => {
    if (!filters.state.search) return leaveBalances;
    return leaveBalances.filter((balance) =>
      balance.leave_type_name.toLowerCase().includes(filters.state.search.toLowerCase())
    );
  }, [leaveBalances, filters.state.search]);

  if (dataLoading) return <Loading />;

  if (!leaveBalances.length) {
    return (
      <EmptyContent
        title="No Leave Balance Data"
        description={`No leave balance information found for ${filters.state.year}`}
        sx={{ py: 5 }}
      />
    );
  }

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 3 }}
      >
        <Typography variant="h4">Leave Balance</Typography>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems="center"
          sx={{ mt: { xs: 2, sm: 0 } }}
        >
          <TextField
            size="small"
            placeholder="Search leave type"
            value={filters.state.search}
            onChange={(e) => filters.setField('search', e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" width={20} />
                </InputAdornment>
              ),
            }}
          />

          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="body2">Year:</Typography>
            <Select
              size="small"
              value={filters.state.year}
              onChange={(e) => filters.setField('year', e.target.value)}
              sx={{ minWidth: 100 }}
            >
              {years.map((y) => (
                <MenuItem key={y} value={y}>
                  {y}
                </MenuItem>
              ))}
            </Select>
          </Stack>
        </Stack>
      </Stack>

      <Grid container spacing={3}>
        {filteredBalances.map((balance) => {
          const percentUsed = (balance.used / balance.total_allowed) * 100;
          const percentPending = (balance.pending / balance.total_allowed) * 100;

          return (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={balance.leave_policy_id}>
              <Card>
                <CardContent>
                  {/* Leave Type Header */}
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                    <Iconify icon="solar:calendar-bold" width={24} color="primary.main" />
                    <Typography variant="subtitle1" fontWeight="bold">
                      {balance.leave_type_name}
                    </Typography>
                  </Stack>

                  {/* Date Range */}
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mb: 2, display: 'block' }}
                  >
                    <Iconify
                      icon="solar:calendar-date-bold"
                      width={14}
                      sx={{ mr: 0.5, verticalAlign: 'text-bottom' }}
                    />
                    {fDate(balance.from_date, 'DD MMM YYYY')} -{' '}
                    {fDate(balance.to_date, 'DD MMM YYYY')}
                  </Typography>

                  {/* Balance Summary */}
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                    <Typography variant="h5" fontWeight="bold">
                      {balance.remaining}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      / {balance.total_allowed} days remaining
                    </Typography>
                  </Stack>

                  {/* Progress Bar */}
                  <Box sx={{ position: 'relative', mb: 2 }}>
                    <LinearProgress
                      variant="determinate"
                      value={percentUsed + percentPending}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: 'success.main',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 4,
                          backgroundColor: 'warning.main',
                        },
                      }}
                    />
                    <LinearProgress
                      variant="determinate"
                      value={percentUsed}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 4,
                          backgroundColor: 'error.main',
                        },
                      }}
                    />
                  </Box>

                  {/* Statistics */}
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Box
                        sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'error.main' }}
                      />
                      <Typography variant="caption">
                        Used: <b>{balance.used}</b>
                      </Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Box
                        sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'warning.main' }}
                      />
                      <Typography variant="caption">
                        Pending: <b>{balance.pending}</b>
                      </Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Box
                        sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'success.main' }}
                      />
                      <Typography variant="caption">
                        Remaining: <b>{balance.remaining}</b>
                      </Typography>
                    </Stack>
                  </Stack>

                  {/* Leave Policy Features */}
                  <Stack direction="row" spacing={1}>
                    <Chip
                      size="small"
                      variant="soft"
                      color={balance.counts_holidays ? 'info' : 'default'}
                      label={balance.counts_holidays ? 'Counts Holidays' : 'Excludes Holidays'}
                      icon={
                        <Iconify
                          icon={
                            balance.counts_holidays
                              ? 'eva:checkmark-circle-fill'
                              : 'eva:close-circle-fill'
                          }
                        />
                      }
                    />
                    <Chip
                      size="small"
                      variant="soft"
                      color={balance.counts_weekends ? 'info' : 'default'}
                      label={balance.counts_weekends ? 'Counts Weekends' : 'Excludes Weekends'}
                      icon={
                        <Iconify
                          icon={
                            balance.counts_weekends
                              ? 'eva:checkmark-circle-fill'
                              : 'eva:close-circle-fill'
                          }
                        />
                      }
                    />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Box sx={{ mt: 4 }}>
        <LeaveRequestListView employeeId={employee?.employee_id} flag employee={employee} />
      </Box>
    </Box>
  );
}
