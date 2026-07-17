import dayjs from 'dayjs';

import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';

import { useBoolean } from 'src/hooks/use-boolean';

import { formatDuration, formatTimestamp } from 'src/utils/format-time';

import { CONFIG } from 'src/config-global';

import { Label } from 'src/components/label';
import { EmptyContent } from 'src/components/empty-content';

import {
  getStatusColor,
  calculateWorkingHours,
} from 'src/sections/attendance/utils/attendance-utils';

import { AttendanceInfoDialog } from './attendance-info-dialog';
import { AttendanceTimestampForm } from './attendance-timestamp-form';

// ----------------------------------------------------------------------

export function UserAttendanceTableRow({ row, selected, flag, user, isAdmin }) {
  const dialog = useBoolean();
  const attendance = useBoolean();

  if (!row) {
    return (
      <EmptyContent
        filled
        title="Attendance records not found!"
        sx={{ py: 10, height: 'auto', flexGrow: 'unset' }}
      />
    );
  }

  let checkInDevice = 'N/A';
  let checkOutDevice = 'N/A';

  if (row?.timestamps && row.timestamps.length > 0) {
    const firstTimestamp = row.timestamps[0];
    if (typeof firstTimestamp === 'object' && firstTimestamp.device_serial_number) {
      checkInDevice = firstTimestamp.device_serial_number;
    }

    if (row.timestamps.length > 1) {
      const lastTimestamp = row.timestamps[row.timestamps.length - 1];
      if (typeof lastTimestamp === 'object' && lastTimestamp.device_serial_number) {
        checkOutDevice = lastTimestamp.device_serial_number;
      }
    }
  }

  const checkInFormatted = formatTimestamp(row?.check_in);
  const checkOutFormatted = formatTimestamp(row?.check_out);

  const calculatedWorkingHours = calculateWorkingHours(row?.check_in, row?.check_out);

  const status = row?.status || 'N/A';

  return (
    <>
      <TableRow hover selected={selected} aria-checked={selected} tabIndex={-1}>
        <TableCell />

        {flag && (
          <TableCell sx={{ cursor: 'pointer' }} onClick={dialog.onTrue}>
            <Stack spacing={2} direction="row" alignItems="center">
              <Avatar
                src={`${CONFIG.serverUrl}${row?.user_info?.profile_picture}`}
                alt={row?.user_info?.employee_name}
                sx={{ width: 48, height: 48 }}
              >
                {row?.user_info?.employee_name?.charAt(0).toUpperCase() || 'U'}
              </Avatar>

              <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  {row?.user_info?.employee_name || 'Unknown'}
                </Typography>

                {row?.user_info?.employeeId && (
                  <Label
                    variant="soft"
                    color="blue"
                    sx={{
                      typography: 'caption',
                      fontWeight: 600,
                      borderRadius: '4px',
                      px: 1,
                      fontSize: '14px',
                    }}
                  >
                    ID: {row?.user_info?.employeeId}
                  </Label>
                )}

                {(row?.user_info?.department ||
                  row?.user_info?.designation ||
                  row?.user_info?.branch) && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.secondary',
                      mt: 0.5,
                      display: 'block',
                    }}
                  >
                    {[
                      row?.user_info?.department,
                      row?.user_info?.designation,
                      row?.user_info?.branch,
                    ]
                      .filter(Boolean)
                      .join(' • ')}
                  </Typography>
                )}
              </Stack>
            </Stack>
          </TableCell>
        )}

        <TableCell sx={{ cursor: 'pointer' }} onClick={dialog.onTrue}>
          <Stack direction="row" spacing={1} alignItems="center">
            {row?.date}
          </Stack>
        </TableCell>

        <TableCell>{checkInFormatted}</TableCell>

        <TableCell>
          {checkOutFormatted === 'N/A' ? (
            <Label variant="soft" color={getStatusColor(row)}>
              {checkOutFormatted}
            </Label>
          ) : (
            <Typography variant="body2">{checkOutFormatted}</Typography>
          )}
        </TableCell>

        <TableCell>
          {!row?.late_by ? (
            <Label variant="soft" color={getStatusColor(row)}>
              N/A
            </Label>
          ) : (
            <Typography variant="body2">{formatDuration(row?.late_by)}</Typography>
          )}
        </TableCell>
        <TableCell>
          {!row?.early_out_by ? (
            <Label variant="soft" color={getStatusColor(row)}>
              N/A
            </Label>
          ) : (
            <Typography variant="body2">{formatDuration(row?.early_out_by)}</Typography>
          )}
        </TableCell>

        <TableCell>
          <Tooltip
            title={`Check In: ${checkInFormatted}\nCheck Out: ${checkOutFormatted}`}
            componentsProps={{
              tooltip: {
                sx: {
                  whiteSpace: 'pre-line',
                },
              },
            }}
          >
            <Label
              variant="soft"
              color={
                (status === 'Present' && 'success') ||
                (status === 'Late' && 'orange') ||
                (status === 'Early Leave' && 'pink') ||
                (status === 'Absent' && 'error') ||
                (status === 'Overtime' && 'blue') ||
                (status === 'Not Detected' && 'warning') ||
                (status === 'Half Day' && 'tertiary') ||
                (status === 'Half Day Leave' && 'tertiary') ||
                (status === 'Holiday' && 'blue') ||
                (status === 'Weekend' && 'secondary') ||
                (status === 'Leave' && 'warning') ||
                'default'
              }
            >
              {status === 'Early Leave' ? 'Early Out' : status}
            </Label>
          </Tooltip>
        </TableCell>

        {isAdmin && (
          <TableCell>
            {(user?.role === 'Admin' || row?.user_info?.id !== user?.id) && (
              <Button
                variant="contained"
                color="secondary"
                onClick={attendance.onTrue}
                sx={{
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                    background: 'linear-gradient(135deg, #4f46e5, #4338ca)',
                  },
                }}
              >
                Add In/Out
              </Button>
            )}
          </TableCell>
        )}
      </TableRow>

      <AttendanceTimestampForm
        currentEntry={row}
        open={attendance.value}
        onClose={attendance.onFalse}
      />

      {row?.status !== 'Absent' && (
        <AttendanceInfoDialog
          dialog={dialog}
          timestamps={
            row?.timestamps || (row?.check_in ? [row.check_in, row.check_out].filter(Boolean) : [])
          }
          status={status}
          color={getStatusColor(row)}
          date={row?.date}
          checkOut={row?.check_out || ''}
          dayOfWeek={dayjs(row.date, 'DD-MM-YYYY').format('dddd') || ''}
          employeeName={row?.user_info?.employee_name || 'Unknown'}
          employeeId={row?.user_info?.employeeId}
          department={row?.user_info?.department}
          designation={row?.user_info?.designation}
          branch={row?.user_info?.branch}
          userId={row?.user_info?.id}
          flag={!!flag}
          late_by={row?.late_by}
          early_out_by={row?.early_out_by}
          totalWorkedHours={calculatedWorkingHours || row?.actual_work_duration || 0}
          remarks={row?.remarks || ''}
        />
      )}
    </>
  );
}
