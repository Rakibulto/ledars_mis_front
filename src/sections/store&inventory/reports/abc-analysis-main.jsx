'use client';

import React, { useMemo, useState } from 'react';

import {
  Box,
  Card,
  Chip,
  Grid,
  Alert,
  Stack,
  Table,
  Switch,
  Divider,
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

import { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';

const getClassTone = (value) => {
  switch (String(value || '').toUpperCase()) {
    case 'A':
      return { bgcolor: '#fee2e2', color: '#991b1b' };
    case 'B':
      return { bgcolor: '#fef3c7', color: '#92400e' };
    default:
      return { bgcolor: '#d1fae5', color: '#065f46' };
  }
};

const toAmount = (value) => Number(value || 0);

const formatCurrency = (value) => `BDT ${toAmount(value).toLocaleString()}`;

export default function AbcAnalysisMain() {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [dense, setDense] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const rowsPerPage = 10;

  const { data: rawData } = useGetRequest(endpoints.storeInventory.abc_analysis);
  const tableData = Array.isArray(rawData) ? rawData : rawData?.results || [];

  const filtered = useMemo(() => {
    if (!searchTerm) return tableData;
    return tableData.filter((row) =>
      Object.values(row).some((val) => String(val).toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [searchTerm, tableData]);

  const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const selectedItem = filtered.find((row) => row.id === selectedItemId) || filtered[0] || null;

  const abcSummary = useMemo(
    () => ({
      aValue: tableData
        .filter((row) => String(row.class || '').toUpperCase() === 'A')
        .reduce((sum, row) => sum + toAmount(row.annual_value), 0),
      cItems: tableData.filter((row) => String(row.class || '').toUpperCase() === 'C').length,
      priorityReview: tableData.filter((row) => Number(row.cumulative || 0) >= 80).length,
    }),
    [tableData]
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        ABC Analysis
      </Typography>

      <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
        The ABC desk should highlight which products concentrate the most annual value, where review
        focus should sit, and which lower-class items can be managed with lighter control.
      </Alert>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <Iconify
              icon="solar:medal-star-bold-duotone"
              width={40}
              sx={{ mb: 1, color: 'primary.main' }}
            />
            <Typography variant="h4">{tableData.filter((a) => a.class === 'A').length}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Class A Items
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <Iconify
              icon="solar:medal-ribbons-star-bold-duotone"
              width={40}
              sx={{ mb: 1, color: 'primary.main' }}
            />
            <Typography variant="h4">{tableData.filter((a) => a.class === 'B').length}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Class B Items
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <Iconify
              icon="solar:widget-bold-duotone"
              width={40}
              sx={{ mb: 1, color: 'primary.main' }}
            />
            <Typography variant="h4">{tableData.filter((a) => a.class === 'C').length}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Class C Items
            </Typography>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Card sx={{ p: 2, borderRadius: 3, border: '1px solid #e5e7eb' }}>
            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <TextField
                size="small"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="solar:magnifer-bold-duotone" />
                    </InputAdornment>
                  ),
                }}
                sx={{ width: 300 }}
              />
            </Stack>

            <TableContainer>
              <Table size={dense ? 'small' : 'medium'}>
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell>Annual Value</TableCell>
                    <TableCell>Percentage</TableCell>
                    <TableCell>Cumulative %</TableCell>
                    <TableCell>Class</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginated.map((row, idx) => (
                    <TableRow
                      key={row.id || idx}
                      hover
                      selected={row.id === selectedItem?.id}
                      onClick={() => setSelectedItemId(row.id)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>{String(row.product_name ?? '')}</TableCell>
                      <TableCell>{formatCurrency(row.annual_value)}</TableCell>
                      <TableCell>{String(row.percentage ?? '')}%</TableCell>
                      <TableCell>{String(row.cumulative ?? '')}%</TableCell>
                      <TableCell>
                        <Chip
                          label={String(row.class ?? 'N/A')}
                          size="small"
                          sx={{
                            bgcolor: getClassTone(row.class).bgcolor,
                            color: getClassTone(row.class).color,
                            fontWeight: 700,
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {paginated.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          No records found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              <FormControlLabel
                control={
                  <Switch checked={dense} onChange={(event) => setDense(event.target.checked)} />
                }
                label="Dense"
              />

              {filtered.length > rowsPerPage && (
                <Pagination
                  count={Math.ceil(filtered.length / rowsPerPage)}
                  page={page}
                  onChange={(e, v) => setPage(v)}
                  color="primary"
                />
              )}
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Stack spacing={3}>
            <Card sx={{ borderRadius: 3, border: '1px solid #e5e7eb' }}>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Selected Item Review
                </Typography>
                {selectedItem ? (
                  <Stack spacing={1.5}>
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#f9fafb' }}>
                      <Typography variant="body2" fontWeight={700}>
                        {selectedItem.product_name || 'Analyzed item'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Annual value concentration review
                      </Typography>
                    </Box>
                    <Chip
                      label={`Class ${selectedItem.class || 'N/A'}`}
                      size="small"
                      sx={{
                        width: 'fit-content',
                        bgcolor: getClassTone(selectedItem.class).bgcolor,
                        color: getClassTone(selectedItem.class).color,
                        fontWeight: 700,
                      }}
                    />
                    <Alert severity="warning" sx={{ borderRadius: 2 }}>
                      Cumulative contribution: {selectedItem.cumulative || 0}%
                    </Alert>
                    <Divider />
                    <Typography variant="body2" color="text.secondary">
                      {String(selectedItem.class || '').toUpperCase() === 'A'
                        ? 'This is a high-control item. Keep replenishment, approval, and count-cycle attention tight.'
                        : String(selectedItem.class || '').toUpperCase() === 'B'
                          ? 'This item needs moderate control. Review periodically and align reorder policies with demand stability.'
                          : 'This is a lower-value item. Keep control lightweight unless availability risk becomes operationally significant.'}
                    </Typography>
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Select an analyzed item to review value concentration and control intensity.
                  </Typography>
                )}
              </Box>
            </Card>

            <Card sx={{ borderRadius: 3, border: '1px solid #e5e7eb' }}>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  ABC Control Queue
                </Typography>
                <Stack spacing={1.5}>
                  <Alert severity="error" sx={{ borderRadius: 2 }}>
                    Class A value under watch: {formatCurrency(abcSummary.aValue)}.
                  </Alert>
                  <Alert severity="warning" sx={{ borderRadius: 2 }}>
                    {abcSummary.priorityReview} item(s) sit in the top 80% cumulative contribution
                    band.
                  </Alert>
                  <Alert severity="success" sx={{ borderRadius: 2 }}>
                    {abcSummary.cItems} class C item(s) can stay under lighter review.
                  </Alert>
                </Stack>
              </Box>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
