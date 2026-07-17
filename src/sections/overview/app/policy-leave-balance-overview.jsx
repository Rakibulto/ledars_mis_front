import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import LinearProgress from '@mui/material/LinearProgress';
import TableContainer from '@mui/material/TableContainer';

// ----------------------------------------------------------------------

export function PolicyLeaveBalanceOverview({ policies = [] }) {
  const theme = useTheme();

  if (!policies.length) {
    return (
      <Card sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="subtitle1">No leave policy data available</Typography>
      </Card>
    );
  }

  return (
    <Card>
      <Typography variant="h6" sx={{ p: 2, pb: 1 }}>
        Leave Balance Overview
      </Typography>

      <TableContainer
        sx={{
          maxHeight: 360,
          borderTop: '1px solid',
          borderColor: 'divider',
          '&::-webkit-scrollbar': { width: 6, height: 6 },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: alpha(theme.palette.grey[500], 0.2),
            borderRadius: 1,
          },
        }}
      >
        <Table size="small" aria-label="leave balance table" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Leave Type</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600 }}>
                Allowed
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 600 }}>
                Used
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 600 }}>
                Pending
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 600 }}>
                Remaining
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {policies.map((policy, idx) => {
              const used = policy.chart.find((c) => c.label === 'Used')?.value ?? 0;
              const pending = policy.chart.find((c) => c.label === 'Pending')?.value ?? 0;
              const remaining = policy.chart.find((c) => c.label === 'Remaining')?.value ?? 0;
              const total = policy.total_allowed || 1;
              const usedPercent = (used / total) * 100;

              return (
                <TableRow
                  key={policy.leave_type_name}
                  sx={{
                    bgcolor:
                      idx % 2 === 0
                        ? 'background.default'
                        : alpha(theme.palette.primary.lighter, 0.04),
                    transition: 'background-color 0.2s ease',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.lighter, 0.2),
                    },
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {policy.leave_type_name}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2">{policy.total_allowed}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Stack spacing={0.5}>
                      <Typography variant="body2">{used}</Typography>
                      <LinearProgress
                        variant="determinate"
                        value={usedPercent}
                        color={usedPercent > 75 ? 'error' : 'primary'}
                        sx={{
                          height: 6,
                          borderRadius: 1,
                          bgcolor: alpha(theme.palette.grey[500], 0.12),
                        }}
                      />
                    </Stack>
                  </TableCell>
                  <TableCell align="center">
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: pending > 0 ? 600 : 400,
                        color: pending > 0 ? 'warning.dark' : 'text.primary',
                      }}
                    >
                      {pending}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color: remaining > 0 ? 'success.dark' : 'error.main',
                      }}
                    >
                      {remaining}
                    </Typography>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
}
