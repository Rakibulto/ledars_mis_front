import dayjs from 'dayjs';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

const DEFAULT_MONTHS = [...Array(12)].map((_, i) => ({
  label: dayjs().month(i).format('MMM'),
  value: i + 1,
}));

export function MonthSelector({
  selectedMonth,
  onChange,
  months = DEFAULT_MONTHS,
  title = 'Select Month:',
  showTitle = true,
  gridConfig = {
    xs: 'repeat(3, 1fr)',
    sm: 'repeat(4, 1fr)',
    md: 'repeat(6, 1fr)',
    lg: 'repeat(12, 1fr)',
  },
  disabledCondition = null,
  sx = {},
}) {
  const renderMonthButton = (month) => (
    <Button
      key={month.value}
      onClick={() => onChange(month.value)}
      disabled={disabledCondition ? disabledCondition(month.value) : false}
      variant={selectedMonth === month.value ? 'contained' : 'outlined'}
      color={selectedMonth === month.value ? 'primary' : 'inherit'}
      sx={{
        py: 1,
        borderRadius: 1,
        typography: 'body2',
        borderColor: 'divider',
      }}
    >
      {month.label}
    </Button>
  );

  return (
    <Box sx={sx}>
      {showTitle && (
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          {title}
        </Typography>
      )}
      <Box
        sx={{
          display: 'grid',
          gap: 1,
          gridTemplateColumns: gridConfig,
        }}
      >
        {months.map((month) => renderMonthButton(month))}
      </Box>
    </Box>
  );
}
