'use client';

import dayjs from 'dayjs';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { useTheme, alpha } from '@mui/material/styles';
import {
  Box,
  Card,
  Chip,
  Stack,
  Table,
  Button,
  Divider,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  TablePagination,
  TextField,
  MenuItem,
  Grid,
  CardContent,
  InputAdornment,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { endpoints } from 'src/utils/axios';
import { useGetRequest } from 'src/actions/ledars-hook';
import { Iconify } from 'src/components/iconify';

const EP = endpoints.storeInventory;

const RETURN_TYPE_LABELS = {
  project_return: 'Project Item Return',
  internal_transfer_return: 'Internal Transfer Return',
  instant_it_return: 'Instant Internal Transfer Return',
};

const TYPE_COLORS = {
  project_return: 'warning',
  internal_transfer_return: 'info',
  instant_it_return: 'secondary',
};

const DATE_PRESETS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'custom', label: 'Custom Range' },
];

function computeDateRange(preset, customFrom, customTo) {
  const today = dayjs();
  switch (preset) {
    case 'daily':
      return { date_from: today.format('YYYY-MM-DD'), date_to: today.format('YYYY-MM-DD') };
    case 'weekly':
      return {
        date_from: today.subtract(6, 'day').format('YYYY-MM-DD'),
        date_to: today.format('YYYY-MM-DD'),
      };
    case 'monthly':
      return {
        date_from: today.startOf('month').format('YYYY-MM-DD'),
        date_to: today.format('YYYY-MM-DD'),
      };
    case 'yearly':
      return {
        date_from: today.startOf('year').format('YYYY-MM-DD'),
        date_to: today.format('YYYY-MM-DD'),
      };
    case 'custom':
      return {
        date_from: customFrom?.isValid() ? customFrom.format('YYYY-MM-DD') : '',
        date_to: customTo?.isValid() ? customTo.format('YYYY-MM-DD') : '',
      };
    default:
      return {};
  }
}

export default function ReturnHistoryPage() {
  const router = useRouter();
  const theme = useTheme();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [datePreset, setDatePreset] = useState('');
  const [customFrom, setCustomFrom] = useState(null);
  const [customTo, setCustomTo] = useState(null);

  const { date_from, date_to } = useMemo(
    () => computeDateRange(datePreset, customFrom, customTo),
    [datePreset, customFrom, customTo]
  );

  const params = new URLSearchParams({
    status: 'Received',
    page: page + 1,
    page_size: rowsPerPage,
  });
  if (search) params.set('search', search);
  if (filterType) params.set('return_type', filterType);
  if (date_from) params.set('date_from', date_from);
  if (date_to) params.set('date_to', date_to);

  const { data: raw, loading } = useGetRequest(`${EP.return_management}?${params.toString()}`);
  const rows = Array.isArray(raw) ? raw : Array.isArray(raw?.results) ? raw.results : [];
  const total = raw?.count ?? rows.length;

  const totalReturned = rows.reduce((s, r) => s + Number(r.total_return_quantity || 0), 0);
  const totalGood = rows.reduce((s, r) => s + Number(r.total_good_quantity || 0), 0);
  const totalDamaged = rows.reduce((s, r) => s + Number(r.total_damaged_quantity || 0), 0);

  const hasFilters = !!(search || filterType || datePreset);

  const clearFilters = () => {
    setSearch('');
    setFilterType('');
    setDatePreset('');
    setCustomFrom(null);
    setCustomTo(null);
    setPage(0);
  };

  const activePresetLabel = DATE_PRESETS.find((p) => p.value === datePreset)?.label;

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack spacing={3}>
        {/* Header */}
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Return History
          </Typography>
          <Typography variant="body2" color="text.secondary">
            All received return documents. Click any row to view full details.
          </Typography>
        </Box>

        {/* KPI Cards */}
        <Grid container spacing={2}>
          {[
            {
              label: 'Received Returns',
              value: total,
              color: 'success',
              icon: 'solar:check-circle-bold-duotone',
            },
            {
              label: 'Total Returned Qty',
              value: totalReturned,
              color: 'primary',
              icon: 'solar:box-bold-duotone',
            },
            {
              label: 'Total Good Qty',
              value: totalGood,
              color: 'info',
              icon: 'solar:shield-check-bold-duotone',
            },
            {
              label: 'Total Damaged Qty',
              value: totalDamaged,
              color: 'error',
              icon: 'solar:danger-bold-duotone',
            },
          ].map((kpi) => (
            <Grid size={{ xs: 6, sm: 3 }} key={kpi.label}>
              <Card sx={{ borderRadius: 2, borderLeft: 4, borderColor: `${kpi.color}.main` }}>
                <CardContent sx={{ py: 2 }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Iconify icon={kpi.icon} width={24} sx={{ color: `${kpi.color}.main` }} />
                    <Box>
                      <Typography variant="h5" fontWeight={800}>
                        {kpi.value}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {kpi.label}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Filters */}
        <Card sx={{ p: 2.5, borderRadius: 2 }}>
          <Stack spacing={2}>
            {/* Row 1: Search + Type + Date Preset + Clear */}
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              alignItems={{ sm: 'center' }}
            >
              <TextField
                size="small"
                placeholder="Search by return number, itemâ€¦"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                sx={{ flex: 1 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="solar:magnifer-bold" width={16} />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                select
                size="small"
                label="Return Type"
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setPage(0);
                }}
                sx={{ minWidth: 230 }}
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="project_return">Project Item Return</MenuItem>
                <MenuItem value="internal_transfer_return">Internal Transfer Return</MenuItem>
                <MenuItem value="instant_it_return">Instant Internal Transfer Return</MenuItem>
              </TextField>
              <TextField
                select
                size="small"
                label="Date Range"
                value={datePreset}
                onChange={(e) => {
                  setDatePreset(e.target.value);
                  setCustomFrom(null);
                  setCustomTo(null);
                  setPage(0);
                }}
                sx={{ minWidth: 160 }}
              >
                <MenuItem value="">All Time</MenuItem>
                {DATE_PRESETS.map((p) => (
                  <MenuItem key={p.value} value={p.value}>
                    {p.label}
                  </MenuItem>
                ))}
              </TextField>
              {hasFilters && (
                <Button
                  size="small"
                  variant="outlined"
                  color="inherit"
                  onClick={clearFilters}
                  startIcon={<Iconify icon="solar:close-circle-bold" width={16} />}
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  Clear All
                </Button>
              )}
            </Stack>

            {/* Row 2: Custom date range with DatePicker */}
            {datePreset === 'custom' && (
              <>
                <Divider />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    sx={{ color: 'text.secondary' }}
                  >
                    <Iconify icon="solar:calendar-date-bold-duotone" width={20} />
                    <Typography variant="body2" fontWeight={600} color="text.secondary">
                      Custom Range
                    </Typography>
                  </Stack>
                  <DatePicker
                    label="From Date"
                    value={customFrom}
                    onChange={(newVal) => {
                      setCustomFrom(newVal);
                      setPage(0);
                    }}
                    maxDate={customTo || undefined}
                    slotProps={{
                      textField: {
                        size: 'small',
                        sx: { minWidth: 180 },
                        InputProps: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <Iconify
                                icon="solar:calendar-bold"
                                width={16}
                                sx={{ color: 'text.secondary' }}
                              />
                            </InputAdornment>
                          ),
                        },
                      },
                    }}
                  />
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Iconify
                      icon="solar:arrow-right-bold"
                      width={16}
                      sx={{ color: 'text.disabled' }}
                    />
                  </Stack>
                  <DatePicker
                    label="To Date"
                    value={customTo}
                    onChange={(newVal) => {
                      setCustomTo(newVal);
                      setPage(0);
                    }}
                    minDate={customFrom || undefined}
                    slotProps={{
                      textField: {
                        size: 'small',
                        sx: { minWidth: 180 },
                        InputProps: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <Iconify
                                icon="solar:calendar-bold"
                                width={16}
                                sx={{ color: 'text.secondary' }}
                              />
                            </InputAdornment>
                          ),
                        },
                      },
                    }}
                  />
                  {(customFrom || customTo) && (
                    <Button
                      size="small"
                      variant="text"
                      color="inherit"
                      onClick={() => {
                        setCustomFrom(null);
                        setCustomTo(null);
                        setPage(0);
                      }}
                      startIcon={<Iconify icon="solar:close-circle-bold" width={14} />}
                      sx={{ fontSize: 12, whiteSpace: 'nowrap' }}
                    >
                      Clear dates
                    </Button>
                  )}
                </Stack>
              </>
            )}

            {/* Active filter chips (non-custom presets) */}
            {datePreset && datePreset !== 'custom' && (
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="caption" color="text.secondary">
                  Date filter:
                </Typography>
                <Chip
                  size="small"
                  icon={<Iconify icon="solar:calendar-bold-duotone" width={14} />}
                  label={`${activePresetLabel}  ${date_from} â†’ ${date_to}`}
                  color="primary"
                  variant="soft"
                  onDelete={() => {
                    setDatePreset('');
                    setPage(0);
                  }}
                />
              </Stack>
            )}
          </Stack>
        </Card>

        {/* Table */}
        <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.grey[500], 0.04) }}>
                  <TableCell sx={{ fontWeight: 700, width: 48 }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Return No.</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Source Reference</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    Returned
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: 'success.main' }}>
                    Good
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: 'error.main' }}>
                    Damaged
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Return Date</TableCell>
                  <TableCell sx={{ fontWeight: 700, width: 40 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                      <Typography variant="body2" color="text.secondary">
                        Loadingâ€¦
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {!loading && !rows.length && (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                      <Stack alignItems="center" spacing={1}>
                        <Iconify
                          icon="solar:history-bold-duotone"
                          width={40}
                          sx={{ color: 'text.disabled' }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          No received returns found.
                        </Typography>
                        {hasFilters && (
                          <Button size="small" variant="text" onClick={clearFilters}>
                            Clear filters
                          </Button>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                )}
                {rows.map((row, idx) => {
                  const sourceDocs = [
                    ...new Set(
                      (row.lines || []).map((l) => l.source_document_number).filter(Boolean)
                    ),
                  ];
                  const typeColor = TYPE_COLORS[row.return_type] || 'default';
                  const returnDate = row.return_date || row.updated_at;
                  return (
                    <TableRow
                      key={row.id}
                      hover
                      sx={{
                        cursor: 'pointer',
                        '&:last-child td': { border: 0 },
                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
                      }}
                      onClick={() =>
                        router.push(
                          paths.dashboard.storeInventory.returnManagement_history_detail(row.id)
                        )
                      }
                    >
                      <TableCell>
                        <Typography variant="caption" color="text.disabled" fontWeight={700}>
                          {page * rowsPerPage + idx + 1}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700} sx={{ color: 'primary.main' }}>
                          {row.return_number}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={RETURN_TYPE_LABELS[row.return_type] || row.return_type}
                          color={typeColor}
                          variant="soft"
                          sx={{ fontSize: 11 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {sourceDocs.join(', ') || 'â€”'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          size="small"
                          label={row.total_return_quantity ?? 'â€”'}
                          color="primary"
                          variant="soft"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          size="small"
                          label={row.total_good_quantity ?? 'â€”'}
                          color="success"
                          variant="soft"
                        />
                      </TableCell>
                      <TableCell align="right">
                        {Number(row.total_damaged_quantity) > 0 ? (
                          <Chip
                            size="small"
                            label={row.total_damaged_quantity}
                            color="error"
                            variant="soft"
                          />
                        ) : (
                          <Typography variant="caption" color="text.disabled">
                            0
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {returnDate
                            ? new Intl.DateTimeFormat('en-BD', { dateStyle: 'medium' }).format(
                                new Date(returnDate)
                              )
                            : 'â€”'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Iconify
                          icon="solar:arrow-right-bold-duotone"
                          width={16}
                          sx={{ color: 'text.disabled' }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={total}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={(_, p) => setPage(p)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(+e.target.value);
              setPage(0);
            }}
            rowsPerPageOptions={[10, 20, 50]}
          />
        </Card>
      </Stack>
    </Box>
  );
}
