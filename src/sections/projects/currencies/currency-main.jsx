'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import React, { useMemo, useState } from 'react';

import {
  Box,
  Card,
  Grid,
  Stack,
  Table,
  Button,
  MenuItem,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  IconButton,
  Typography,
  InputAdornment,
  TableContainer,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useBoolean } from 'src/hooks/use-boolean';

import { endpoints } from 'src/utils/axios';

import { useGetRequest, useDeleteRequest as deleteRequest } from 'src/actions/ledars-hook';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { useTable, TableEmptyRows, TablePaginationCustom } from 'src/components/table';

const STATUS_LABELS = {
  active: 'Active',
  inactive: 'Inactive',
};

export default function CurrencyManagementMain() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const rowsPerPage = 10;
  const table = useTable({ defaultCurrentPage: 0, defaultRowsPerPage: rowsPerPage });

  const [deleteId, setDeleteId] = useState(null);
  const confirm = useBoolean();
  const EP = endpoints.projectManagements;

  const { data: rawData, loading } = useGetRequest(EP.currencies);
  const tableData = useMemo(
    () => (Array.isArray(rawData) ? rawData : rawData?.results || []),
    [rawData]
  );

  const filtered = useMemo(() => {
    let result = tableData;

    if (statusFilter !== 'all') {
      result = result.filter((row) => row.status === statusFilter);
    }

    if (searchTerm) {
      result = result.filter((row) => {
        const text = `${row.code ?? ''} ${row.name ?? ''} ${row.symbol ?? ''} ${row.base_currency ?? ''}`;
        return text.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    return result;
  }, [searchTerm, statusFilter, tableData]);

  const hasActiveFilters = statusFilter !== 'all' || Boolean(searchTerm);

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    table.onResetPage();
  };

  const paginated = filtered.slice(
    table.page * table.rowsPerPage,
    table.page * table.rowsPerPage + table.rowsPerPage
  );

  const getErrorMessage = (error) => error?.message || error?.detail || null;

  const handleDelete = async () => {
    try {
      await deleteRequest(EP.currencyById(deleteId));
      toast.success('Currency deleted successfully');
      mutate(EP.currencies);
    } catch (error) {
      toast.error(getErrorMessage(error) || 'Unable to delete currency.');
    } finally {
      confirm.onFalse();
      setDeleteId(null);
    }
  };

  const totalCurrencies = tableData.length;
  const activeCurrencies = tableData.filter((row) => row.status === 'active').length;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={700} mb={1}>
        Currency Management
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Manage currencies, symbols, and exchange rates used across projects
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <SummaryCard
            title="Total Currencies"
            value={totalCurrencies}
            icon="solar:currency-dollar-bold-duotone"
            bgcolor="#2563eb"
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <SummaryCard
            title="Active Currencies"
            value={activeCurrencies}
            icon="solar:shield-check-bold-duotone"
            bgcolor="#10b981"
            loading={loading}
          />
        </Grid>
      </Grid>

      <Card
        sx={{
          borderRadius: 3,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', sm: 'center' }}
          spacing={2}
          sx={{ p: 2.5, borderBottom: '1px solid #e5e7eb' }}
        >
          <Box>
            <Typography variant="h6" fontWeight={600}>
              Currency Directory
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {filtered.length} currency{filtered.length === 1 ? '' : 's'} found
            </Typography>
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="stretch">
            <TextField
              size="small"
              placeholder="Search currencies..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                table.onResetPage();
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="solar:magnifer-bold-duotone" width={20} />
                  </InputAdornment>
                ),
              }}
              sx={{ width: { xs: '100%', sm: 280 } }}
            />
            <Button
              component="a"
              href={paths.dashboard.projects.currencies.create}
              target="_blank"
              rel="noopener noreferrer"
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
              disabled={loading}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Add Currency
            </Button>
          </Stack>
        </Stack>

        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1.5}
          alignItems={{ xs: 'stretch', md: 'center' }}
          sx={{
            px: 2.5,
            py: 2,
            borderBottom: '1px solid #e5e7eb',
            bgcolor: '#fafafa',
          }}
        >
          <TextField
            select
            size="small"
            label="Status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              table.onResetPage();
            }}
            sx={{ minWidth: { xs: '100%', md: 160 } }}
          >
            <MenuItem value="all">All status</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </TextField>

          {hasActiveFilters && (
            <Button
              size="small"
              color="inherit"
              startIcon={<Iconify icon="solar:restart-bold" width={18} />}
              onClick={handleResetFilters}
              sx={{ alignSelf: { xs: 'flex-start', md: 'center' }, whiteSpace: 'nowrap' }}
            >
              Clear filters
            </Button>
          )}
        </Stack>

        <TableContainer>
          <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 720 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f9fafb' }}>
                <TableCell sx={{ fontWeight: 700, color: '#374151' }}>Code</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#374151' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#374151' }}>Symbol</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#374151' }}>Exchange Rate</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#374151' }}>Base</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#374151' }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#374151' }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <Box sx={{ py: 6, textAlign: 'center' }}>
                      <Iconify
                        icon="solar:currency-dollar-bold-duotone"
                        width={48}
                        sx={{ color: 'text.disabled', mb: 1 }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        No currencies found
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{row.code}</TableCell>
                    <TableCell>{row.name || '—'}</TableCell>
                    <TableCell>{row.symbol || '—'}</TableCell>
                    <TableCell sx={{ fontVariantNumeric: 'tabular-nums' }}>
                      {Number(row.exchange_rate || 0).toLocaleString(undefined, {
                        maximumFractionDigits: 6,
                      })}
                    </TableCell>
                    <TableCell>{row.base_currency || '—'}</TableCell>
                    <TableCell>
                      <Label color={row.status === 'active' ? 'success' : 'default'}>
                        {STATUS_LABELS[row.status] || row.status}
                      </Label>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <IconButton
                          component={RouterLink}
                          href={paths.dashboard.projects.currencies.edit(row.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          size="small"
                          color="info"
                        >
                          <Iconify icon="solar:pen-bold" width={20} />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            setDeleteId(row.id);
                            confirm.onTrue();
                          }}
                        >
                          <Iconify icon="solar:trash-bin-trash-bold" width={20} />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
              <TableEmptyRows
                emptyRows={Math.max(0, rowsPerPage - paginated.length)}
                height={table.dense ? 52 : 76}
              />
            </TableBody>
          </Table>
        </TableContainer>

        <TablePaginationCustom
          count={filtered.length}
          page={table.page}
          rowsPerPage={table.rowsPerPage}
          onPageChange={table.onChangePage}
          onRowsPerPageChange={table.onChangeRowsPerPage}
          dense={table.dense}
          onChangeDense={table.onChangeDense}
        />
      </Card>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete Currency"
        content="Are you sure you want to delete this currency? This action cannot be undone."
        action={
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        }
      />
    </Box>
  );
}

function SummaryCard({ title, value, icon, bgcolor, loading }) {
  return (
    <Card
      sx={{
        borderRadius: 3,
        border: '1px solid #e5e7eb',
        p: 2.5,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
      }}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          bgcolor,
          flexShrink: 0,
        }}
      >
        <Iconify icon={icon} width={26} />
      </Box>
      <Box>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
        <Typography variant="h5" fontWeight={700}>
          {loading ? '—' : value}
        </Typography>
      </Box>
    </Card>
  );
}
