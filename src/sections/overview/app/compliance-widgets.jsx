import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import { useTheme } from '@mui/material/styles';
import CardHeader from '@mui/material/CardHeader';

import { useResponsive } from 'src/hooks/use-responsive';

import { Chart, useChart } from 'src/components/chart';

// ----------------------------------------------------------------------

export function ComplianceWidgets({ chart, title, subheader, ...other }) {
  const theme = useTheme();

  const smUp = useResponsive('up', 'sm');

  const chartColors = [
    [theme.palette.orange.light, theme.palette.orange.main],
    [theme.palette.pink.light, theme.palette.pink.main],
    [theme.palette.error.light, theme.palette.error.main],
  ];

  const chartOptions = useChart({
    chart: { sparkline: { enabled: true } },
    stroke: { width: 0 },
    fill: {
      type: 'gradient',
      gradient: {
        colorStops: [
          { offset: 0, color: chartColors[0][0], opacity: 1 },
          { offset: 100, color: chartColors[0][1], opacity: 1 },
        ],
      },
    },
    plotOptions: {
      radialBar: {
        dataLabels: {
          name: { show: false },
          value: {
            offsetY: 6,
            fontSize: theme.typography.subtitle2.fontSize,
            fontWeight: theme.typography.subtitle2.fontWeight,
          },
        },
      },
    },
    ...chart.options,
  });

  return (
    <Card {...other}>
      <CardHeader title={title} subheader={subheader} />
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        divider={
          <Divider
            flexItem
            orientation={smUp ? 'vertical' : 'horizontal'}
            sx={{ borderStyle: 'dashed' }}
          />
        }
      >
        {chart.series.map((item, idx) => (
          <Box
            key={item.label}
            sx={{
              py: 5,
              gap: 1,
              width: 1,
              display: 'flex',
              flexDirection: 'column',
              px: { xs: 3, sm: 0 },
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
            }}
          >
            <Chart
              type="radialBar"
              series={[item.percent]}
              options={{
                ...chartOptions,
                fill: {
                  type: 'gradient',
                  gradient: {
                    colorStops: [
                      { offset: 0, color: chartColors[idx][0], opacity: 1 },
                      { offset: 100, color: chartColors[idx][1], opacity: 1 },
                    ],
                  },
                },
              }}
              width={80}
              height={80}
            />

            <Box sx={{ typography: 'subtitle2' }}>{item.label}</Box>

            <Box sx={{ mb: 0.5, typography: 'caption', color: 'text.disabled' }}>
              {item.label === 'Late Arrival %' && '(late count / present count) × 100'}
              {item.label === 'Early Out %' && '(early leave / present count) × 100'}
              {item.label === 'Avg. Absence Days/Employee' && 'absent count / total employees'}
            </Box>
          </Box>
        ))}
      </Stack>
    </Card>
  );
}
