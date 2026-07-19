'use client';

import { Fragment, useMemo, useState } from 'react';
import { mutate } from 'swr';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { useGetRequest } from 'src/actions/ledars-hook';

import { endpoints } from 'src/utils/axios';

import { exportExpenditureWorkbook } from './plan-tables-excel';
import { PlanTableExcelToolbar } from './plan-table-excel-toolbar';
import { importProjectExpenditureExcel } from './use-project-managements-api';

const TONES = {
  border: '#9e9e9e',
  header: '#f0f0f0',
  section: '#e8e8e8',
  main: '#f5f5f5',
  sub: '#ffffff',
  meta: '#fff8f0',
};

const PERIOD_TABS = [
  { value: 'yearly', label: 'Yearly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'weekly', label: 'Weekly' },
];

function formatMoney(value) {
  if (value === null || value === undefined || value === '') return '';
  const num = Number(value);
  if (Number.isNaN(num)) return '';
  return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return value;
  }
}

function cellSx(options = {}) {
  return {
    border: `1px solid ${TONES.border} !important`,
    px: 1,
    py: 0.85,
    fontSize: 12,
    verticalAlign: 'middle',
    ...options,
  };
}

function PeriodSubHeaders() {
  return (
    <>
      <TableCell align="center" sx={cellSx({ bgcolor: TONES.header, fontWeight: 700, fontSize: 11 })}>
        Unit No.
      </TableCell>
      <TableCell align="center" sx={cellSx({ bgcolor: TONES.header, fontWeight: 700, fontSize: 11 })}>
        Unit cost
      </TableCell>
      <TableCell align="center" sx={cellSx({ bgcolor: TONES.header, fontWeight: 700, fontSize: 11 })}>
        Cost
      </TableCell>
    </>
  );
}

export function ProjectExpenditurePanel({ projectId }) {
  const [period, setPeriod] = useState('yearly');
  const url = projectId ? endpoints.projectManagements.projectExpenditure(projectId, period) : null;
  const { data, isLoading, error } = useGetRequest(url);

  const periods = data?.periods || data?.years || [];
  const rows = data?.rows || [];
  const project = data?.project || {};
  const currency = project.currency || 'BDT';
  const colSpan = useMemo(() => 5 + periods.length * 3, [periods.length]);

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 1 }}>
        Failed to load project expenditure from this project&apos;s plans.
      </Alert>
    );
  }

  return (
    <Stack spacing={1.5}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        spacing={1.5}
        alignItems={{ xs: 'stretch', sm: 'center' }}
      >
        <Box
          sx={{
            border: `1px solid ${TONES.border}`,
            bgcolor: TONES.meta,
            px: 2,
            py: 1.5,
            flex: 1,
          }}
        >
          <Typography variant="body2" fontWeight={800}>
            Project title: {project.title || '—'}
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            Project partner: {project.partner || 'LEDARS'}
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            Project period: {formatDate(project.start_date)} to {formatDate(project.end_date)}
          </Typography>
          {project.budget_code ? (
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              Budget code: {project.budget_code}
            </Typography>
          ) : null}
        </Box>

        <Stack spacing={1} alignItems={{ xs: 'stretch', sm: 'flex-end' }}>
          <Tabs
            value={period}
            onChange={(_, value) => setPeriod(value)}
            sx={{
              minHeight: 40,
              '& .MuiTab-root': { minHeight: 36, textTransform: 'none', fontWeight: 700 },
            }}
          >
            {PERIOD_TABS.map((tab) => (
              <Tab key={tab.value} value={tab.value} label={tab.label} />
            ))}
          </Tabs>
          <PlanTableExcelToolbar
            disabled={!projectId || isLoading}
            onDownload={() => exportExpenditureWorkbook(data, period)}
            onUpload={async (file) => {
              await importProjectExpenditureExcel(projectId, file);
              await mutate(endpoints.projectManagements.projectExpenditure(projectId, period));
              return 'Expenditure Excel imported. Unit No and Unit Cost were updated from the file.';
            }}
          />
        </Stack>
      </Stack>

      <Typography variant="subtitle1" fontWeight={800} textAlign="center">
        Expenditure plan ({period})
      </Typography>
      <Typography variant="caption" color="text.secondary" textAlign="center" display="block">
        Period splits are calculated from unit distribution date ranges (working days only: Mon–Thu).
      </Typography>

      {isLoading ? (
        <Stack alignItems="center" sx={{ py: 6 }}>
          <CircularProgress size={28} />
        </Stack>
      ) : !rows.length ? (
        <Typography variant="body2" color="text.secondary">
          No plan activities found. Add Project Plans with Unit No / Unit Cost and unit distribution
          date ranges to populate this expenditure table.
        </Typography>
      ) : (
        <TableContainer
          sx={{
            border: `1px solid ${TONES.border}`,
            overflowX: 'auto',
            bgcolor: '#fff',
          }}
        >
          <Table
            size="small"
            sx={{
              minWidth: 900 + periods.length * 160,
              borderCollapse: 'collapse',
              '& .MuiTableCell-root': {
                border: `1px solid ${TONES.border} !important`,
              },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell rowSpan={3} sx={cellSx({ bgcolor: TONES.header, fontWeight: 800 })}>
                  Budget Code
                </TableCell>
                <TableCell rowSpan={3} sx={cellSx({ bgcolor: TONES.header, fontWeight: 800 })}>
                  Expenditure items
                </TableCell>
                <TableCell rowSpan={3} sx={cellSx({ bgcolor: TONES.header, fontWeight: 800 })}>
                  Unit No
                </TableCell>
                <TableCell rowSpan={3} sx={cellSx({ bgcolor: TONES.header, fontWeight: 800 })}>
                  Unit Cost
                </TableCell>
                <TableCell
                  colSpan={Math.max(periods.length * 3, 1)}
                  align="center"
                  sx={cellSx({ bgcolor: TONES.header, fontWeight: 800 })}
                >
                  Planned expenditure in national currency ({currency})
                </TableCell>
                <TableCell rowSpan={3} sx={cellSx({ bgcolor: TONES.header, fontWeight: 800 })}>
                  Total planned expenditure ({currency})
                </TableCell>
              </TableRow>
              <TableRow>
                {periods.length ? (
                  periods.map((item) => (
                    <TableCell
                      key={item.index}
                      colSpan={3}
                      align="center"
                      sx={cellSx({ bgcolor: TONES.header, fontWeight: 700, fontSize: 11 })}
                    >
                      {item.label}
                    </TableCell>
                  ))
                ) : (
                  <TableCell sx={cellSx({ bgcolor: TONES.header })}>
                    Set project start/end dates to show period columns
                  </TableCell>
                )}
              </TableRow>
              <TableRow>
                {periods.map((item) => (
                  <PeriodSubHeaders key={item.index} />
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, index) => {
                const isSection = row.row_type === 'section';
                const isMain = row.row_type === 'main';
                const bg = isSection ? TONES.section : isMain ? TONES.main : TONES.sub;
                const splits = row.period_splits || row.year_splits || [];

                if (isSection) {
                  return (
                    <TableRow key={`section-${index}`}>
                      <TableCell colSpan={colSpan} sx={cellSx({ bgcolor: bg, fontWeight: 800 })}>
                        {row.title}
                      </TableCell>
                    </TableRow>
                  );
                }

                return (
                  <TableRow key={`${row.row_type}-${row.budget_code}-${index}`}>
                    <TableCell sx={cellSx({ bgcolor: bg, fontWeight: isMain ? 700 : 400 })}>
                      {row.budget_code}
                    </TableCell>
                    <TableCell
                      sx={cellSx({
                        bgcolor: bg,
                        fontWeight: isMain ? 700 : 400,
                        pl: isMain ? 1 : 2,
                      })}
                    >
                      {row.title}
                    </TableCell>
                    <TableCell align="right" sx={cellSx({ bgcolor: bg })}>
                      {formatMoney(row.unit_no)}
                    </TableCell>
                    <TableCell align="right" sx={cellSx({ bgcolor: bg })}>
                      {formatMoney(row.unit_cost)}
                    </TableCell>
                    {splits.map((split) => (
                      <Fragment key={`${index}-p-${split.period_index || split.year_index}`}>
                        <TableCell align="right" sx={cellSx({ bgcolor: bg })}>
                          {formatMoney(split.unit_no)}
                        </TableCell>
                        <TableCell align="right" sx={cellSx({ bgcolor: bg })}>
                          {formatMoney(split.unit_cost)}
                        </TableCell>
                        <TableCell align="right" sx={cellSx({ bgcolor: bg })}>
                          {formatMoney(split.cost)}
                        </TableCell>
                      </Fragment>
                    ))}
                    {!periods.length ? <TableCell sx={cellSx({ bgcolor: bg })} /> : null}
                    <TableCell
                      align="right"
                      sx={cellSx({ bgcolor: bg, fontWeight: isMain ? 700 : 400 })}
                    >
                      {formatMoney(row.total_cost)}
                    </TableCell>
                  </TableRow>
                );
              })}
              <TableRow>
                <TableCell
                  colSpan={4 + periods.length * 3}
                  align="right"
                  sx={cellSx({ bgcolor: TONES.header, fontWeight: 700 })}
                >
                  Total Expenditure
                </TableCell>
                <TableCell align="right" sx={cellSx({ bgcolor: TONES.header, fontWeight: 700 })}>
                  {formatMoney(data?.total_expenditure)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell
                  colSpan={4 + periods.length * 3}
                  align="right"
                  sx={cellSx({ bgcolor: TONES.header })}
                >
                  Contingency ({data?.contingency_percent ?? 2}%)
                </TableCell>
                <TableCell align="right" sx={cellSx({ bgcolor: TONES.header })}>
                  {formatMoney(data?.contingency_amount)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell
                  colSpan={4 + periods.length * 3}
                  align="right"
                  sx={cellSx({ bgcolor: TONES.header, fontWeight: 800 })}
                >
                  Grand total
                </TableCell>
                <TableCell align="right" sx={cellSx({ bgcolor: TONES.header, fontWeight: 800 })}>
                  {formatMoney(data?.grand_total)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Stack>
  );
}
