'use client';

import { mutate } from 'swr';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import Skeleton from '@mui/material/Skeleton';
import TableRow from '@mui/material/TableRow';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TextField from '@mui/material/TextField';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Pagination from '@mui/material/Pagination';
import InputAdornment from '@mui/material/InputAdornment';

import { useBoolean } from 'src/hooks/use-boolean';

import { endpoints } from 'src/utils/axios';

import { DashboardContent } from 'src/layouts/dashboard';
import { useGetRequest, useDeleteRequest as deleteRequest } from 'src/actions/ledars-hook';
import StatusChip from 'src/app/dashboard/accounting-finance/provident-fund/_components/StatusChip';
import DeleteConfirmDialog from 'src/app/dashboard/accounting-finance/provident-fund/_components/DeleteConfirmDialog';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

const TABLE_HEAD = [
  { id: 'sn', label: '#', width: 50 },
  { id: 'applicant_name', label: 'Applicant Name' },
  { id: 'designation', label: 'Designation' },
  { id: 'program_name', label: 'Program Name' },
  { id: 'expected_loan_amount', label: 'Expected Loan (Tk)', width: 140 },
  { id: 'status', label: 'Status', width: 130 },
  { id: 'application_date', label: 'Date', width: 110 },
  { id: 'actions', label: 'Actions', width: 120 },
];

const PAGE_SIZE = 10;

export default function ProvidentFundList() {
  const router = useRouter();
  const confirm = useBoolean();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteId, setDeleteId] = useState(null);

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (search) params.set('search', search);
    params.set('page', page);
    return `${endpoints.providentFund.list}?${params.toString()}`;
  }, [search, statusFilter, page]);

  const { data: apiData, loading } = useGetRequest(apiUrl);

  const data = useMemo(() => {
    if (Array.isArray(apiData)) return apiData;
    return apiData?.results || [];
  }, [apiData]);

  const totalCount = useMemo(() => {
    if (Array.isArray(apiData)) return apiData.length;
    return apiData?.count || 0;
  }, [apiData]);

  const totalPages = useMemo(() => Math.ceil(totalCount / PAGE_SIZE) || 1, [totalCount]);

  const handleDelete = useCallback(async () => {
    if (!deleteId) return;
    try {
      await deleteRequest(endpoints.providentFund.byId(deleteId));
      toast.success('PF loan application deleted successfully!');
      mutate(apiUrl);
      confirm.onFalse();
      setDeleteId(null);
    } catch (error) {
      toast.error(error?.detail || error?.message || 'Failed to delete');
    }
  }, [deleteId, apiUrl, confirm]);

  const handleDeleteClick = useCallback(
    (id) => {
      setDeleteId(id);
      confirm.onTrue();
    },
    [confirm]
  );

  const handlePageChange = useCallback((_, value) => {
    setPage(value);
  }, []);

  const handleSearchChange = useCallback((e) => {
    setSearch(e.target.value);
    setPage(1);
  }, []);

  const handleStatusChange = useCallback((e) => {
    setStatusFilter(e.target.value);
    setPage(1);
  }, []);

  const renderSkeleton = () =>
    Array.from({ length: 5 }).map((_, i) => (
      <TableRow key={i}>
        {TABLE_HEAD.map((col) => (
          <TableCell key={col.id}>
            <Skeleton variant="text" width="80%" />
          </TableCell>
        ))}
      </TableRow>
    ));

  return (
    <DashboardContent>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h4">Provident Fund Loan Applications</Typography>
        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:add-circle-bold-duotone" />}
          onClick={() => router.push('/dashboard/accounting-finance/provident-fund/create')}
        >
          Create PF Loan
        </Button>
      </Stack>

      <Card>
        <Stack direction="row" spacing={2} sx={{ p: 2.5 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search by name, program, or designation..."
            value={search}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify
                    icon="solar:magnifer-linear"
                    width={20}
                    sx={{ color: 'text.disabled' }}
                  />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            select
            size="small"
            sx={{ minWidth: 160 }}
            value={statusFilter}
            onChange={handleStatusChange}
          >
            {STATUS_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>
        </Stack>

        <Box sx={{ overflow: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow>
                {TABLE_HEAD.map((headCell) => (
                  <TableCell
                    key={headCell.id}
                    sx={{ fontWeight: 700, bgcolor: 'grey.50', whiteSpace: 'nowrap' }}
                    width={headCell.width}
                  >
                    {headCell.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                renderSkeleton()
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={TABLE_HEAD.length} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                      No PF loan applications found.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row, index) => (
                  <TableRow
                    key={row.id}
                    hover
                    sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#f9fafb' } }}
                    onClick={() =>
                      router.push(`/dashboard/accounting-finance/provident-fund/${row.id}`)
                    }
                  >
                    <TableCell>{(page - 1) * PAGE_SIZE + index + 1}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {row.applicant_name}
                      </Typography>
                    </TableCell>
                    <TableCell>{row.designation}</TableCell>
                    <TableCell>{row.program_name}</TableCell>
                    <TableCell>
                      {(row.expected_loan_amount ?? 0).toLocaleString('en-BD', {
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell>
                      <StatusChip status={row.status} />
                    </TableCell>
                    <TableCell>{row.application_date || ''}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="View">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/dashboard/accounting-finance/provident-fund/${row.id}`);
                            }}
                          >
                            <Iconify icon="solar:eye-bold" width={18} />
                          </IconButton>
                        </Tooltip>
                        {row.status === 'draft' && (
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(
                                  `/dashboard/accounting-finance/provident-fund/create?editId=${row.id}`
                                );
                              }}
                            >
                              <Iconify icon="solar:pen-bold" width={18} />
                            </IconButton>
                          </Tooltip>
                        )}
                        {row.status === 'draft' && (
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(row.id);
                              }}
                            >
                              <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Box>

        {totalPages > 1 && (
          <Stack alignItems="center" sx={{ py: 2 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              color="primary"
            />
          </Stack>
        )}
      </Card>

      <DeleteConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        onConfirm={handleDelete}
        loading={false}
      />
    </DashboardContent>
  );
}
