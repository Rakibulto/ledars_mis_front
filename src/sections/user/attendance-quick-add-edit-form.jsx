'use client';

import dayjs from 'dayjs';
import { mutate } from 'swr';
import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useMemo, useState, useEffect, forwardRef } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Slide from '@mui/material/Slide';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Container from '@mui/material/Container';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import axios, { endpoints } from 'src/utils/axios';
import { getLocalIP } from 'src/utils/get-local-ip';

import { Form } from 'src/components/hook-form';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { useAuthContext } from 'src/auth/hooks';

import { getRoleColor } from '../attendance/utils/attendance-utils';

const Transition = forwardRef((props, ref) => <Slide direction="up" ref={ref} {...props} />);

export const ScheduleQuickEditSchema = zod.object({
  timestamp: zod.string().min(1, { message: 'Date-Time is required!' }),
  device_serial_number: zod.string().min(1, { message: 'Device Serial Number is required!' }),
  local_ip_address: zod.string().optional(),
  employee: zod
    .union([zod.string(), zod.number()])
    .refine((val) => val !== '' && val !== null && val !== undefined, {
      message: 'User ID is required!',
    }),
  login_type: zod.string().min(1, { message: 'Login type is required' }),
  latitude: zod.union([zod.string(), zod.number()]).optional().nullable(),
  longitude: zod.union([zod.string(), zod.number()]).optional().nullable(),
  location_accuracy: zod.union([zod.string(), zod.number()]).optional().nullable(),
  location_name: zod.string().optional().nullable(),
});

function AttendanceWebLoginContent({
  user,
  theme,
  currentDate,
  dateTimeStr,
  methods,
  onSubmit,
  defaultValues,
  isSubmitting,
  dialog,
  localIp,
  publicIp,
  showBothIPs,
  isCooldownActive,
  cooldownUntil,
  cooldownRemaining,
  geoLocation,
  geoLocationLoading,
  geoLocationError,
  geoLocationName,
}) {
  const formatRemaining = (s) => {
    const secs = Number(s) || 0;
    const m = Math.floor(secs / 60);
    const sec = secs % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <>
      {/* Header */}
      <Card
        sx={{
          ...(dialog ? { my: 2 } : { mb: { xs: 2, md: 3 } }),
          p: { xs: 2, md: 3 },
          borderRadius: 2,
          textAlign: 'center',
        }}
      >
        <Typography variant="h4" gutterBottom>
          Attendance Web Login
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          {dateTimeStr}
        </Typography>
      </Card>
      <Grid container spacing={{ xs: 2, md: 3 }}>
        {/* Left Side - Employee Info */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card
            sx={{
              p: { xs: 2, md: 3 },
              height: '100%',
              borderRadius: 2,
              mb: { xs: 2, md: 0 },
            }}
          >
            <Stack spacing={3} alignItems="center">
              <Avatar
                src={user?.profile_picture}
                alt={user?.employee_name || user?.username}
                sx={{
                  width: { xs: 64, md: 96 },
                  height: { xs: 64, md: 96 },
                  mb: 1,
                }}
              >
                {(user?.employee_name || user?.username)?.charAt(0)?.toUpperCase()}
              </Avatar>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6">{user?.employee_name || user?.username}</Typography>
                <Chip
                  label={user?.role || 'Employee'}
                  color={getRoleColor(user?.role)}
                  size="small"
                  variant="soft"
                  sx={{ mt: 0.5 }}
                />
              </Box>
              <Divider sx={{ width: '100%' }} />
              <Stack spacing={2} sx={{ width: '100%' }}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    <Iconify
                      icon="solar:user-id-bold"
                      width={16}
                      sx={{ mr: 0.5, verticalAlign: 'text-bottom' }}
                    />
                    Employee ID
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {user?.employee_id || 'N/A'}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    <Iconify
                      icon="solar:letter-bold"
                      width={16}
                      sx={{ mr: 0.5, verticalAlign: 'text-bottom' }}
                    />
                    Email
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {user?.email}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    <Iconify
                      icon="solar:calendar-date-bold"
                      width={16}
                      sx={{ mr: 0.5, verticalAlign: 'text-bottom' }}
                    />
                    Date
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {currentDate.format('MMMM D, YYYY')}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    <Iconify
                      icon="solar:monitor-bold"
                      width={16}
                      sx={{ mr: 0.5, verticalAlign: 'text-bottom' }}
                    />
                    Device Serial Number
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {publicIp || 'Detecting...'}
                  </Typography>
                </Stack>
                {showBothIPs && (
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      <Iconify
                        icon="solar:monitor-bold"
                        width={16}
                        sx={{ mr: 0.5, verticalAlign: 'text-bottom' }}
                      />
                      Local IP
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {localIp || 'Detecting...'}
                    </Typography>
                  </Stack>
                )}
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ whiteSpace: 'nowrap', mr: 1 }}
                  >
                    <Iconify
                      icon="solar:map-point-bold"
                      width={16}
                      sx={{ mr: 0.5, verticalAlign: 'text-bottom' }}
                    />
                    Location
                  </Typography>
                  <Stack alignItems="flex-end" spacing={0.25}>
                    {geoLocationError ? (
                      <Typography variant="body2" fontWeight="bold" color="error.main">
                        {geoLocationError}
                      </Typography>
                    ) : geoLocationLoading ? (
                      <Typography variant="body2" fontWeight="bold" color="text.secondary">
                        Detecting...
                      </Typography>
                    ) : geoLocation ? (
                      <>
                        <Typography variant="body2" fontWeight="bold" textAlign="right">
                          {geoLocationName || 'Resolving address...'}
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                          {geoLocation.latitude.toFixed(5)}, {geoLocation.longitude.toFixed(5)} (±
                          {Math.round(geoLocation.accuracy)}m)
                        </Typography>
                      </>
                    ) : (
                      <Typography variant="body2" fontWeight="bold" color="text.secondary">
                        Unavailable
                      </Typography>
                    )}
                  </Stack>
                </Stack>
              </Stack>
            </Stack>
          </Card>
        </Grid>
        {/* Right Side - Check In */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card
            sx={{
              p: { xs: 2, md: 3 },
              height: '100%',
              borderRadius: 2,
            }}
          >
            <Stack spacing={3} height="100%">
              <Box>
                <Typography variant="h6" gutterBottom>
                  <Iconify
                    icon="solar:clock-circle-outline"
                    width={22}
                    sx={{ mr: 1, verticalAlign: 'text-bottom' }}
                  />
                  Attendance Check-In
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tap the button below to record your attendance for today.
                </Typography>
              </Box>
              <Box
                sx={{
                  p: { xs: 2, md: 3 },
                  borderRadius: 2,
                  bgcolor: 'background.neutral',
                  border: `1px dashed ${theme.palette.divider}`,
                }}
              >
                <Stack spacing={2}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      Login Type
                    </Typography>
                    <Chip
                      label="Web Login"
                      size="small"
                      icon={<Iconify icon="solar:monitor-bold" width={16} />}
                      color="primary"
                      variant="soft"
                    />
                  </Stack>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      Current Time
                    </Typography>
                    <Typography variant="subtitle2">
                      <Iconify
                        icon="solar:clock-circle-outline"
                        width={16}
                        sx={{ mr: 0.5, verticalAlign: 'text-bottom' }}
                      />
                      {currentDate.format('h:mm:ss A')}
                    </Typography>
                  </Stack>
                </Stack>
              </Box>
              <Box
                sx={{
                  flexGrow: 1,
                  display: 'flex',
                  alignItems: { xs: 'center', md: 'flex-end' },
                  mt: 2,
                }}
              >
                <Form methods={methods} onSubmit={onSubmit} sx={{ width: '100%' }}>
                  <input type="hidden" name="timestamp" value={defaultValues.timestamp} />
                  <input type="hidden" name="employee" value={defaultValues.employee} />
                  <input
                    type="hidden"
                    name="device_serial_number"
                    value={defaultValues.device_serial_number}
                  />
                  {showBothIPs && (
                    <input
                      type="hidden"
                      name="local_ip_address"
                      value={defaultValues.local_ip_address}
                    />
                  )}
                  <input type="hidden" name="login_type" value={defaultValues.login_type} />
                  {defaultValues.latitude && (
                    <input type="hidden" name="latitude" value={defaultValues.latitude} />
                  )}
                  {defaultValues.longitude && (
                    <input type="hidden" name="longitude" value={defaultValues.longitude} />
                  )}
                  {defaultValues.location_accuracy && (
                    <input
                      type="hidden"
                      name="location_accuracy"
                      value={defaultValues.location_accuracy}
                    />
                  )}
                  {defaultValues.location_name && (
                    <input type="hidden" name="location_name" value={defaultValues.location_name} />
                  )}
                  <LoadingButton
                    type="submit"
                    variant="contained"
                    size="large"
                    fullWidth
                    color="primary"
                    loading={isSubmitting}
                    disabled={isSubmitting || isCooldownActive}
                    startIcon={<Iconify icon="mdi:fingerprint" width={22} />}
                    sx={{
                      py: { xs: 1, md: 1.5 },
                    }}
                  >
                    {isCooldownActive
                      ? `Marked — try again in ${formatRemaining(cooldownRemaining)}`
                      : 'Mark Attendance Now'}
                  </LoadingButton>
                </Form>
              </Box>
            </Stack>
          </Card>
        </Grid>
        {/* Time Stats */}
        <Grid size={12}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="space-between"
            sx={{
              py: { xs: 1, md: 2 },
              px: { xs: 1, md: 3 },
              borderRadius: 2,
              bgcolor: 'background.neutral',
              textAlign: { xs: 'center', sm: 'left' },
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
              <Iconify icon="solar:calendar-date-bold" width={20} color="success.main" />
              <Typography variant="body2">{currentDate.format('MMM D')}</Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
              <Iconify icon="solar:calendar-bold" width={20} color="secondary.main" />
              <Typography variant="body2">{currentDate.format('dddd')}</Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
              <Iconify icon="solar:clock-circle-outline" width={20} color="info.main" />
              <Typography variant="body2">{currentDate.format('h:mm A')}</Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
              <Iconify icon="solar:calendar-date-bold" width={20} color="warning.main" />
              <Typography variant="body2">{currentDate.format('YYYY')}</Typography>
            </Stack>
          </Stack>
        </Grid>
      </Grid>
    </>
  );
}

export function AttendanceQuickAddEditForm({ currentEntry, open, onClose, noDialog }) {
  const { user } = useAuthContext();
  const theme = useTheme();

  const [localIp, setLocalIp] = useState('');
  const [publicIp, setPublicIp] = useState('');
  const [localIpLoading, setLocalIpLoading] = useState(true);

  // --- Geolocation state ---
  const [geoLocation, setGeoLocation] = useState(null);
  const [geoLocationLoading, setGeoLocationLoading] = useState(true);
  const [geoLocationError, setGeoLocationError] = useState('');
  const [geoLocationName, setGeoLocationName] = useState('');

  // Tracks the last rounded coords we already geocoded so we don't re-request
  // when watchPosition fires for the same physical bucket.
  const lastGeocodedRef = useRef(null);

  // --- Reverse geocode to get human-readable location name ---
  // Rules followed per Nominatim usage policy:
  //  • Coordinates are rounded to 3 dp (~111 m) so nearby fixes share one cache entry.
  //  • A ref prevents redundant requests when the rounded coords haven't changed.
  //  • A 2-second debounce absorbs GPS jitter before touching the network, keeping
  //    traffic well under the 1 req/s hard limit.
  //  • Results are cached in localStorage for 7 days.
  //  • A descriptive User-Agent is sent as required by the policy.
  useEffect(() => {
    if (!geoLocation) {
      setGeoLocationName('');
      return undefined;
    }

    const { latitude, longitude } = geoLocation;

    // Round to 3 dp to maximise cache hits for the same physical location
    const lat = parseFloat(latitude.toFixed(3));
    const lon = parseFloat(longitude.toFixed(3));
    const bucketKey = `${lat},${lon}`;

    // Skip entirely if we already have an address for this rounded position
    if (lastGeocodedRef.current === bucketKey) return undefined;

    const CACHE_KEY = `geo_name_${lat}_${lon}`;
    const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

    // 1. Serve from cache immediately if still fresh (no network, no rate-limit cost)
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const { name, ts } = JSON.parse(raw);
        if (Date.now() - ts < CACHE_TTL_MS) {
          setGeoLocationName(name);
          lastGeocodedRef.current = bucketKey;
          return undefined;
        }
        localStorage.removeItem(CACHE_KEY);
      }
    } catch (_) {
      // storage unavailable – fall through to network call
    }

    // 2. Debounce 2 s: if the position keeps updating (GPS jitter), only the
    //    final settled value fires the network request.
    let cancelled = false;
    const timer = setTimeout(() => {
      if (cancelled) return;

      // 3. Network call — Nominatim requires a descriptive User-Agent
      fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'en',
            'User-Agent': 'Ledars-MIS-App/1.0 (contact@yourcompany.com)',
          },
        }
      )
        .then((res) => res.json())
        .then((data) => {
          if (cancelled) return;
          const name = data?.display_name || 'Unknown location';

          setGeoLocationName(name);
          lastGeocodedRef.current = bucketKey;
          // 4. Persist to cache
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({ name, ts: Date.now() }));
          } catch (_) {
            // quota exceeded – skip caching silently
          }
        })
        .catch(() => {
          if (!cancelled) setGeoLocationName('Could not resolve address');
        });
    }, 2000); // wait for GPS to settle

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [geoLocation]);
  const [cooldownUntil, setCooldownUntil] = useState(() => {
    try {
      const key = `attendance_cooldown_${user?.id || 'global'}`;
      const stored = typeof window !== 'undefined' && localStorage.getItem(key);
      const ts = stored ? Number(stored) : null;
      return ts && ts > Date.now() ? ts : null;
    } catch (err) {
      return null;
    }
  });

  // --- Capture geolocation on mount ---
  useEffect(() => {
    if (typeof window === 'undefined' || !navigator?.geolocation) {
      setGeoLocationLoading(false);
      setGeoLocationError('Geolocation not supported');
      return () => {};
    }

    setGeoLocationLoading(true);
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setGeoLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setGeoLocationLoading(false);
        setGeoLocationError('');
      },
      (err) => {
        setGeoLocationLoading(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setGeoLocationError('Location permission denied');
            break;
          case err.POSITION_UNAVAILABLE:
            setGeoLocationError('Location unavailable');
            break;
          case err.TIMEOUT:
            setGeoLocationError('Location request timed out');
            break;
          default:
            setGeoLocationError('Unable to get location');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  useEffect(() => {
    let mounted = true;
    setLocalIpLoading(true);
    getLocalIP()
      .then((ipInfo) => {
        if (mounted) {
          setLocalIp(ipInfo.localIP);
          setPublicIp(ipInfo.publicIP);
          setLocalIpLoading(false);
        }
      })
      .catch(() => {
        if (mounted) {
          setLocalIp('');
          setPublicIp('');
          setLocalIpLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Persisted cooldown timer (per user) — clears automatically after expiry
  useEffect(() => {
    const key = `attendance_cooldown_${user?.id || 'global'}`;

    if (!cooldownUntil) {
      try {
        const stored = typeof window !== 'undefined' && localStorage.getItem(key);
        const ts = stored ? Number(stored) : null;
        if (ts && ts > Date.now()) {
          setCooldownUntil(ts);
        } else if (stored) {
          localStorage.removeItem(key);
        }
      } catch (err) {
        /* ignore */
      }
      return () => {};
    }

    const remaining = cooldownUntil - Date.now();
    if (remaining <= 0) {
      setCooldownUntil(null);
      try {
        localStorage.removeItem(key);
      } catch (err) {
        /* ignore */
      }
      return () => {};
    }

    const timer = setTimeout(() => {
      setCooldownUntil(null);
      try {
        localStorage.removeItem(key);
      } catch (err) {
        /* ignore */
      }
    }, remaining);

    return () => clearTimeout(timer);
  }, [cooldownUntil, user?.id]);

  // Determine if both IPs should be shown and posted
  const showBothIPs = localIp && publicIp && localIp !== publicIp;

  const defaultValues = useMemo(
    () => ({
      employee: currentEntry?.user_info?.id || user?.id || '',
      timestamp: currentEntry?.timestamp || dayjs().toISOString(),
      device_serial_number: publicIp || currentEntry?.device_serial_number || 'Manual',
      local_ip_address: showBothIPs ? localIp || currentEntry?.local_ip_address || '' : '',
      login_type: currentEntry?.login_type || 'Web Login',
      latitude: geoLocation?.latitude ?? currentEntry?.latitude ?? null,
      longitude: geoLocation?.longitude ?? currentEntry?.longitude ?? null,
      location_accuracy: geoLocation?.accuracy ?? currentEntry?.location_accuracy ?? null,
      location_name: geoLocationName || currentEntry?.location_name || null,
    }),
    [currentEntry, user, localIp, publicIp, showBothIPs, geoLocation, geoLocationName]
  );

  const methods = useForm({
    mode: 'onBlur',
    resolver: zodResolver(ScheduleQuickEditSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  useMemo(() => {
    if (open) {
      reset(defaultValues);
    }
  }, [open, defaultValues, reset]);

  // Helper function to mutate attendance report URLs
  const mutateAttendanceReports = async () => {
    const today = dayjs().format('YYYY-MM-DD');

    // Build query params for today's data
    const queryParams = new URLSearchParams();
    queryParams.append('start_date', today);
    queryParams.append('end_date', today);

    const queryString = queryParams.toString();

    // Mutate the attendance report URLs that the daily view uses
    const reportUrls = [
      // Main attendance report endpoint
      `${endpoints.attendance.report}?${queryString}`,
      // Supervisor-specific endpoint if user is supervisor
      ...(user?.role === 'Supervisor'
        ? [`${endpoints.attendance.reportBySupervisor(user?.id)}&${queryString}`]
        : []),
      // Employee-specific endpoint if user has employee_id
      ...(user?.employee_id ? [endpoints.attendance.reportByEmployeeId(user.employee_id)] : []),
      // General attendance list
      endpoints.attendance.list,
    ];

    // Mutate all relevant URLs
    await Promise.all(reportUrls.map((url) => mutate(url)));
  };

  const onSubmit = handleSubmit(async (data) => {
    if (cooldownUntil && cooldownUntil > Date.now()) {
      toast.warning('Please wait before marking attendance again.');
      return;
    }

    try {
      // Only send local_ip_address if both IPs are different
      const payload = { ...data };
      if (!showBothIPs) {
        delete payload.local_ip_address;
      }
      // Attach latest geolocation if available
      if (geoLocation) {
        payload.latitude = geoLocation.latitude;
        payload.longitude = geoLocation.longitude;
        payload.location_accuracy = geoLocation.accuracy;
        payload.location_name = geoLocationName || '';
      } else {
        delete payload.latitude;
        delete payload.longitude;
        delete payload.location_accuracy;
        delete payload.location_name;
      }
      if (currentEntry || user) {
        await axios.post(endpoints.attendance.create, payload);
        toast.success('Attendance recorded successfully!');

        // start 5-minute cooldown (persisted per user)
        const expireTs = Date.now() + 5 * 60 * 1000;
        setCooldownUntil(expireTs);
        try {
          const key = `attendance_cooldown_${user?.id || 'global'}`;
          localStorage.setItem(key, String(expireTs));
        } catch (err) {
          /* ignore */
        }

        reset();
        if (onClose) onClose();
        await mutateAttendanceReports();
      } else {
        toast.warning('User not found');
      }
    } catch (error) {
      console.error('Error submitting attendance:', error);
      toast.error(error?.detail || 'Something went wrong!');
    }
  });

  const currentDate = dayjs();
  const dateTimeStr = currentDate.format('dddd, MMMM D, YYYY • h:mm A');
  const isCooldownActive = cooldownUntil && cooldownUntil > Date.now();

  const [cooldownRemaining, setCooldownRemaining] = useState(() =>
    cooldownUntil && cooldownUntil > Date.now()
      ? Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000))
      : 0
  );

  useEffect(() => {
    if (!cooldownUntil) {
      setCooldownRemaining(0);
      return () => {};
    }

    const update = () => {
      const secs = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
      setCooldownRemaining(secs);
    };

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [cooldownUntil]);

  if (noDialog) {
    return (
      <Container maxWidth="xxl" sx={{ py: 3 }}>
        <AttendanceWebLoginContent
          user={user}
          theme={theme}
          currentDate={currentDate}
          dateTimeStr={dateTimeStr}
          methods={methods}
          onSubmit={onSubmit}
          defaultValues={defaultValues}
          isSubmitting={isSubmitting}
          dialog={false}
          localIp={localIpLoading ? '' : localIp}
          publicIp={localIpLoading ? '' : publicIp}
          showBothIPs={showBothIPs}
          isCooldownActive={isCooldownActive}
          cooldownUntil={cooldownUntil}
          cooldownRemaining={cooldownRemaining}
          geoLocation={geoLocation}
          geoLocationLoading={geoLocationLoading}
          geoLocationError={geoLocationError}
          geoLocationName={geoLocationName}
        />
      </Container>
    );
  }

  return (
    <Dialog
      fullWidth
      maxWidth="md"
      open={!!open}
      onClose={onClose}
      TransitionComponent={Transition}
    >
      <DialogContent>
        <AttendanceWebLoginContent
          user={user}
          theme={theme}
          currentDate={currentDate}
          dateTimeStr={dateTimeStr}
          methods={methods}
          onSubmit={onSubmit}
          defaultValues={defaultValues}
          isSubmitting={isSubmitting}
          dialog
          localIp={localIpLoading ? '' : localIp}
          publicIp={localIpLoading ? '' : publicIp}
          showBothIPs={showBothIPs}
          isCooldownActive={isCooldownActive}
          cooldownUntil={cooldownUntil}
          cooldownRemaining={cooldownRemaining}
          geoLocation={geoLocation}
          geoLocationLoading={geoLocationLoading}
          geoLocationError={geoLocationError}
          geoLocationName={geoLocationName}
        />
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onClose}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}
