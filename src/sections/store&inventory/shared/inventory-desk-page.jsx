'use client';

import { useMemo, useState, useEffect } from 'react';

import {
  Box,
  Card,
  Chip,
  Grid,
  Alert,
  Stack,
  Table,
  Switch,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  Pagination,
  Typography,
  InputAdornment,
  TableContainer,
  FormControlLabel,
} from '@mui/material';

import { Iconify } from 'src/components/iconify';

function normalizeValue(value) {
  if (Array.isArray(value)) {
    return value.join(', ');
  }

  if (value && typeof value === 'object') {
    return Object.values(value).join(' ');
  }

  return String(value ?? '');
}

function defaultFilter(rows, searchTerm) {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  if (!normalizedSearch) {
    return rows;
  }

  return rows.filter((row) =>
    Object.values(row).some((value) =>
      normalizeValue(value).toLowerCase().includes(normalizedSearch)
    )
  );
}

function getReviewItems(row, reviewFields, columns) {
  if (!row) {
    return [];
  }

  if (reviewFields?.length) {
    return reviewFields.map((field) => ({
      label: field.label,
      value: field.render ? field.render(row) : normalizeValue(row[field.key]),
    }));
  }

  return columns.slice(0, 6).map((column) => ({
    label: column.label,
    value: column.reviewRender
      ? column.reviewRender(row)
      : column.render
        ? column.render(row)
        : normalizeValue(row[column.key]),
  }));
}

export function formatCurrency(value, currency = 'BDT') {
  const amount = Number(value || 0);

  return `${currency} ${amount.toLocaleString()}`;
}

export function getStatusColor(value) {
  const normalized = String(value || '').toLowerCase();

  if (
    normalized.includes('done') ||
    normalized.includes('complete') ||
    normalized.includes('active') ||
    normalized.includes('approved') ||
    normalized.includes('compliant')
  ) {
    return 'success';
  }

  if (
    normalized.includes('progress') ||
    normalized.includes('review') ||
    normalized.includes('transit') ||
    normalized.includes('pending')
  ) {
    return 'warning';
  }

  if (
    normalized.includes('cancel') ||
    normalized.includes('damage') ||
    normalized.includes('loss') ||
    normalized.includes('expired')
  ) {
    return 'error';
  }

  return 'default';
}

export function getBooleanColor(value) {
  return value ? 'success' : 'default';
}

export function renderBooleanChip(value, trueLabel = 'Yes', falseLabel = 'No') {
  return (
    <Chip
      size="small"
      color={getBooleanColor(Boolean(value))}
      label={value ? trueLabel : falseLabel}
      variant={value ? 'filled' : 'outlined'}
    />
  );
}

export function renderStatusChip(value) {
  return (
    <Chip size="small" color={getStatusColor(value)} label={normalizeValue(value)} variant="soft" />
  );
}

export default function InventoryDeskPage({
  title,
  description,
  icon = 'solar:box-bold-duotone',
  rows,
  columns,
  summaryCards = [],
  queueItems = [],
  reviewFields,
  getRowId = (row, index) => row?.id ?? index,
  getRowTitle,
  getRowSubtitle,
  emptyMessage = 'No records found',
  tableLabel = 'Operational records',
  headerAction,
  filterRows,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [dense, setDense] = useState(false);
  const [selectedKey, setSelectedKey] = useState(null);

  const rowsPerPage = dense ? 14 : 10;

  const filteredRows = useMemo(() => {
    const rowFilter = filterRows || defaultFilter;
    return rowFilter(rows, searchTerm);
  }, [filterRows, rows, searchTerm]);

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage));
  const currentPage = Math.min(page, pageCount);
  const paginatedRows = filteredRows.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  useEffect(() => {
    if (page !== currentPage) {
      setPage(currentPage);
    }
  }, [currentPage, page]);

  useEffect(() => {
    if (!filteredRows.length) {
      setSelectedKey(null);
      return;
    }

    const hasSelected = filteredRows.some((row, index) => getRowId(row, index) === selectedKey);

    if (!hasSelected) {
      setSelectedKey(getRowId(filteredRows[0], 0));
    }
  }, [filteredRows, getRowId, selectedKey]);

  const selectedRow = useMemo(
    () => filteredRows.find((row, index) => getRowId(row, index) === selectedKey) || null,
    [filteredRows, getRowId, selectedKey]
  );

  const resolvedQueueItems =
    typeof queueItems === 'function' ? queueItems(rows, selectedRow) : queueItems;
  const resolvedReviewItems = getReviewItems(selectedRow, reviewFields, columns);

  return (
    <Box sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Iconify icon={icon} width={28} />
            <Typography variant="h4">{title}</Typography>
          </Stack>
          <Alert severity="info" variant="outlined">
            {description}
          </Alert>
        </Stack>

        {!!summaryCards.length && (
          <Grid container spacing={3}>
            {summaryCards.map((item) => (
              <Grid item xs={12} sm={6} md={4} key={item.label}>
                <Card sx={{ p: 3 }}>
                  <Stack spacing={1.5}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="overline" sx={{ color: 'text.secondary' }}>
                        {item.label}
                      </Typography>
                      <Iconify
                        icon={item.icon || icon}
                        width={22}
                        sx={{ color: `${item.color || 'primary'}.main` }}
                      />
                    </Stack>
                    <Typography variant="h4">{item.value}</Typography>
                    {item.helper ? (
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {item.helper}
                      </Typography>
                    ) : null}
                  </Stack>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <Card sx={{ p: 2.5 }}>
              <Stack spacing={2}>
                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  spacing={2}
                  alignItems={{ xs: 'stretch', md: 'center' }}
                  justifyContent="space-between"
                >
                  <Stack spacing={0.5}>
                    <Typography variant="h6">{tableLabel}</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {filteredRows.length} records match the current search.
                    </Typography>
                  </Stack>

                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1.5}
                    alignItems={{ sm: 'center' }}
                  >
                    <TextField
                      size="small"
                      placeholder="Search records"
                      value={searchTerm}
                      onChange={(event) => {
                        setSearchTerm(event.target.value);
                        setPage(1);
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Iconify icon="solar:magnifer-bold-duotone" />
                          </InputAdornment>
                        ),
                      }}
                      sx={{ minWidth: { xs: '100%', sm: 260 } }}
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={dense}
                          onChange={(event) => setDense(event.target.checked)}
                        />
                      }
                      label="Dense"
                    />
                    {headerAction}
                  </Stack>
                </Stack>

                <TableContainer>
                  <Table size={dense ? 'small' : 'medium'}>
                    <TableHead>
                      <TableRow>
                        {columns.map((column) => (
                          <TableCell key={column.label} align={column.align || 'left'}>
                            {column.label}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedRows.map((row, index) => {
                        const rowKey = getRowId(row, index);
                        const isSelected = rowKey === selectedKey;

                        return (
                          <TableRow
                            key={rowKey}
                            hover
                            selected={isSelected}
                            onClick={() => setSelectedKey(rowKey)}
                            sx={{ cursor: 'pointer' }}
                          >
                            {columns.map((column) => (
                              <TableCell
                                key={`${rowKey}-${column.label}`}
                                align={column.align || 'left'}
                              >
                                {column.render
                                  ? column.render(row)
                                  : normalizeValue(row[column.key])}
                              </TableCell>
                            ))}
                          </TableRow>
                        );
                      })}

                      {!paginatedRows.length && (
                        <TableRow>
                          <TableCell colSpan={columns.length} align="center" sx={{ py: 5 }}>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                              {emptyMessage}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                {filteredRows.length > rowsPerPage && (
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Pagination
                      count={pageCount}
                      page={currentPage}
                      onChange={(event, value) => setPage(value)}
                      color="primary"
                    />
                  </Box>
                )}
              </Stack>
            </Card>
          </Grid>

          <Grid item xs={12} lg={4}>
            <Stack spacing={3}>
              <Card sx={{ p: 3 }}>
                <Stack spacing={2}>
                  <Typography variant="h6">Selected record</Typography>
                  {selectedRow ? (
                    <>
                      <Stack spacing={0.5}>
                        <Typography variant="subtitle1">
                          {getRowTitle
                            ? getRowTitle(selectedRow)
                            : normalizeValue(selectedRow[columns[0]?.key])}
                        </Typography>
                        {getRowSubtitle ? (
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            {getRowSubtitle(selectedRow)}
                          </Typography>
                        ) : null}
                      </Stack>

                      <Stack spacing={1.25}>
                        {resolvedReviewItems.map((item) => (
                          <Stack
                            key={item.label}
                            direction="row"
                            justifyContent="space-between"
                            spacing={2}
                          >
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                              {item.label}
                            </Typography>
                            <Box sx={{ textAlign: 'right' }}>{item.value}</Box>
                          </Stack>
                        ))}
                      </Stack>
                    </>
                  ) : (
                    <Alert severity="info" variant="outlined">
                      Select a row to review the current operational context.
                    </Alert>
                  )}
                </Stack>
              </Card>

              <Card sx={{ p: 3 }}>
                <Stack spacing={2}>
                  <Typography variant="h6">Control queue</Typography>
                  {resolvedQueueItems?.length ? (
                    resolvedQueueItems.map((item) => (
                      <Box
                        key={item.label}
                        sx={{ borderRadius: 2, bgcolor: 'background.neutral', px: 2, py: 1.5 }}
                      >
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          spacing={2}
                          alignItems="center"
                        >
                          <Typography variant="subtitle2">{item.label}</Typography>
                          <Chip
                            size="small"
                            label={item.value}
                            color={item.color || 'default'}
                            variant="outlined"
                          />
                        </Stack>
                        {item.helper ? (
                          <Typography
                            variant="caption"
                            sx={{ color: 'text.secondary', display: 'block', mt: 0.75 }}
                          >
                            {item.helper}
                          </Typography>
                        ) : null}
                      </Box>
                    ))
                  ) : (
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      No queued follow-up items for this desk.
                    </Typography>
                  )}
                </Stack>
              </Card>
            </Stack>
          </Grid>
        </Grid>
      </Stack>
    </Box>
  );
}
