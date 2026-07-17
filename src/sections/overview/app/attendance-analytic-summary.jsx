import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import CardHeader from '@mui/material/CardHeader';
import { useTheme, alpha as hexAlpha } from '@mui/material/styles';

import { fNumber } from 'src/utils/format-number';

import { varAlpha } from 'src/theme/styles';

import { Chart, useChart, ChartLegends } from 'src/components/chart';

// ----------------------------------------------------------------------

export function AttendanceAnalyticSummary({
  title,
  subheader,
  actions,
  total,
  chart,
  flag,
  balance,
  ...other
}) {
  const theme = useTheme();

  const chartSeries = chart.series.map((item) => item.value);

  const chartColors =
    (chart.colors ?? (flag && balance))
      ? [
          [theme.palette.primary.light, theme.palette.primary.main],
          [hexAlpha(theme.palette.warning.light, 0.8), hexAlpha(theme.palette.warning.main, 0.8)],
          [hexAlpha(theme.palette.error.light, 0.8), hexAlpha(theme.palette.error.main, 0.8)],
        ]
      : [
          [theme.palette.primary.light, theme.palette.primary.main],
          [hexAlpha(theme.palette.error.light, 0.8), hexAlpha(theme.palette.error.main, 0.8)],
          [hexAlpha(theme.palette.orange.light, 0.8), hexAlpha(theme.palette.orange.main, 0.8)],
          [hexAlpha(theme.palette.pink.light, 0.8), hexAlpha(theme.palette.pink.main, 0.8)],
          [hexAlpha(theme.palette.warning.light, 0.8), hexAlpha(theme.palette.warning.main, 0.8)],
          [hexAlpha(theme.palette.blue.light, 0.8), hexAlpha(theme.palette.blue.main, 0.8)],
          [
            hexAlpha(theme.palette.secondary.light, 0.8),
            hexAlpha(theme.palette.secondary.main, 0.8),
          ],
        ];

  const chartOptions = useChart({
    chart: { sparkline: { enabled: true } },
    colors: chartColors.map((color) => color[1]),
    labels: chart.series.map((item) => item.label),
    stroke: { width: 0 },
    fill: {
      type: 'gradient',
      gradient: {
        colorStops: chartColors.map((color) => [
          { offset: 0, color: color[0], opacity: 1 },
          { offset: 100, color: color[1], opacity: 1 },
        ]),
      },
    },
    grid: { padding: { top: -40, bottom: -40 } },
    plotOptions: {
      radialBar: {
        hollow: { margin: 7, size: flag ? '50%' : '25%' },
        track: { margin: 7, background: varAlpha(theme.vars.palette.grey['500Channel'], 0.08) },
        dataLabels: {
          total: { formatter: () => `${fNumber(total)}` },
          value: {
            offsetY: 2,
            fontSize: theme.typography.h5.fontSize,
            formatter: (val) => fNumber(val),
          },
          name: { offsetY: -10 },
        },
      },
    },
    ...chart.options,
  });

  return (
    <Card {...other}>
      <CardHeader title={title} subheader={subheader} action={actions} />

      <Chart
        type="radialBar"
        series={chartSeries}
        options={chartOptions}
        width={flag ? { xs: 300, xl: 320 } : { xs: 300, xl: 400 }}
        height={flag ? { xs: 300, xl: 320 } : { xs: 300, xl: 400 }}
        sx={{ my: 1.5, mx: 'auto' }}
        loadingProps={{ sx: { p: 4 } }}
      />

      <Divider sx={{ borderStyle: 'dashed' }} />

      <ChartLegends
        labels={chartOptions?.labels}
        colors={chartOptions?.colors}
        values={chartSeries.map((value) => `${fNumber(value)}`)}
        sx={{ p: 3, justifyContent: 'center' }}
      />
    </Card>
  );
}
