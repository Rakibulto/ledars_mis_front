import dayjs from 'dayjs';

import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Checkbox from '@mui/material/Checkbox';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useBoolean } from 'src/hooks/use-boolean';

import { fDate } from 'src/utils/format-time';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

import { calculateDays } from './utils/leave-utils';
import { LeaveRequestQuickEditForm } from './leave-request-quick-edit-form';

// ----------------------------------------------------------------------

export function LeaveRequestTableRow({
  row,
  selected,
  onSelectRow,
  onDeleteRow,
  canChange,
  canDelete,
  isEmployee,
  user,
  flag = false,
  isAdmin,
}) {
  const quickEdit = useBoolean();
  const confirmDelete = useBoolean();

  const showQuickEdit = Boolean(canChange && row?.status === 'pending');
  const showDelete = Boolean(canDelete && row?.status === 'pending');

  const handleDelete = () => {
    onDeleteRow(row.id);
    confirmDelete.onFalse();
  };

  return (
    <>
      <TableRow hover selected={selected} aria-checked={selected} tabIndex={-1}>
        {canDelete && (
          <TableCell padding="checkbox">
            <Checkbox id={row?.id} checked={selected} onClick={onSelectRow} />
          </TableCell>
        )}
        {/* Only show employee information if it's not an employee view AND flag is false */}
        {!isEmployee && !flag && (
          <TableCell>
            <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
              {isAdmin ? (
                <Link
                  component={RouterLink}
                  href={`${paths.dashboard.user.edit(row?.employee)}?tab=leave`}
                  color="text.primary"
                  underline="hover"
                  sx={{ textAlign: 'left', p: 0, minWidth: 0, typography: 'subtitle1' }}
                >
                  {row?.employee_name}
                </Link>
              ) : (
                <Typography variant="subtitle1" fontWeight={600}>
                  {row?.employee_name}
                </Typography>
              )}
              {row?.employee_id &&
                (isAdmin ? (
                  <Link
                    component={RouterLink}
                    href={`${paths.dashboard.user.edit(row?.employee)}?tab=leave`}
                  >
                    <Label
                      variant="soft"
                      color="blue"
                      sx={{
                        typography: 'caption',
                        fontWeight: 600,
                        borderRadius: '4px',
                        px: 1,
                        fontSize: '14px',
                        cursor: 'pointer',
                      }}
                    >
                      ID: {row?.employee_id}
                    </Label>
                  </Link>
                ) : (
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
                    ID: {row?.employee_id}
                  </Label>
                ))}
              {(row?.department_name || row?.branch_name) &&
                (isAdmin ? (
                  <Link
                    component={RouterLink}
                    href={`${paths.dashboard.user.edit(row?.employee)}?tab=leave`}
                    color="text.secondary"
                    underline="hover"
                    sx={{
                      typography: 'caption',
                      mt: 0.5,
                      display: 'block',
                    }}
                  >
                    {row?.department_name && row?.branch_name
                      ? `${row?.department_name} • ${row?.branch_name}`
                      : row?.department_name || row?.branch_name}
                  </Link>
                ) : (
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.secondary',
                      mt: 0.5,
                      display: 'block',
                    }}
                  >
                    {row?.department_name && row?.branch_name
                      ? `${row?.department_name} • ${row?.branch_name}`
                      : row?.department_name || row?.branch_name}
                  </Typography>
                ))}
            </Stack>
          </TableCell>
        )}
        <TableCell>
          <Typography variant="subtitle1" fontWeight={600}>
            {row?.leave_policy_name}
          </Typography>
        </TableCell>
        <TableCell>{fDate(row?.start_date)}</TableCell>
        <TableCell>{fDate(row?.end_date)}</TableCell>
        <TableCell>
          {row?.requested_days || calculateDays(row?.start_date, row?.end_date)}
          {row?.is_half_day && row?.half_day_period && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              ({row.half_day_period})
            </Typography>
          )}
        </TableCell>
        <TableCell>
          <Typography variant="caption">{row?.reason}</Typography>
        </TableCell>
        <TableCell>
          <Stack direction="column" spacing={0.5}>
            <Label
              color={
                row.status === 'approved'
                  ? 'success'
                  : row.status === 'pending'
                    ? 'warning'
                    : row.status === 'rejected'
                      ? 'error'
                      : 'default'
              }
              sx={{ width: 'fit-content' }}
            >
              {row?.status && row.status.charAt(0).toUpperCase() + row.status.slice(1)}
            </Label>
            {Array.isArray(row?.approval_status_tracking) &&
              row?.approval_status_tracking.length > 0 && (
                <Stack spacing={0.25}>
                  {row.approval_status_tracking.map((track, idx) => (
                    <Typography
                      key={idx}
                      variant="caption"
                      color={
                        track.status === 'approved'
                          ? 'success.main'
                          : track.status === 'pending'
                            ? 'warning.main'
                            : 'error.main'
                      }
                    >
                      {`${track.status.charAt(0).toUpperCase() + track.status.slice(1)} by L${track.level} (${track.approver_name})`}
                    </Typography>
                  ))}
                </Stack>
              )}
            {row?.status !== 'pending' && (
              <Typography variant="caption" color="text.secondary">
                {row?.status_tracking_date &&
                  `Tracked: ${
                    dayjs(row.status_tracking_date, 'DD-MM-YYYY, HH:mm:ss').isValid()
                      ? dayjs(row.status_tracking_date, 'DD-MM-YYYY, HH:mm:ss').format(
                          'DD MMM YYYY, h:mm A'
                        )
                      : row.status_tracking_date
                  }`}
              </Typography>
            )}
          </Stack>
        </TableCell>
        <TableCell>
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            {showQuickEdit && (
              <Tooltip title="Quick Edit" placement="top" arrow>
                <IconButton
                  onClick={quickEdit.onTrue}
                  color={quickEdit.value ? 'inherit' : 'default'}
                >
                  <Iconify icon="solar:pen-bold" />
                </IconButton>
              </Tooltip>
            )}

            {showDelete && (
              <Tooltip title="Delete" placement="top" arrow>
                <IconButton
                  onClick={confirmDelete.onTrue}
                  color={confirmDelete.value ? 'inherit' : 'default'}
                >
                  <Iconify icon="solar:trash-bin-trash-bold" />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </TableCell>
      </TableRow>
      {canChange && (
        <LeaveRequestQuickEditForm
          currentRequest={row}
          open={quickEdit.value}
          onClose={quickEdit.onFalse}
          addEntry={false}
          isEmployee={isEmployee}
          user={user}
          flag={flag}
        />
      )}
      {canDelete && (
        <ConfirmDialog
          open={confirmDelete.value}
          onClose={confirmDelete.onFalse}
          title="Delete"
          content="Are you sure you want to delete this leave request?"
          action={
            <Button variant="contained" color="error" onClick={handleDelete}>
              Delete
            </Button>
          }
        />
      )}
    </>
  );
}
