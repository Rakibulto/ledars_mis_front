import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Avatar from '@mui/material/Avatar';
import CardHeader from '@mui/material/CardHeader';

import { getRandomColor } from 'src/utils/random-color';

import { Label } from 'src/components/label';

// ----------------------------------------------------------------------

export function TodayLeaveList({ title, subheader, list, action, ...other }) {
  const preparedList = list.map((req) => ({
    id: req.id,
    name: req.employee_name,
    avatarUrl: req.profile_picture,
    leaveType: req.leave_policy_name,
    department: req.department_name,
    branch: req.branch_name,
    status: req.status,
    startDate: req.start_date,
    endDate: req.end_date,
    requestedDays: req.requested_days,
    isHalfDay: req.is_half_day,
    halfDayPeriod: req.half_day_period || '',
    labelColor: getRandomColor(),
  }));

  return (
    <Card {...other}>
      <CardHeader title={title} subheader={subheader} action={action} />

      <Box
        sx={{
          p: 3,
          gap: 3,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {preparedList.map((item, index) => (
          <Item key={item.id} item={item} index={index} />
        ))}
      </Box>
    </Card>
  );
}

function Item({ item, index, sx, ...other }) {
  return (
    <Box
      sx={{
        gap: 2,
        display: 'flex',
        alignItems: 'center',
        ...sx,
      }}
      {...other}
    >
      <Avatar
        alt={item.name}
        src={item.avatarUrl}
        variant="rounded"
        sx={{ width: 40, height: 40 }}
      />
      <Box flexGrow={1}>
        <Box sx={{ typography: 'subtitle2' }}>{item.name}</Box>
        <Box sx={{ typography: 'caption', color: 'text.secondary', mt: 0.5 }}>
          {item.department && (
            <span>
              {item.department}
              {item.branch ? ` • ${item.branch}` : ''}
            </span>
          )}
        </Box>
        <Box sx={{ typography: 'caption', color: 'text.secondary', mt: 0.5 }}>
          {item.isHalfDay
            ? `Half Day${item.halfDayPeriod ? ` (${item.halfDayPeriod})` : ''}`
            : `${item.requestedDays} days`}
        </Box>
      </Box>

      <Label color={item.labelColor}>{item.leaveType}</Label>
    </Box>
  );
}
