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

import SummaryCard from '../../_components/summary-card';

const STATUS_LABELS = {
  active: 'Active',
  inactive: 'Inactive',
  suspended: 'Suspended',
};

const TYPE_LABELS = {
  individual: 'Individual',
  organization: 'Organization',
  government: 'Government',
  ngo: 'NGO',
};

export default function DonorManagementMain() {
  const [searchTerm, setSearchTerm] = useState('');
  const [nameFilter, setNameFilter] = useState('all');
  const [emailFilter, setEmailFilter] = useState('all');
  const [phoneFilter, setPhoneFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const rowsPerPage = 10;
  const table = useTable({ defaultCurrentPage: 0, defaultRowsPerPage: rowsPerPage });

  const [deleteId, setDeleteId] = useState(null);
  const confirm = useBoolean();
  const EP = endpoints.projectManagements;

  const { data: rawData, loading } = useGetRequest(EP.donors);
  const tableData = useMemo(
    () => (Array.isArray(rawData) ? rawData : rawData?.results || []),
    [rawData]
  );

  const donorNameOptions = useMemo(
    () => [...new Set(tableData.map((row) => row.name).filter(Boolean))].sort(),
    [tableData]
  );

  const donorEmailOptions = useMemo(
    () => [...new Set(tableData.map((row) => row.email).filter(Boolean))].sort(),
    [tableData]
  );

  const donorPhoneOptions = useMemo(
    () => [...new Set(tableData.map((row) => row.phone).filter(Boolean))].sort(),
    [tableData]
  );

  const filtered = useMemo(() => {
    let result = tableData;

    if (statusFilter !== 'all') {
      result = result.filter((row) => row.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      result = result.filter((row) => row.type === typeFilter);
    }

    if (nameFilter !== 'all') {
      result = result.filter((row) => row.name === nameFilter);
    }

    if (emailFilter !== 'all') {
      result = result.filter((row) => row.email === emailFilter);
    }

    if (phoneFilter !== 'all') {
      result = result.filter((row) => row.phone === phoneFilter);
    }

    if (searchTerm) {
      result = result.filter((row) => {
        const text = `${row.donor_code ?? ''} ${row.name ?? ''} ${row.email ?? ''} ${row.phone ?? ''} ${row.organization_name ?? ''}`;
        return text.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    return result;
  }, [searchTerm, statusFilter, typeFilter, nameFilter, emailFilter, phoneFilter, tableData]);

  const hasActiveFilters =
    statusFilter !== 'all' ||
    typeFilter !== 'all' ||
    nameFilter !== 'all' ||
    emailFilter !== 'all' ||
    phoneFilter !== 'all' ||
    Boolean(searchTerm);

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setTypeFilter('all');
    setNameFilter('all');
    setEmailFilter('all');
    setPhoneFilter('all');
    table.onResetPage();
  };

  const paginated = filtered.slice(
    table.page * table.rowsPerPage,
    table.page * table.rowsPerPage + table.rowsPerPage
  );

  const getErrorMessage = (error) => error?.message || error?.detail || null;

  const handleDelete = async () => {
    try {
      await deleteRequest(EP.donorById(deleteId));
      toast.success('Donor deleted successfully');
      mutate(EP.donors);
    } catch (error) {
      toast.error(getErrorMessage(error) || 'Unable to delete donor.');
    } finally {
      confirm.onFalse();
      setDeleteId(null);
    }
  };

  const totalDonors = tableData.length;
  const activeDonors = tableData.filter((row) => row.status === 'active').length;
  const totalDonation = tableData.reduce(
    (sum, row) => sum + Number(row.total_donated_amount || 0),
    0
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={700} mb={1}>
        Donor Management
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Manage donor profiles, track donations, and monitor engagement
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <SummaryCard
            title="Total Donors"
            value={totalDonors}
            icon="solar:users-group-rounded-bold-duotone"
            bgcolor="#2563eb"
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <SummaryCard
            title="Active Donors"
            value={activeDonors}
            icon="solar:shield-check-bold-duotone"
            bgcolor="#10b981"
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <SummaryCard
            title="Total Donated"
            value={`BDT ${totalDonation.toLocaleString()}`}
            icon="solar:wallet-money-bold-duotone"
            bgcolor="#8b5cf6"
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
              Donor Directory
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {filtered.length} donor{filtered.length === 1 ? '' : 's'} found
            </Typography>
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="stretch">
            <TextField
              size="small"
              placeholder="Search donors..."
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
              href={paths.dashboard.projects.donors.create}
              target="_blank"
              rel="noopener noreferrer"
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
              disabled={loading}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Add Donor
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
            <MenuItem value="suspended">Suspended</MenuItem>
          </TextField>

          <TextField
            select
            size="small"
            label="Type"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              table.onResetPage();
            }}
            sx={{ minWidth: { xs: '100%', md: 180 } }}
          >
            <MenuItem value="all">All types</MenuItem>
            <MenuItem value="individual">Individual</MenuItem>
            <MenuItem value="organization">Organization</MenuItem>
            <MenuItem value="government">Government</MenuItem>
            <MenuItem value="ngo">NGO</MenuItem>
          </TextField>

          <TextField
            select
            size="small"
            label="Donor Name"
            value={nameFilter}
            onChange={(e) => {
              setNameFilter(e.target.value);
              table.onResetPage();
            }}
            sx={{ minWidth: { xs: '100%', md: 180 } }}
          >
            <MenuItem value="all">All names</MenuItem>
            {donorNameOptions.map((name) => (
              <MenuItem key={name} value={name}>
                {name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            size="small"
            label="Email"
            value={emailFilter}
            onChange={(e) => {
              setEmailFilter(e.target.value);
              table.onResetPage();
            }}
            sx={{ minWidth: { xs: '100%', md: 220 } }}
          >
            <MenuItem value="all">All emails</MenuItem>
            {donorEmailOptions.map((email) => (
              <MenuItem key={email} value={email}>
                {email}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            size="small"
            label="Phone"
            value={phoneFilter}
            onChange={(e) => {
              setPhoneFilter(e.target.value);
              table.onResetPage();
            }}
            sx={{ minWidth: { xs: '100%', md: 180 } }}
          >
            <MenuItem value="all">All phones</MenuItem>
            {donorPhoneOptions.map((phone) => (
              <MenuItem key={phone} value={phone}>
                {phone}
              </MenuItem>
            ))}
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
                <TableCell sx={{ fontWeight: 700, color: '#374151' }}>Donor</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#374151' }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#374151' }}>Contact</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#374151' }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#374151' }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Box sx={{ py: 6, textAlign: 'center' }}>
                      <Iconify
                        icon="solar:users-group-rounded-bold-duotone"
                        width={48}
                        sx={{ color: 'text.disabled', mb: 1.5 }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        No donors found.
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((row) => (
                  <TableRow
                    key={row.id}
                    hover
                    sx={{
                      '&:last-child td': { borderBottom: 0 },
                      borderBottom: '1px solid #f3f4f6',

                      // Zebra rows
                      '&:nth-of-type(odd)': {
                        bgcolor: 'background.paper',
                      },

                      '&:nth-of-type(even)': {
                        bgcolor: '#f0fdf4', // light green
                      },

                      // Hover color
                      '&:hover': {
                        bgcolor: '#f0f9ff !important', // light blue
                      },
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={600} sx={{ mb: 0.25 }}>
                        {row.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {row.donor_code}
                      </Typography>
                      {row.organization_name && (
                        <Typography variant="caption" color="text.disabled">
                          {row.organization_name}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          display: 'inline-flex',
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 1.5,
                          bgcolor: 'primary.lighter',
                          color: 'primary.dark',
                        }}
                      >
                        <Typography
                          variant="caption"
                          fontWeight={600}
                          sx={{ textTransform: 'capitalize' }}
                        >
                          {TYPE_LABELS[row.type] || row.type || '—'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.primary">
                        {row.email || '—'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {row.phone || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Label
                        variant="soft"
                        color={
                          row.status === 'active'
                            ? 'success'
                            : row.status === 'inactive'
                              ? 'warning'
                              : 'error'
                        }
                      >
                        {STATUS_LABELS[row.status] || row.status}
                      </Label>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <IconButton
                          size="small"
                          component={RouterLink}
                          href={paths.dashboard.projects.donors.detail(row.id)}
                          sx={{
                            color: 'primary.main',
                            '&:hover': { bgcolor: 'primary.lighter' },
                          }}
                        >
                          <Iconify icon="solar:eye-bold" width={18} />
                        </IconButton>
                        <IconButton
                          size="small"
                          component="a"
                          href={paths.dashboard.projects.donors.edit(row.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{
                            color: 'info.main',
                            '&:hover': { bgcolor: 'info.lighter' },
                          }}
                        >
                          <Iconify icon="solar:pen-bold" width={18} />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            setDeleteId(row.id);
                            confirm.onTrue();
                          }}
                          sx={{
                            '&:hover': { bgcolor: 'error.lighter' },
                          }}
                        >
                          <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}

              <TableEmptyRows emptyRows={0} height={table.dense ? 52 : 76} />
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
        title="Delete donor"
        content="Are you sure you want to delete this donor? This action cannot be undone."
        action={
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        }
      />
    </Box>
  );
}
