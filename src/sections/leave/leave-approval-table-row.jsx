import dayjs from 'dayjs';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { useBoolean } from 'src/hooks/use-boolean';

import { fDateTime } from 'src/utils/format-time';

import { useGetApprovalByRequestId } from 'src/actions/leave';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

import { calculateLeaveDays } from './utils/leave-utils';
import { LeaveApprovalQuickEditForm } from './leave-approval-quick-edit-form';

// ----------------------------------------------------------------------

export function LeaveApprovalTableRow({
  row,
  selected,
  onSelectRow,
  onDeleteRow,
  canChange,
  canDelete,
  isGrouped = false,
  isAdmin = false,
  onBulkStatusChange,
  currentUserId,
  isSupervisor = false,
}) {
  const quickEdit = useBoolean();
  const confirmDelete = useBoolean();

  // Helper to check if approver is current user
  const isMe = (approverId) => String(approverId) === String(currentUserId);

  const { data: approvalStatusTracking = [] } = useGetApprovalByRequestId(
    isGrouped ? row.leave_request : null
  );

  const groupedApprovalTracking = isGrouped ? approvalStatusTracking : row.approval_status_tracking;

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
        <TableCell>
          <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
            <Typography variant="subtitle1" fontWeight={600}>
              {row?.employee_name}
            </Typography>
            {row?.employee_id && (
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
            )}
            {(row?.department_name || row?.branch_name) && (
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
            )}
          </Stack>
        </TableCell>
        <TableCell>
          <Typography fontWeight={600}>{row?.leave_request_name}</Typography>
          {row?.applied_leave_balance && (
            <Box sx={{ mt: 1 }} maxWidth={180}>
              <Alert
                severity="info"
                variant="outlined"
                sx={{
                  p: 0.5,
                  typography: 'caption',
                  '& .MuiAlert-icon': { mr: 0.5 },
                  '& .MuiAlert-message': { mt: 0, mb: 0, p: 0 },
                }}
              >
                <Typography variant="caption" component="span">
                  Allowed: <b>{row.applied_leave_balance.total_allowed}</b>, Used:{' '}
                  <b>{row.applied_leave_balance.used}</b>, Pending:{' '}
                  <b>{row.applied_leave_balance.pending}</b>, Remaining:{' '}
                  <b>{row.applied_leave_balance.remaining}</b>
                </Typography>
              </Alert>
            </Box>
          )}
        </TableCell>
        <TableCell>{row?.leave_from}</TableCell>
        <TableCell>{row?.leave_to}</TableCell>
        <TableCell width={200}>
          {row?.requested_days || calculateLeaveDays(row?.leave_from, row?.leave_to)}
          <br />
          <Typography variant="caption" color="text.secondary">
            {row?.reason
              ? row.reason.length > 50
                ? `${row.reason.slice(0, 50)}…`
                : row.reason
              : 'No reason provided'}
          </Typography>
        </TableCell>
        <TableCell>
          {isGrouped && row?.approvers ? (
            <Stack>
              {row?.approvers?.map((a, idx) => {
                const track = Array.isArray(groupedApprovalTracking)
                  ? groupedApprovalTracking.find(
                      (t) => String(t.approver) === String(a.approver) && t.level === a.level
                    )
                  : null;
                return (
                  <Box
                    key={a?.approver}
                    sx={{
                      width: 285,
                      p: 0.5,
                      bgcolor: 'background.neutral',
                      borderRadius: 1,
                      border: (theme) => `1px solid ${theme.palette.divider}`,
                      mb: idx < row.approvers.length - 1 ? 1 : 0,
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      {!isMe(a?.approver) && (
                        <>
                          <Typography variant="caption" fontWeight={600}>
                            {a?.approver_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            (Level {a?.level})
                          </Typography>
                        </>
                      )}
                      <Label
                        color={
                          track?.status === 'approved'
                            ? 'success'
                            : track?.status === 'pending'
                              ? 'warning'
                              : track?.status === 'rejected'
                                ? 'error'
                                : 'default'
                        }
                      >
                        {track?.status
                          ? track.status.charAt(0).toUpperCase() + track.status.slice(1)
                          : 'Pending'}
                      </Label>
                    </Stack>
                    {/* Only show approval_status_tracking if not admin */}
                    {!isAdmin && (
                      <Stack spacing={0.25} sx={{ mt: 1 }}>
                        {Array.isArray(row?.approval_status_tracking) &&
                          row.approval_status_tracking.length > 0 &&
                          row.approval_status_tracking.map((trackStatus, i) => (
                            <Box key={i} sx={{ mb: 1 }}>
                              <Typography
                                variant="caption"
                                color={
                                  trackStatus.status === 'approved'
                                    ? 'success.main'
                                    : trackStatus.status === 'pending'
                                      ? 'warning.main'
                                      : 'error.main'
                                }
                              >
                                {`${trackStatus.status.charAt(0).toUpperCase() + trackStatus.status.slice(1)} by L${trackStatus.level}${
                                  isMe(trackStatus.approver)
                                    ? ''
                                    : ` (${trackStatus.approver_name})`
                                }`}
                              </Typography>
                              {track.comments && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ display: 'block', ml: 1.5 }}
                                >
                                  {track.comments}
                                </Typography>
                              )}
                              {/* Show updated_at if status is approved or rejected */}
                              {(track.status === 'approved' || track.status === 'rejected') &&
                                track.updated_at && (
                                  <Typography
                                    variant="caption"
                                    color="text.primary"
                                    sx={{ mt: 0.5, ml: 1.5 }}
                                  >
                                    {fDateTime(track.updated_at)}
                                  </Typography>
                                )}
                            </Box>
                          ))}
                      </Stack>
                    )}
                    {a?.comments && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', mt: 0.25, ml: 1.5 }}
                      >
                        {a.comments}
                      </Typography>
                    )}
                    {/* Show updated_at for this approver if status is approved/rejected */}
                    {track &&
                      (track.status === 'approved' || track.status === 'rejected') &&
                      track.updated_at && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mt: 0.5, ml: 1.5 }}
                        >
                          {dayjs(track.updated_at, 'DD-MM-YYYY, HH:mm:ss').isValid()
                            ? dayjs(track.updated_at, 'DD-MM-YYYY, HH:mm:ss').format(
                                'DD MMM YYYY, h:mm A'
                              )
                            : track.updated_at}
                        </Typography>
                      )}
                  </Box>
                );
              })}
            </Stack>
          ) : (
            <>
              {!isMe(row?.approver) && (
                <Typography fontWeight={600}>{row?.approver_name}</Typography>
              )}
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
                sx={{ width: 'auto', mr: 1 }}
              >
                {row?.status && row.status.charAt(0).toUpperCase() + row.status.slice(1)}
              </Label>
              {/* Only show approval_status_tracking if not admin */}
              {!isAdmin && (
                <>
                  <Typography
                    variant="caption"
                    color={
                      row.status === 'approved'
                        ? 'success.main'
                        : row.status === 'pending'
                          ? 'warning.main'
                          : 'error.main'
                    }
                  >
                    {`${row.status.charAt(0).toUpperCase() + row.status.slice(1)} by L${row.level}${
                      isMe(row.approver) ? '' : ` (${row.approver_name})`
                    }`}
                  </Typography>
                  {row?.comments && (
                    <Typography variant="caption" color="text.secondary" ml={1.5}>
                      {row.comments}
                    </Typography>
                  )}
                  {(row?.status === 'approved' || row?.status === 'rejected') && (
                    <Typography variant="caption">
                      {' '}
                      {dayjs(row?.updated_at, 'DD-MM-YYYY, HH:mm:ss').isValid()
                        ? dayjs(row?.updated_at, 'DD-MM-YYYY, HH:mm:ss').format(
                            'DD MMM YYYY, h:mm A'
                          )
                        : row?.updated_at}
                    </Typography>
                  )}

                  <Stack spacing={0.25} sx={{ mt: 1 }}>
                    {Array.isArray(row?.approval_status_tracking) &&
                      row.approval_status_tracking.length > 0 &&
                      row.approval_status_tracking
                        .filter((track) => !isMe(track.approver))
                        .sort((a, b) => a.level - b.level)
                        .map((track, i) => (
                          <Box key={i}>
                            <Typography
                              variant="caption"
                              color={
                                track.status === 'approved'
                                  ? 'success.main'
                                  : track.status === 'pending'
                                    ? 'warning.main'
                                    : 'error.main'
                              }
                            >
                              {`${track.status.charAt(0).toUpperCase() + track.status.slice(1)} by L${track.level}${
                                isMe(track.approver) ? '' : ` (${track.approver_name})`
                              }`}
                            </Typography>
                            {track.comments && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: 'block', ml: 1.5 }}
                              >
                                {track.comments}
                              </Typography>
                            )}
                            {(track.status === 'approved' || track.status === 'rejected') &&
                              track.updated_at && (
                                <Typography
                                  variant="caption"
                                  color="text.tertiary"
                                  sx={{ display: 'block', ml: 1.5, fontSize: '0.7rem' }}
                                >
                                  {dayjs(track.updated_at, 'DD-MM-YYYY, HH:mm:ss').isValid()
                                    ? dayjs(track.updated_at, 'DD-MM-YYYY, HH:mm:ss').format(
                                        'DD MMM YYYY, h:mm A'
                                      )
                                    : track.updated_at}
                                </Typography>
                              )}
                          </Box>
                        ))}
                  </Stack>
                </>
              )}
            </>
          )}
        </TableCell>
        <TableCell>
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            {/* Show bulk action for admin, edit for non-admin */}
            {isAdmin && isGrouped ? (
              <>
                <Tooltip title="Approve All" placement="top" arrow>
                  <IconButton
                    color="success"
                    onClick={() => onBulkStatusChange?.(row.leave_request, 'approved')}
                  >
                    <Iconify icon="solar:check-circle-bold" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Reject All" placement="top" arrow>
                  <IconButton
                    color="error"
                    onClick={() => onBulkStatusChange?.(row.leave_request, 'rejected')}
                  >
                    <Iconify icon="solar:danger-triangle-bold" />
                  </IconButton>
                </Tooltip>
              </>
            ) : (
              canChange && (
                <Tooltip title="Quick Edit" placement="top" arrow>
                  <IconButton
                    onClick={quickEdit.onTrue}
                    color={quickEdit.value ? 'inherit' : 'default'}
                  >
                    <Iconify icon="solar:pen-bold" />
                  </IconButton>
                </Tooltip>
              )
            )}
            {canDelete && (
              <Tooltip title="Delete" placement="top" arrow>
                <IconButton
                  onClick={confirmDelete.onTrue}
                  color={quickEdit.value ? 'inherit' : 'default'}
                >
                  <Iconify icon="solar:trash-bin-trash-bold" />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </TableCell>
      </TableRow>
      {/* Only show quick edit for non-admin or non-grouped */}
      {((!isAdmin && canChange) || isSupervisor) && (
        <LeaveApprovalQuickEditForm
          currentApproval={row}
          open={quickEdit.value}
          onClose={quickEdit.onFalse}
          addEntry={false}
          currentUserId={currentUserId}
        />
      )}
      {canDelete && (
        <ConfirmDialog
          open={confirmDelete.value}
          onClose={confirmDelete.onFalse}
          title="Delete"
          content="Are you sure you want to delete this leave approval?"
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
