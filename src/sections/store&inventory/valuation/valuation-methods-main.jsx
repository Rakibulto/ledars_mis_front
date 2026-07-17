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

const getMethodStateTone = (isActive) => ({
  bgcolor: isActive ? '#d1fae5' : '#f3f4f6',
  color: isActive ? '#065f46' : '#374151',
});

export default function ValuationMethodsMain() {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [dense, setDense] = useState(false);
  const [selectedMethodId, setSelectedMethodId] = useState(null);
  const rowsPerPage = 10;

  const { data: rawData } = useGetRequest(endpoints.storeInventory.inventory_valuations);
  const INVENTORY_VALUATION = Array.isArray(rawData) ? rawData : rawData?.results || [];

  const methods = [
    {
      id: 1,
      name: 'FIFO (First In First Out)',
      code: 'FIFO',
      description: 'Cost of oldest inventory is used first',
      products_using: INVENTORY_VALUATION.filter((v) => v.method === 'FIFO').length,
      is_active: true,
    },
    {
      id: 2,
      name: 'Average Cost',
      code: 'AVG',
      description: 'Weighted average cost of all units',
      products_using: INVENTORY_VALUATION.filter((v) => v.method === 'Average Cost').length,
      is_active: true,
    },
    {
      id: 3,
      name: 'Standard Cost',
      code: 'STD',
      description: 'Pre-determined fixed cost per unit',
      products_using: 0,
      is_active: true,
    },
    {
      id: 4,
      name: 'Specific Identification',
      code: 'SPEC',
      description: 'Actual cost of each specific item',
      products_using: 0,
      is_active: false,
    },
  ];
  const tableData = methods;

  const filtered = useMemo(() => {
    if (!searchTerm) return tableData;
    return tableData.filter((row) =>
      Object.values(row).some((val) => String(val).toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [searchTerm, tableData]);

  const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const selectedMethod = filtered.find((row) => row.id === selectedMethodId) || filtered[0] || null;

  const methodSummary = useMemo(
    () => ({
      active: tableData.filter((row) => row.is_active).length,
      inactive: tableData.filter((row) => !row.is_active).length,
      coverage: tableData.reduce((sum, row) => sum + Number(row.products_using || 0), 0),
    }),
    [tableData]
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Valuation Methods
      </Typography>

      <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
        The valuation method desk should show which costing policies are active, how widely they are
        used, and where inactive or underused methods need governance review before they affect
        stock value.
      </Alert>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <Iconify
              icon="solar:calculator-bold-duotone"
              width={40}
              sx={{ mb: 1, color: 'primary.main' }}
            />
            <Typography variant="h4">{methods.length}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Total Methods
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <Iconify
              icon="solar:check-circle-bold-duotone"
              width={40}
              sx={{ mb: 1, color: 'primary.main' }}
            />
            <Typography variant="h4">{methodSummary.active}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Active Policies
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <Iconify
              icon="solar:box-bold-duotone"
              width={40}
              sx={{ mb: 1, color: 'primary.main' }}
            />
            <Typography variant="h4">{methodSummary.coverage}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Products Covered
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
                    <TableCell>ID</TableCell>
                    <TableCell>Method</TableCell>
                    <TableCell>Code</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Products Using</TableCell>
                    <TableCell>State</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginated.map((row, idx) => (
                    <TableRow
                      key={row.id || idx}
                      hover
                      selected={row.id === selectedMethod?.id}
                      onClick={() => setSelectedMethodId(row.id)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>{String(row.id ?? '')}</TableCell>
                      <TableCell>{String(row.name ?? '')}</TableCell>
                      <TableCell>{String(row.code ?? '')}</TableCell>
                      <TableCell>{String(row.description ?? '')}</TableCell>
                      <TableCell>{String(row.products_using ?? '')}</TableCell>
                      <TableCell>
                        <Chip
                          label={row.is_active ? 'Active' : 'Inactive'}
                          size="small"
                          sx={{
                            bgcolor: getMethodStateTone(row.is_active).bgcolor,
                            color: getMethodStateTone(row.is_active).color,
                            fontWeight: 700,
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {paginated.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
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
                  Selected Method Review
                </Typography>
                {selectedMethod ? (
                  <Stack spacing={1.5}>
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#f9fafb' }}>
                      <Typography variant="body2" fontWeight={700}>
                        {selectedMethod.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Code: {selectedMethod.code}
                      </Typography>
                    </Box>

                    <Chip
                      label={selectedMethod.is_active ? 'Active' : 'Inactive'}
                      size="small"
                      sx={{
                        width: 'fit-content',
                        bgcolor: getMethodStateTone(selectedMethod.is_active).bgcolor,
                        color: getMethodStateTone(selectedMethod.is_active).color,
                        fontWeight: 700,
                      }}
                    />

                    <Alert severity="info" sx={{ borderRadius: 2 }}>
                      Products using this method: {selectedMethod.products_using || 0}
                    </Alert>

                    <Divider />

                    <Box>
                      <Typography variant="subtitle2" fontWeight={700}>
                        Governance action
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {!selectedMethod.is_active
                          ? 'This method is inactive. Confirm it is intentionally retired and that no product policies still reference it.'
                          : Number(selectedMethod.products_using || 0) === 0
                            ? 'This active method is not currently used. Decide whether to keep it for future policy use or retire it.'
                            : 'This method is in live use. Review whether the product count and cost policy still match finance and warehouse practice.'}
                      </Typography>
                    </Box>
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Select a valuation method to review usage and governance status.
                  </Typography>
                )}
              </Box>
            </Card>

            <Card sx={{ borderRadius: 3, border: '1px solid #e5e7eb' }}>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Method Governance Queue
                </Typography>
                <Stack spacing={1.5}>
                  <Alert severity="success" sx={{ borderRadius: 2 }}>
                    {methodSummary.active} valuation method(s) are active for operational use.
                  </Alert>
                  <Alert severity="warning" sx={{ borderRadius: 2 }}>
                    {methodSummary.inactive} method(s) are inactive and need policy confirmation.
                  </Alert>
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    Total product-method assignments observed: {methodSummary.coverage}.
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
