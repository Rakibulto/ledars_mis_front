import { useRouter } from 'next/navigation';

import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { endpoints } from 'src/utils/axios';

export const TIME_PERIODS = [
  { value: 'today', label: 'Today', endpoint: endpoints.attendance.todayv2, view: 'daily' },
  {
    value: 'yesterday',
    label: 'Yesterday',
    view: 'daily',
  },
  {
    value: 'thisWeek',
    label: 'This Week',
    view: 'monthly',
  },
  {
    value: 'last7Days',
    label: 'Last 7 Days',
    view: 'monthly',
  },
  {
    value: 'last15Days',
    label: 'Last 15 Days',
    view: 'monthly',
  },
  {
    value: 'last30Days',
    label: 'Last 30 Days',
    view: 'monthly',
  },
  {
    value: 'thisMonth',
    label: 'This Month',
    endpoint: endpoints.attendance.thisMonthv2,
    view: 'monthly',
  },
  {
    value: 'lastMonth',
    label: 'Last Month',
    endpoint: endpoints.attendance.lastMonthv2,
    view: 'monthly',
  },
];

export function TimePeriodSelector({ value, onChange, theme }) {
  const router = useRouter();

  const handleTimePeriodChange = (event, newValue) => {
    if (newValue !== null) {
      const period = TIME_PERIODS.find((p) => p.value === newValue);

      if (period.view === 'monthly') {
        router.push(`/dashboard/attendance/monthly?period=${newValue}`);
      } else {
        onChange(event, newValue);
      }
    }
  };

  return (
    <Card sx={{ p: 2, mb: 3 }}>
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        Select Time Period
      </Typography>
      <ToggleButtonGroup
        value={value}
        exclusive
        color="primary"
        onChange={handleTimePeriodChange}
        aria-label="time period"
        sx={{
          flexWrap: 'wrap',
          width: '100%',
          '& .MuiToggleButtonGroup-grouped': {
            flex: '1 1 120px',
            minWidth: 120,
          },
        }}
      >
        {TIME_PERIODS.map((period) => (
          <ToggleButton key={period.value} value={period.value} aria-label={period.label}>
            {period.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Card>
  );
}
