import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import ListItemText from '@mui/material/ListItemText';
// import Typography from '@mui/material/Typography';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';

import { useBoolean } from 'src/hooks/use-boolean';

import { fDate, fToNow } from 'src/utils/format-time';

import { Iconify } from 'src/components/iconify';

import { ProbationApprovalDialog } from 'src/sections/employee/probation-approval-dialog';
import { AdjustmentApprovalView } from 'src/sections/attendance/view/adjustment-approval-view';
import { LeaveApprovalQuickEditForm } from 'src/sections/leave/leave-approval-quick-edit-form';

// ----------------------------------------------------------------------

export function NotificationItem({ notification }) {
  const addLeave = useBoolean();
  const adjustmentDialog = useBoolean();
  const probationDialog = useBoolean();

  const handleNotificationClick = () => {
    if (notification?.type === 'leave' && notification?.notification_id) {
      addLeave.onTrue();
    } else if (notification?.type === 'probation_period' && notification?.id) {
      probationDialog.onTrue();
    }
  };

  const handleAttendanceAdjustmentReview = () => {
    if (notification?.type === 'attendance_adjustment' && notification?.notification_id) {
      adjustmentDialog.onTrue();
    }
  };

  const getNotificationIcon = (notif) => {
    const title = (notif.title || '').toLowerCase();
    if (title.includes('approved') || title.includes('updated'))
      return <Iconify icon="solar:check-circle-bold-duotone" color="success.main" />;
    if (title.includes('rejected'))
      return <Iconify icon="solar:danger-triangle-bold-duotone" color="error.main" />;
    if (notif.type === 'leave')
      return <Iconify icon="solar:calendar-mark-bold-duotone" color="info.main" />;
    if (notif.type === 'attendance_adjustment')
      return <Iconify icon="solar:clock-circle-bold-duotone" color="blue.main" />;
    if (notif.type === 'probation_period')
      return <Iconify icon="solar:user-id-bold-duotone" color="secondary.main" />;
    return <Iconify icon="solar:notification-unread-lines-bold-duotone" color="primary.main" />;
  };

  const getNotificationColors = (notif) => {
    const title = (notif.title || '').toLowerCase();
    if (title.includes('approved')) return { bgcolor: 'success.lighter', color: 'success.main' };
    if (title.includes('rejected')) return { bgcolor: 'error.lighter', color: 'error.main' };
    if (notif.type === 'leave') return { bgcolor: 'info.lighter', color: 'info.main' };
    if (notif.type === 'attendance_adjustment')
      return { bgcolor: 'blue.lighter', color: 'blue.main' };
    if (notif.type === 'probation_period')
      return { bgcolor: 'secondary.lighter', color: 'secondary.main' };
    return { bgcolor: 'background.neutral', color: 'text.primary' };
  };

  const avatarColors = getNotificationColors(notification);

  const renderAvatar = (
    <ListItemAvatar>
      {notification.avatarUrl ? (
        <Avatar src={notification.avatarUrl} sx={{ bgcolor: avatarColors.bgcolor }} />
      ) : (
        <Stack
          alignItems="center"
          justifyContent="center"
          sx={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            bgcolor: avatarColors.bgcolor,
            color: avatarColors.color,
          }}
        >
          {getNotificationIcon(notification)}
        </Stack>
      )}
    </ListItemAvatar>
  );

  const renderEmployeeInfo = notification?.employee && (
    <Box sx={{ mt: 1, typography: 'caption', mb: 1, color: 'text.secondary' }}>
      {notification.employee.employee_info?.employee_name || notification.employee.username}
      {notification.employee.employee_info?.employee_id && (
        <> (ID: {notification.employee.employee_info.employee_id})</>
      )}
      {notification.employee.email && <> | {notification.employee.email}</>}
      {notification.employee.employee_info?.employment_type && (
        <> | {notification.employee.employee_info.employment_type}</>
      )}
      {notification.employee.employee_info?.joining_date && (
        <> | Joined: {fDate(notification.employee.employee_info.joining_date)}</>
      )}
    </Box>
  );

  const renderText = (
    <ListItemText
      disableTypography
      primary={reader(notification.title)}
      secondary={
        <>
          <Stack
            direction="row"
            alignItems="center"
            sx={{ typography: 'caption', color: 'text.disabled' }}
            divider={
              <Box
                sx={{
                  width: 2,
                  height: 2,
                  bgcolor: 'currentColor',
                  mx: 0.5,
                  borderRadius: '50%',
                }}
              />
            }
          >
            {fToNow(notification.createdAt)}
            {notification.type.charAt(0).toUpperCase() +
              notification.type.slice(1).replace('_', ' ')}
          </Stack>
          <Box sx={{ typography: 'caption', color: 'text.primary' }}>{notification?.remarks}</Box>
          {renderEmployeeInfo}
        </>
      }
    />
  );

  const renderUnReadBadge = notification.isUnRead && (
    <Box
      sx={{
        top: 26,
        width: 8,
        height: 8,
        right: 20,
        borderRadius: '50%',
        bgcolor: 'info.main',
        position: 'absolute',
      }}
    />
  );

  // Leave approval action for leave notifications
  const leaveApprovalAction = (
    <Stack spacing={1} direction="row" sx={{ mt: 1.5 }}>
      <Button
        size="small"
        variant="soft"
        onClick={handleNotificationClick}
        startIcon={<Iconify icon="mage:preview-fill" />}
        color="info"
      >
        Review Request
      </Button>
    </Stack>
  );

  // Attendance adjustment action for attendance_adjustment notifications
  const attendanceAdjustmentAction = (
    <Stack spacing={1} direction="row" sx={{ mt: 1.5 }}>
      <Button
        size="small"
        variant="soft"
        onClick={handleAttendanceAdjustmentReview}
        startIcon={<Iconify icon="mage:preview-fill" />}
        color="primary"
      >
        Review Adjustment
      </Button>
    </Stack>
  );

  // Probation approval action for probation_period notifications
  const probationApprovalAction = (
    <Stack spacing={1} direction="row" sx={{ mt: 1.5 }}>
      <Button
        size="small"
        variant="soft"
        onClick={() => probationDialog.onTrue()}
        startIcon={<Iconify icon="mage:preview-fill" />}
        color="secondary"
      >
        Review Probation
      </Button>
    </Stack>
  );

  return (
    <ListItemButton
      disableRipple
      onClick={
        notification?.type === 'leave' && notification?.notification_id
          ? handleNotificationClick
          : notification?.type === 'probation_period' && notification?.id
            ? handleNotificationClick
            : undefined
      }
      sx={{
        p: 2.5,
        alignItems: 'flex-start',
        borderBottom: (theme) => `dashed 1px ${theme.vars.palette.divider}`,
        borderRadius: 5,
        cursor:
          (notification?.type === 'leave' && notification?.notification_id) ||
          (notification?.type === 'attendance_adjustment' && notification?.notification_id) ||
          (notification?.type === 'probation_period' && notification?.id)
            ? 'pointer'
            : 'default',
      }}
    >
      {renderUnReadBadge}
      {renderAvatar}
      <Stack sx={{ flexGrow: 1 }}>
        {renderText}
        {notification.type === 'leave' && notification?.notification_id && leaveApprovalAction}
        {notification.type === 'attendance_adjustment' &&
          notification?.notification_id &&
          attendanceAdjustmentAction}
        {notification.type === 'probation_period' && notification?.id && probationApprovalAction}
      </Stack>

      {/* Only open dialog for leave notifications with notification_id */}
      {notification.type === 'leave' && notification?.notification_id && (
        <LeaveApprovalQuickEditForm
          open={addLeave.value}
          onClose={addLeave.onFalse}
          id={notification.notification_id}
        />
      )}

      {/* Open dialog for attendance adjustment notifications */}
      {notification.type === 'attendance_adjustment' && notification?.notification_id && (
        <AdjustmentApprovalView
          open={adjustmentDialog.value}
          onClose={adjustmentDialog.onFalse}
          id={adjustmentDialog.value ? notification.notification_id : null}
        />
      )}

      {/* Open dialog for probation period notifications */}
      {notification.type === 'probation_period' && notification?.id && (
        <ProbationApprovalDialog
          open={probationDialog.value}
          onClose={probationDialog.onFalse}
          notification={notification}
        />
      )}
    </ListItemButton>
  );
}

// ----------------------------------------------------------------------

function reader(data) {
  return (
    <Box
      dangerouslySetInnerHTML={{ __html: data }}
      sx={{
        mb: 0.5,
        '& p': { typography: 'body2', m: 0 },
        '& a': { color: 'inherit', textDecoration: 'none' },
        '& strong': { typography: 'subtitle2' },
      }}
    />
  );
}
