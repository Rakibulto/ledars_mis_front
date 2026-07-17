import dayjs from 'dayjs';
import { useMemo, forwardRef } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Slide from '@mui/material/Slide';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Timeline from '@mui/lab/Timeline';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import TimelineDot from '@mui/lab/TimelineDot';
import TimelineItem from '@mui/lab/TimelineItem';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import TimelineContent from '@mui/lab/TimelineContent';
import { alpha, useTheme } from '@mui/material/styles';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineSeparator from '@mui/lab/TimelineSeparator';

import { useBoolean } from 'src/hooks/use-boolean';

import { formatDate, formatTimestamp } from 'src/utils/format-time';

import { varAlpha } from 'src/theme/styles';
import { useGetEmployee } from 'src/actions/employees';
import { useEmployeeTimestamps } from 'src/actions/attendance';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Chart, useChart } from 'src/components/chart';

import { AdjustmentForm } from '../attendance/view/adjustment-form-view';

// ----------------------------------------------------------------------

const Transition = forwardRef((props, ref) => <Slide direction="up" ref={ref} {...props} />);

// ----------------------------------------------------------------------

export function AttendanceInfoDialog({
  dialog,
  timestamps = [],
  status,
  totalWorkedHours,
  date,
  color,
  employeeName,
  employeeId,
  department,
  designation,
  branch,
  dayOfWeek,
  flag,
  late_by,
  early_out_by,
  remarks,
  checkOut,
  userId = null,
}) {
  const adjustment = useBoolean();
  const theme = useTheme();

  const { employee } = useGetEmployee(dialog.value ? userId || employeeId : null);
  const shift = employee?.office_time;
  const shiftEnd = shift?.office_end_time;

  // Check if user is late or not checked out and current time > shift end
  const now = dayjs();
  let showAdjustment = false;
  if (!checkOut && shiftEnd) {
    // Normalize date to YYYY-MM-DD for dayjs
    let dateObj;
    if (/^\d{2}-\d{2}-\d{4}$/.test(date)) {
      // DD-MM-YYYY
      dateObj = dayjs(date, 'DD-MM-YYYY');
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      // YYYY-MM-DD
      dateObj = dayjs(date, 'YYYY-MM-DD');
    } else {
      dateObj = dayjs(date);
    }

    let shiftEndToday = dayjs('invalid-date');
    if (dateObj.isValid() && shiftEnd) {
      const [h, m, s] = shiftEnd.split(':').map(Number);
      // Always set hour, minute, second on a clone of dateObj
      shiftEndToday = dateObj
        .hour(h)
        .minute(m)
        .second(s || 0);
    }

    if (shiftEndToday.isValid() && now.isAfter(shiftEndToday)) {
      showAdjustment = true;
    }
  }
  if (late_by || early_out_by) {
    showAdjustment = true;
  }

  const handleOpenAdjustment = () => {
    adjustment.onTrue();
  };

  // Fetch timestamps from API only if dialog is open
  const { fetchedTimestamps, isLoading } = useEmployeeTimestamps(
    dialog.value ? employeeId : null,
    dialog.value ? date : null
  );

  // Use fetched timestamps if available, otherwise fallback to prop
  const displayTimestamps =
    !isLoading && fetchedTimestamps?.length > 0 ? fetchedTimestamps : timestamps;

  const attendanceData = useMemo(
    () => ({
      totalHours: totalWorkedHours || 0,
      chartTitle: 'Working Hours',
    }),
    [totalWorkedHours]
  );

  const chartSeries = useMemo(() => [100], []);

  const timestampInfo = useMemo(() => {
    const getInfo = (entry) => {
      if (typeof entry === 'object' && entry !== null) {
        return {
          timestamp: entry.timestamp || '',
          device: entry.device_serial_number || 'Unknown Device',
          localIP: entry.local_ip_address || 'Unknown IP',
          location: entry.location_name || '',
        };
      }
      return {
        timestamp: entry || '',
        device: 'Unknown Device',
        localIP: 'Unknown IP',
        location: '',
      };
    };

    const firstEntry =
      displayTimestamps && displayTimestamps.length > 0 ? displayTimestamps[0] : null;
    const lastEntry =
      displayTimestamps && displayTimestamps.length > 1
        ? displayTimestamps[displayTimestamps.length - 1]
        : null;

    return {
      first: getInfo(firstEntry),
      last: getInfo(lastEntry),
    };
  }, [displayTimestamps]);

  const chartOptions = useChart({
    chart: {
      type: 'radialBar',
      offsetY: -10,
      sparkline: { enabled: true },
      animations: {
        enabled: true,
        speed: 800,
      },
    },
    plotOptions: {
      radialBar: {
        startAngle: -135,
        endAngle: 135,
        hollow: {
          margin: 0,
          size: '60%',
          background: varAlpha(theme.vars.palette.background.paperChannel, 0.9),
          position: 'front',
          dropShadow: {
            enabled: true,
            top: 0,
            left: 0,
            blur: 3,
            opacity: 0.1,
          },
        },
        track: {
          background: alpha(theme.palette.grey[200], 0.4),
          strokeWidth: '100%',
          margin: 5,
          dropShadow: {
            enabled: true,
            opacity: 0.12,
            blur: 3,
            left: 0,
            top: 0,
          },
        },
        dataLabels: {
          name: {
            show: true,
            fontSize: '14px',
            fontWeight: 500,
            color: theme.vars.palette.text.primary,
            offsetY: -25,
          },
          value: {
            offsetY: 0,
            fontSize: '32px',
            fontWeight: 700,
            color: theme.vars.palette.text.primary,
            formatter() {
              return typeof attendanceData.totalHours === 'number'
                ? `${attendanceData.totalHours.toFixed(2)} hrs`
                : attendanceData.totalHours;
            },
          },
          total: {
            show: true,
            label: attendanceData.chartTitle,
            fontSize: '16px',
            fontWeight: 600,
            color: theme.vars.palette.text.primary,
            formatter() {
              return typeof attendanceData.totalHours === 'number'
                ? `${attendanceData.totalHours.toFixed(2)} hrs`
                : attendanceData.totalHours;
            },
          },
        },
      },
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          plotOptions: {
            radialBar: {
              hollow: {
                size: '55%',
              },
              dataLabels: {
                name: {
                  fontSize: '12px',
                  offsetY: -8,
                },
                value: {
                  fontSize: '24px',
                },
                total: {
                  fontSize: '14px',
                },
              },
            },
          },
        },
      },
    ],
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'dark',
        type: 'horizontal',
        shadeIntensity: 1,
        gradientToColors: [theme.palette.success.light],
        inverseColors: true,
        opacityFrom: 0.9,
        opacityTo: 0.9,
      },
    },
    stroke: {
      dashArray: 4,
      width: 3,
    },
    colors: [theme.palette.success.main],
    labels: ['Working Hours'],
  });

  // Format date to DD-MM-YYYY if input is in YYYY-MM-DD
  const displayDate = useMemo(() => {
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return dayjs(date, 'YYYY-MM-DD').format('DD-MM-YYYY');
    }
    return date;
  }, [date]);

  return (
    <>
      <Dialog
        keepMounted
        open={dialog.value}
        TransitionComponent={Transition}
        onClose={dialog.onFalse}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: theme.customShadows.z24,
            height: { xs: '90vh', sm: 'auto' },
            maxHeight: '95vh',
          },
        }}
      >
        <DialogTitle sx={{ pb: 2 }}>
          <Typography variant="h5">Attendance Information</Typography>
          {flag && employeeName && (
            <Typography variant="subtitle1" color="primary" sx={{ mt: 1 }}>
              {employeeName} {employeeId && <span>({employeeId})</span>}
            </Typography>
          )}
          {(department || designation || branch) && (
            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 0.5 }}>
              {department && <span>Department: {department} • </span>}
              {designation && <span>Designation: {designation} • </span>}
              {branch && <span>Branch: {branch}</span>}
            </Typography>
          )}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {displayDate} {dayOfWeek && <span>• {dayOfWeek}</span>}
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
          {remarks && remarks.toLowerCase().includes('attendance adjusted') && (
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="info.main" sx={{ fontWeight: 'medium' }}>
                Attendance Adjustment
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {remarks}
              </Typography>
            </Alert>
          )}

          <Box
            display="flex"
            alignItems="flex-start"
            justifyContent="center"
            gap={{ xs: 2, sm: 3 }}
            flexDirection={{ xs: 'column', md: 'row' }}
          >
            <Card
              sx={{
                width: { xs: '100%', md: '60%' },
                boxShadow: 'none',
                p: { xs: 1.5, sm: 2 },
                border: `1px solid ${alpha(theme.palette.grey[500], 0.12)}`,
              }}
            >
              <Box sx={{ mb: 3 }}>
                <Label
                  variant="soft"
                  color={color || 'success'}
                  sx={{ textTransform: 'uppercase', fontWeight: 'bold', mb: 2 }}
                >
                  {status === 'Early Leave' ? 'Early Out' : status}
                </Label>

                <Stack direction="row" spacing={2} alignItems="center">
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    First Punch:
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                    {timestampInfo.first.timestamp
                      ? formatTimestamp(timestampInfo.first.timestamp)
                      : 'N/A'}
                  </Typography>
                </Stack>

                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{ mt: 0.5, flexWrap: 'wrap' }}
                >
                  <Typography variant="caption" sx={{ color: 'text.secondary', ml: 2 }}>
                    Device:
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {timestampInfo.first.device}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', ml: 2 }}>
                    Local IP:
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {timestampInfo.first.localIP}
                  </Typography>
                  {timestampInfo.first.location && (
                    <Typography
                      variant="caption"
                      sx={{ color: 'text.secondary', ml: 2, width: '100%' }}
                    >
                      Location: {timestampInfo.first.location}
                    </Typography>
                  )}
                </Stack>

                <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Last Punch:
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ fontWeight: 'medium' }}
                    color={timestampInfo.last.timestamp ? 'text.primary' : 'error.main'}
                  >
                    {timestampInfo.last.timestamp
                      ? formatTimestamp(timestampInfo.last.timestamp)
                      : 'Not checked out'}
                  </Typography>
                </Stack>

                {timestampInfo.last.timestamp && (
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 0.5 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', ml: 2 }}>
                      Device:
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {timestampInfo.last.device}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', ml: 2 }}>
                      Local IP:
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {timestampInfo.last.localIP}
                    </Typography>
                  </Stack>
                )}
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box
                sx={{ position: 'relative', height: { xs: 220, sm: 240, md: 260 }, mt: 1, mb: 3 }}
              >
                <Chart type="radialBar" series={chartSeries} options={chartOptions} height="100%" />

                <Box
                  sx={{
                    position: 'absolute',
                    bottom: { xs: -15, sm: -10, md: -5 },
                    left: 0,
                    right: 0,
                    display: 'flex',
                    justifyContent: 'center',
                    gap: { xs: 1, sm: 1.5 },
                    flexWrap: 'wrap',
                    px: { xs: 1, sm: 2 },
                  }}
                >
                  <Paper
                    elevation={1}
                    sx={{
                      px: { xs: 1.5, sm: 2.5 },
                      py: { xs: 1, sm: 1.25 },
                      bgcolor: alpha(theme.palette.success.lighter, 0.6),
                      borderRadius: 2,
                      minWidth: { xs: 70, sm: 90 },
                      transition: 'all 0.2s ease-in-out',
                      border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
                      boxShadow: `0 3px 10px ${alpha(theme.palette.success.main, 0.08)}`,
                      '&:hover': {
                        boxShadow: `0 5px 12px ${alpha(theme.palette.success.main, 0.15)}`,
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      color="success.dark"
                      sx={{
                        fontWeight: 'bold',
                        mb: 0.5,
                        fontSize: { xs: '0.7rem', sm: '0.875rem' },
                      }}
                    >
                      Working Hours
                    </Typography>
                    <Typography
                      variant="h6"
                      color="success.dark"
                      sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                    >
                      {typeof attendanceData.totalHours === 'number'
                        ? `${attendanceData.totalHours.toFixed(2)} hrs`
                        : attendanceData.totalHours}
                    </Typography>
                  </Paper>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                    Late By
                  </Typography>
                  <Label
                    variant="soft"
                    color={late_by ? 'orange' : 'default'}
                    startIcon={late_by ? <Iconify icon="mdi:clock-alert" size={16} /> : null}
                  >
                    {late_by ? late_by.split('.')[0] : 'N/A'}
                  </Label>
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                    Early Out By
                  </Typography>
                  <Label
                    variant="soft"
                    color={early_out_by ? 'pink' : 'default'}
                    startIcon={early_out_by ? <Iconify icon="mdi:clock-outline" size={16} /> : null}
                  >
                    {early_out_by ? early_out_by.split('.')[0] : 'N/A'}
                  </Label>
                </Box>
              </Stack>
            </Card>

            <Card
              sx={{
                width: { xs: '100%', md: '40%' },
                boxShadow: 'none',
                p: { xs: 1.5, sm: 2 },
                border: `1px solid ${alpha(theme.palette.grey[500], 0.12)}`,
              }}
            >
              <Typography variant="h6" sx={{ mb: 2 }}>
                Punch Timeline
              </Typography>

              <Timeline position="right" sx={{ p: 0 }}>
                {displayTimestamps?.map((timestamp, index) => {
                  const info =
                    typeof timestamp === 'object' && timestamp !== null
                      ? {
                          timestamp: timestamp.timestamp || '',
                          device: timestamp.device_serial_number || 'Unknown Device',
                          localIP: timestamp.local_ip_address || 'Unknown IP',
                        }
                      : {
                          timestamp: timestamp || '',
                          device: 'Unknown Device',
                          localIP: 'Unknown IP',
                        };

                  // Determine status based on position and checkOut
                  let entryStatus;
                  if (index === 0) {
                    entryStatus = 'Checked In';
                  } else if (index === displayTimestamps.length - 1 && checkOut) {
                    entryStatus = 'Check Out';
                  } else {
                    entryStatus = 'Intermediate';
                  }

                  return (
                    <TimelineItem
                      key={index}
                      sx={{ minHeight: 'auto', '&:before': { display: 'none' } }}
                    >
                      <TimelineSeparator>
                        <TimelineDot
                          color={index % 2 === 0 ? 'primary' : 'success'}
                          variant={index % 2 === 0 ? 'filled' : 'outlined'}
                        />
                        {index < displayTimestamps.length - 1 && (
                          <TimelineConnector
                            sx={{
                              bgcolor: theme.palette.divider,
                              height: 30,
                            }}
                          />
                        )}
                      </TimelineSeparator>

                      <TimelineContent>
                        <Typography
                          variant="subtitle2"
                          sx={{ color: index % 2 === 0 ? 'primary.main' : 'success.main' }}
                        >
                          {entryStatus}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: 'text.secondary', display: 'block' }}
                        >
                          {formatDate(info.timestamp)}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {formatTimestamp(info.timestamp)}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                          <Iconify
                            icon="mdi:devices"
                            size={14}
                            sx={{ mr: 0.5, color: 'text.disabled' }}
                          />
                          <Typography variant="caption" sx={{ color: 'text.secondary' }} mr={0.75}>
                            {info.device}
                          </Typography>
                          <Label>{info.localIP && `${info.localIP}`}</Label>
                          {info.location && (
                            <Typography
                              variant="caption"
                              sx={{ color: 'text.secondary', ml: 1, width: '100%' }}
                            >
                              Location: {info.location}
                            </Typography>
                          )}
                        </Box>
                      </TimelineContent>
                    </TimelineItem>
                  );
                })}
              </Timeline>
            </Card>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
          {showAdjustment && (
            <Button
              variant="contained"
              color="primary"
              onClick={handleOpenAdjustment}
              startIcon={<Iconify icon="mdi:calendar-edit" />}
              size="medium"
              sx={{ mr: 'auto' }}
            >
              Request Adjustment
            </Button>
          )}
          <Button
            variant="outlined"
            onClick={dialog.onFalse}
            startIcon={<Iconify icon="mdi:close" />}
            size="medium"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {showAdjustment && (
        <AdjustmentForm
          open={adjustment.value}
          onClose={adjustment.onFalse}
          inDialog
          userId={userId}
          employee={employee}
          selectedDate={date}
          checkOut={checkOut}
          attendanceData={{
            status,
            totalWorkedHours,
            timestamps: displayTimestamps,
            late_by,
            early_out_by,
            dayOfWeek,
            remarks,
          }}
        />
      )}
    </>
  );
}
