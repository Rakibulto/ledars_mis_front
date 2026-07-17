'use client';

import useSWR from 'swr';
import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import LinearProgress from '@mui/material/LinearProgress';

import { paths } from 'src/routes/paths';

import { fetcher, endpoints } from 'src/utils/axios';

import { formatCurrency } from '../utils';
import { getDeferredRevenueById } from './mock-data';
import { enrichDeferredRevenue } from './use-deferred-revenue-api';
import TransactionDetailShell, {
  formatDetailDate,
  TransactionRecordNotFound,
} from './transaction-detail-shell';

const STATUS_COLORS = {
  in_progress: 'warning',
  done: 'success',
};

function getScheduleState(record) {
  const today = new Date('2026-03-30');
  const start = new Date(record.start_date);
  const end = new Date(record.end_date);
  const cappedDate = today > end ? end : today;

  if (cappedDate < start) {
    return { elapsedPeriods: 0, expectedRecognized: 0, catchUpAmount: 0 };
  }

  const elapsedPeriods = Math.max(
    0,
    Math.min(
      Number(record.periods || 0),
      (cappedDate.getFullYear() - start.getFullYear()) * 12 +
        cappedDate.getMonth() -
        start.getMonth() +
        1
    )
  );
  const expectedRecognized = Math.min(
    Number(record.total_amount || 0),
    elapsedPeriods * Number(record.monthlyRecognition || 0)
  );

  return {
    elapsedPeriods,
    expectedRecognized,
    catchUpAmount: Math.max(0, expectedRecognized - Number(record.recognized_amount || 0)),
  };
}

function SelectedScheduleCard({ record, onRecognize }) {
  const totalAmount = Number(record.total_amount || 0);
  const recognizedAmount = Number(record.recognized_amount || 0);
  const monthlyRecognition = Number(record.monthlyRecognition || 0);
  const { elapsedPeriods, expectedRecognized, catchUpAmount } = getScheduleState(record);
  const remainingBalance = Math.max(0, totalAmount - recognizedAmount);
  const progressPercent = totalAmount ? Math.round((recognizedAmount / totalAmount) * 100) : 0;

  return (
    <Card sx={{ mb: 3, borderRadius: 3 }}>
      <CardContent>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
          Selected Schedule
        </Typography>
        <Stack spacing={2}>
          <Box>
            <Typography variant="h6" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
              {record.reference}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {record.description}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progressPercent}
            sx={{ height: 10, borderRadius: 999 }}
          />
          <Typography variant="caption" color="text.secondary">
            Progress {progressPercent}%
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Remaining
              </Typography>
              <Typography variant="body2" fontWeight={700}>
                {formatCurrency(remainingBalance)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Expected by now
              </Typography>
              <Typography variant="body2" fontWeight={700}>
                {formatCurrency(expectedRecognized)}
              </Typography>
            </Box>
          </Box>
          <Alert severity={catchUpAmount > 0 ? 'warning' : 'success'}>
            {catchUpAmount > 0
              ? `Recognition is behind plan by ${formatCurrency(catchUpAmount)}.`
              : 'Recognition is aligned with the current schedule.'}
          </Alert>
          <Divider />
          <Stack spacing={1}>
            <Typography variant="subtitle2" fontWeight={700}>
              Control Review
            </Typography>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2">Elapsed periods</Typography>
              <Typography variant="body2" fontWeight={600}>
                {elapsedPeriods} / {record.periods}
              </Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2">Monthly recognition</Typography>
              <Typography variant="body2" fontWeight={600}>
                {formatCurrency(monthlyRecognition)}
              </Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2">Status</Typography>
              <Chip
                label={record.status.replace(/_/g, ' ')}
                size="small"
                color={STATUS_COLORS[record.status]}
                sx={{ textTransform: 'capitalize' }}
              />
            </Stack>
          </Stack>
          <Button
            variant="contained"
            disabled={record.status === 'done'}
            onClick={onRecognize}
          >
            Recognize Current Period
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function DeferredRevenueDetail({ recordId }) {
  const isNumeric = !Number.isNaN(Number(recordId));
  const { data: rawRecord } = useSWR(
    isNumeric ? endpoints.accounting.deferred_revenue_by_id(recordId) : null,
    fetcher
  );
  const [record, setRecord] = useState(
    isNumeric ? null : (getDeferredRevenueById(recordId) ?? null)
  );
  useEffect(() => {
    if (rawRecord) setRecord(enrichDeferredRevenue(rawRecord));
  }, [rawRecord]);

  if (!record) {
    return (
      <TransactionRecordNotFound
        title="Deferred Revenue"
        backHref={paths.dashboard.accountingFinance.transactions.deferredRevenue}
      />
    );
  }

  const remaining = Number(record.total_amount || 0) - Number(record.recognized_amount || 0);
  const progress = Number(record.total_amount || 0)
    ? `${Math.round((Number(record.recognized_amount || 0) / Number(record.total_amount || 0)) * 100)}%`
    : '0%';
  const { elapsedPeriods, expectedRecognized, catchUpAmount } = getScheduleState(record);

  const handleRecognize = () => {
    setRecord((current) => {
      const nextRecognized = Math.min(
        Number(current.total_amount || 0),
        Number(current.recognized_amount || 0) + Number(current.monthlyRecognition || 0)
      );
      return {
        ...current,
        recognized_amount: nextRecognized,
        status: nextRecognized >= Number(current.total_amount || 0) ? 'done' : 'in_progress',
      };
    });
  };

  return (
    <>
      <SelectedScheduleCard record={record} onRecognize={handleRecognize} />
      <TransactionDetailShell
        title="Deferred Revenue Detail"
        subtitle="Recognition schedule for unearned revenue, grant installments, and service retainers."
        documentNumber={record.reference}
        backHref={paths.dashboard.accountingFinance.transactions.deferredRevenue}
        chips={[
          <Chip
            key="status"
            label={record.status.replace(/_/g, ' ')}
            size="small"
            color={STATUS_COLORS[record.status]}
            sx={{ textTransform: 'capitalize' }}
          />,
          ...(catchUpAmount > 0
            ? [
                <Chip
                  key="catch-up"
                  label="Catch up required"
                  size="small"
                  color="error"
                  variant="outlined"
                />,
              ]
            : []),
        ]}
        actions={[
          {
            label: 'Recognize revenue',
            icon: 'solar:chart-square-bold',
            variant: 'contained',
            disabled: record.status === 'done',
            onClick: handleRecognize,
          },
        ]}
        summary={[
          { label: 'Deferred revenue', value: formatCurrency(record.total_amount) },
          { label: 'Recognized to date', value: formatCurrency(record.recognized_amount) },
          {
            label: 'Remaining balance',
            value: formatCurrency(remaining),
            helper: `Progress ${progress}`,
          },
          {
            label: 'Expected by now',
            value: formatCurrency(expectedRecognized),
            helper: `${elapsedPeriods} of ${record.periods} periods elapsed`,
          },
        ]}
        sections={[
          {
            title: 'Schedule Overview',
            items: [
              { label: 'Start date', value: formatDetailDate(record.start_date) },
              { label: 'End date', value: formatDetailDate(record.end_date) },
              { label: 'Recognition periods', value: record.periods },
              { label: 'Monthly recognition', value: formatCurrency(record.monthlyRecognition) },
              { label: 'Description', value: record.description, fullWidth: true },
            ],
          },
          {
            title: 'Recognition Control Plan',
            items: [
              { label: 'Elapsed periods', value: `${elapsedPeriods} / ${record.periods}` },
              { label: 'Expected recognized', value: formatCurrency(expectedRecognized) },
              { label: 'Catch-up required', value: formatCurrency(catchUpAmount) },
              {
                label: 'Control posture',
                value:
                  catchUpAmount > 0
                    ? 'Recognition is behind the planned release profile.'
                    : 'Recognition is aligned with the planned release profile.',
                fullWidth: true,
              },
            ],
          },
        ]}
        sidebar={[
          {
            title: 'Recognition Control',
            items: [
              {
                primary: 'Schedule status',
                secondary: 'Revenue recognition completion state',
                meta: record.status.replace(/_/g, ' '),
              },
              {
                primary: 'Remaining balance',
                secondary: 'Unearned revenue still on balance sheet',
                meta: formatCurrency(remaining),
              },
              {
                primary: 'Catch-up gap',
                secondary: 'Recognition still needed to align with elapsed periods',
                meta: formatCurrency(catchUpAmount),
              },
            ],
          },
        ]}
        controlChecks={[
          {
            label: 'Recognition completion',
            description: 'Schedule progress toward earned revenue release',
            status: record.status === 'done' ? 'success' : 'warning',
            value: progress,
          },
          {
            label: 'Balance remaining',
            description: 'Unearned revenue still carried on the balance sheet',
            status: remaining > 0 ? 'info' : 'success',
            value: formatCurrency(remaining),
          },
          {
            label: 'Schedule alignment',
            description: 'Comparison of expected recognition versus actual released revenue',
            status: catchUpAmount > 0 ? 'warning' : 'success',
            value: catchUpAmount > 0 ? formatCurrency(catchUpAmount) : 'On track',
          },
        ]}
        timeline={[
          {
            label: 'Schedule started',
            description: record.description,
            status: `${record.periods} periods`,
            tone: 'info',
            time: formatDetailDate(record.start_date),
            icon: 'solar:calendar-mark-bold',
          },
          {
            label: 'Revenue recognition',
            description: `Monthly run ${formatCurrency(record.monthlyRecognition)}`,
            status: record.status.replace(/_/g, ' '),
            tone: record.status === 'done' ? 'success' : 'warning',
            icon: 'solar:chart-square-bold',
          },
          {
            label: 'Control review',
            description:
              catchUpAmount > 0
                ? `Catch-up required ${formatCurrency(catchUpAmount)}`
                : 'Recognition aligned with elapsed periods',
            status: `${elapsedPeriods}/${record.periods} periods elapsed`,
            tone: catchUpAmount > 0 ? 'warning' : 'success',
            icon: 'solar:clipboard-check-bold',
          },
        ]}
      />
    </>
  );
}