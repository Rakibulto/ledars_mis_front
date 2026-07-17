import dayjs from 'dayjs';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Avatar from '@mui/material/Avatar';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import LinearProgress, { linearProgressClasses } from '@mui/material/LinearProgress';

import { fPercent } from 'src/utils/format-number';
import { getRandomBgColor } from 'src/utils/random-color';

import { varAlpha } from 'src/theme/styles';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function PendingLeaveList({ title, subheader, list, action, ...other }) {
  return (
    <Card {...other}>
      <CardHeader title={title} subheader={subheader} action={action} />

      <Box sx={{ p: 3, gap: 3, display: 'flex', flexDirection: 'column' }}>
        {list.map((item) => (
          <Item key={item.id} item={item} />
        ))}
      </Box>
    </Card>
  );
}

function Item({ item, sx, ...other }) {
  const percent = (item.used / item.allowed) * 100;

  // Format start and end date as DD-MM-YYYY
  const formattedStartDate = item.startDate ? dayjs(item.startDate).format('DD-MM-YYYY') : '';
  const formattedEndDate = item.endDate ? dayjs(item.endDate).format('DD-MM-YYYY') : '';

  return (
    <Box sx={{ gap: 2, display: 'flex', alignItems: 'center', ...sx }} {...other}>
      <Avatar
        alt={item.title}
        src={item.coverUrl}
        variant="rounded"
        sx={{ width: 40, height: 40 }}
      />
      <Box sx={{ minWidth: 0, display: 'flex', flex: '1 1 auto', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography color="inherit" noWrap sx={{ mb: 0.5, typography: 'subtitle2' }}>
            {item.title}
          </Typography>

          <Label
            color={
              item.status === 'approved'
                ? 'success'
                : item.status === 'pending'
                  ? 'warning'
                  : 'error'
            }
          >
            {item.status}
          </Label>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Box
              sx={{
                gap: 0.5,
                mb: 0.5,
                display: 'flex',
                alignItems: 'center',
                typography: 'caption',
                color: 'text.secondary',
              }}
            >
              <Iconify width={16} icon="solar:calendar-date-bold" />
              {formattedStartDate === formattedEndDate
                ? formattedStartDate
                : `${formattedStartDate} - ${formattedEndDate}`}
              {item.isHalfDay && (
                <Typography
                  component="span"
                  sx={{
                    ml: 0.5,
                    typography: 'caption',
                    color: 'text.secondary',
                    fontWeight: 'fontWeightMedium',
                  }}
                >
                  (Half Day{item.halfDayPeriod ? ` - ${item.halfDayPeriod}` : ''})
                </Typography>
              )}
            </Box>
            {typeof item.allowed !== 'undefined' &&
              typeof item.used !== 'undefined' &&
              typeof item.pending !== 'undefined' && (
                <Box
                  component="span"
                  sx={{ color: 'text.secondary', typography: 'caption', mb: 0.5 }}
                >
                  Allowed: {item.allowed} | Used: {item.used} | Pending: {item.pending} | Remaining:{' '}
                  {item.remaining}
                </Box>
              )}
          </Box>

          {item.requestName && (
            <Box sx={{ gap: 1, display: 'flex', ...sx }}>
              <Box
                sx={{
                  width: 6,
                  my: '3px',
                  height: 16,
                  flexShrink: 0,
                  opacity: 0.24,
                  borderRadius: 1,
                  bgcolor: getRandomBgColor(),
                }}
              />

              <Typography variant="body2">{item.requestName.split(' ')[0]}</Typography>
            </Box>
          )}
        </Box>

        <Box sx={{ width: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
          <LinearProgress
            color="error"
            variant="determinate"
            value={percent}
            sx={{
              width: 1,
              height: 6,
              bgcolor: (theme) => varAlpha(theme.vars.palette.grey['500Channel'], 0.16),
              [` .${linearProgressClasses.bar}`]: { opacity: 0.8 },
            }}
          />
          <Box
            component="span"
            sx={{
              width: 40,
              typography: 'caption',
              color: 'text.secondary',
              fontWeight: 'fontWeightMedium',
            }}
          >
            {fPercent(percent)}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
