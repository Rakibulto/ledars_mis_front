'use client';

import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { mutate } from 'swr';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { useGetRequest } from 'src/actions/ledars-hook';

import { endpoints } from 'src/utils/axios';

import { exportActionPlanWorkbook } from './plan-tables-excel';
import { PlanTableExcelToolbar } from './plan-table-excel-toolbar';
import { importProjectActionPlanExcel } from './use-project-managements-api';

const TONES = {
  border: '#9e9e9e',
  header: '#f0f0f0',
  section: '#ffb74d',
  main: '#f5f5f5',
  sub: '#ffffff',
  weekend: '#e0e0e0',
  mark: '#ff9800',
  meta: '#ffffff',
};

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: dayjs().month(i).format('MMMM'),
}));

function cellSx(options = {}) {
  return {
    border: `1px solid ${TONES.border} !important`,
    px: 0.5,
    py: 0.65,
    fontSize: 11,
    verticalAlign: 'middle',
    ...options,
  };
}

export function ProjectActionPlanPanel({ projectId, defaultYear, defaultMonth }) {
  const initial = useMemo(() => {
    const base = dayjs(
      defaultYear && defaultMonth
        ? `${defaultYear}-${String(defaultMonth).padStart(2, '0')}-01`
        : undefined
    );
    return {
      year: base.isValid() ? base.year() : dayjs().year(),
      month: base.isValid() ? base.month() + 1 : dayjs().month() + 1,
    };
  }, [defaultYear, defaultMonth]);

  const [year, setYear] = useState(initial.year);
  const [month, setMonth] = useState(initial.month);

  const url = projectId
    ? endpoints.projectManagements.projectActionPlan(projectId, year, month)
    : null;
  const { data, isLoading, error } = useGetRequest(url);

  const project = data?.project || {};
  const monthInfo = data?.month || {};
  const rows = data?.rows || [];
  const daysInMonth = monthInfo.days_in_month || dayjs(`${year}-${month}-01`).daysInMonth();
  const offDaySet = useMemo(
    () => new Set(monthInfo.off_days || monthInfo.weekend_days || []),
    [monthInfo.off_days, monthInfo.weekend_days]
  );
  const dayNumbers = useMemo(
    () => Array.from({ length: daysInMonth }, (_, i) => i + 1),
    [daysInMonth]
  );

  const yearOptions = useMemo(() => {
    const current = dayjs().year();
    return Array.from({ length: 8 }, (_, i) => current - 2 + i);
  }, []);

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 1 }}>
        Failed to load action plan.
      </Alert>
    );
  }

  return (
    <Stack spacing={1.5}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'center' }}
      >
        <Box sx={{ textAlign: { xs: 'left', sm: 'center' }, flex: 1 }}>
          <Typography variant="subtitle1" fontWeight={800}>
            {project.organization || 'LEDARS'}
          </Typography>
          {project.location ? (
            <Typography variant="body2" color="text.secondary">
              {project.location}
            </Typography>
          ) : null}
          <Typography variant="body2" fontWeight={700} sx={{ mt: 0.5 }}>
            {project.title || '—'}
          </Typography>
          <Typography variant="h6" fontWeight={800} sx={{ mt: 0.75 }}>
            Monthly Action Plan {monthInfo.label || dayjs(`${year}-${month}-01`).format('MMMM, YYYY')}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Orange marks show distributed working days. Friday and Saturday are shown in gray.
          </Typography>
        </Box>
        <Stack spacing={1} alignItems={{ xs: 'stretch', sm: 'flex-end' }}>
          <Stack direction="row" spacing={1}>
            <TextField
              select
              size="small"
              label="Month"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              sx={{ minWidth: 140 }}
            >
              {MONTH_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="Year"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              sx={{ minWidth: 100 }}
            >
              {yearOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
          <PlanTableExcelToolbar
            disabled={!projectId || isLoading}
            onDownload={() => exportActionPlanWorkbook(data, year, month)}
            onUpload={async (file) => {
              const result = await importProjectActionPlanExcel(projectId, file, year, month);
              if (result.year) setYear(result.year);
              if (result.month) setMonth(result.month);
              await mutate(
                endpoints.projectManagements.projectActionPlan(projectId, result.year, result.month)
              );
              return `Action plan imported for ${dayjs(`${result.year}-${result.month}-01`).format('MMMM YYYY')}. ${result.importedRows} sub-activity row(s) updated.`;
            }}
          />
        </Stack>
      </Stack>

      {isLoading ? (
        <Stack alignItems="center" sx={{ py: 6 }}>
          <CircularProgress size={28} />
        </Stack>
      ) : (
        <TableContainer
          sx={{
            border: `1px solid ${TONES.border}`,
            overflowX: 'auto',
            bgcolor: TONES.meta,
          }}
        >
          <Table
            size="small"
            sx={{
              minWidth: 720 + daysInMonth * 28,
              borderCollapse: 'collapse',
              '& .MuiTableCell-root': {
                border: `1px solid ${TONES.border} !important`,
              },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell
                  rowSpan={2}
                  align="center"
                  sx={cellSx({ bgcolor: TONES.header, fontWeight: 800, minWidth: 48 })}
                >
                  SL
                </TableCell>
                <TableCell
                  rowSpan={2}
                  sx={cellSx({ bgcolor: TONES.header, fontWeight: 800, minWidth: 220 })}
                >
                  Name of Activity
                </TableCell>
                <TableCell
                  rowSpan={2}
                  align="center"
                  sx={cellSx({ bgcolor: TONES.header, fontWeight: 800, minWidth: 64 })}
                >
                  Target
                </TableCell>
                <TableCell
                  colSpan={daysInMonth}
                  align="center"
                  sx={cellSx({ bgcolor: TONES.header, fontWeight: 800 })}
                >
                  Dates
                </TableCell>
                <TableCell
                  rowSpan={2}
                  align="center"
                  sx={cellSx({ bgcolor: TONES.header, fontWeight: 800, minWidth: 120 })}
                >
                  Responsible person
                </TableCell>
              </TableRow>
              <TableRow>
                {dayNumbers.map((day) => (
                  <TableCell
                    key={day}
                    align="center"
                    sx={cellSx({
                      bgcolor: offDaySet.has(day) ? TONES.weekend : TONES.header,
                      fontWeight: 700,
                      minWidth: 26,
                      px: 0.25,
                    })}
                  >
                    {day}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length ? (
                rows.map((row, index) => {
                  const isSection = row.row_type === 'section';
                  const isMain = row.row_type === 'main';
                  const markSet = new Set(row.day_marks || []);

                  if (isSection) {
                    return (
                      <TableRow key={`section-${index}`}>
                        <TableCell
                          colSpan={3 + daysInMonth + 1}
                          sx={cellSx({
                            bgcolor: TONES.section,
                            fontWeight: 800,
                            color: '#3e2723',
                          })}
                        >
                          {row.title}
                        </TableCell>
                      </TableRow>
                    );
                  }

                  const bg = isMain ? TONES.main : TONES.sub;

                  return (
                    <TableRow key={`${row.si_no}-${index}`}>
                      <TableCell
                        align="center"
                        sx={cellSx({ bgcolor: bg, fontWeight: isMain ? 700 : 400 })}
                      >
                        {row.si_no}
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
                      <TableCell align="center" sx={cellSx({ bgcolor: bg })}>
                        {row.target ?? ''}
                      </TableCell>
                      {dayNumbers.map((day) => {
                        const isOffDay = offDaySet.has(day);
                        const isMarked = !isOffDay && markSet.has(day);

                        return (
                          <TableCell
                            key={day}
                            align="center"
                            sx={cellSx({
                              bgcolor: isOffDay ? TONES.weekend : bg,
                              p: 0.25,
                            })}
                          >
                            {isMarked ? (
                              <Box
                                sx={{
                                  width: '100%',
                                  minWidth: 16,
                                  height: 16,
                                  mx: 'auto',
                                  bgcolor: TONES.mark,
                                  borderRadius: 0.5,
                                }}
                              />
                            ) : null}
                          </TableCell>
                        );
                      })}
                      <TableCell align="center" sx={cellSx({ bgcolor: bg })}>
                        {row.responsible || '—'}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={3 + daysInMonth + 1}
                    sx={cellSx({ color: 'text.secondary' })}
                  >
                    No activities with unit distributions scheduled for this month. Add unit
                    distributions in the project plan to populate the action plan.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Stack>
  );
}
