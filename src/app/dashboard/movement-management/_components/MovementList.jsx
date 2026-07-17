'use client';

import { mutate } from 'swr';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useCallback, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
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

import axiosInstance, { endpoints } from 'src/utils/axios';

import { DashboardContent } from 'src/layouts/dashboard';
import StatusChip from 'src/app/dashboard/movement-management/_components/StatusChip';
import { useGetRequest, useDeleteRequest as deleteRequest } from 'src/actions/ledars-hook';
import DeleteConfirmDialog from 'src/app/dashboard/movement-management/_components/DeleteConfirmDialog';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

const SUMMARY_CARDS = [
  {
    key: 'total',
    label: 'Total',
    icon: 'solar:folder-bold',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    numColor: '#4527a0',
  },
  {
    key: 'draft',
    label: 'Draft',
    icon: 'solar:document-text-bold',
    gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    numColor: '#bf360c',
  },
  {
    key: 'submitted',
    label: 'Submitted',
    icon: 'solar:send-bold',
    gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    numColor: '#6a1b9a',
  },
  {
    key: 'approved',
    label: 'Approved',
    icon: 'solar:check-circle-bold',
    gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    numColor: '#1b5e20',
  },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'approved', label: 'Approved' },
];

const TABLE_HEAD = [
  { id: 'sn', label: '#', width: 50 },
  { id: 'name', label: 'Name' },
  { id: 'designation', label: 'Designation' },
  { id: 'project_name', label: 'Project' },
  { id: 'grand_total', label: 'Total (Tk)', width: 120 },
  { id: 'status', label: 'Status', width: 130 },
  { id: 'actions', label: 'Actions', width: 120 },
];

const PAGE_SIZE = 10;

export default function MovementList() {
  const router = useRouter();
  const confirm = useBoolean();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [summary, setSummary] = useState({ total: 0, draft: 0, submitted: 0, approved: 0 });

  const loadSummary = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get(endpoints.movementManagement.summary);
      setSummary(data);
    } catch (e) {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (search) params.set('search', search);
    params.set('page', page);
    return `${endpoints.movementManagement.list}?${params.toString()}`;
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
      await deleteRequest(endpoints.movementManagement.byId(deleteId));
      toast.success('Movement deleted successfully!');
      mutate(apiUrl);
      loadSummary();
      confirm.onFalse();
      setDeleteId(null);
    } catch (error) {
      toast.error(error?.detail || error?.message || 'Failed to delete');
    }
  }, [deleteId, apiUrl, confirm, loadSummary]);

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
        <Typography variant="h4">Movement Management</Typography>
        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:add-circle-bold-duotone" />}
          onClick={() => router.push('/dashboard/movement-management/create')}
        >
          Create Movement
        </Button>
      </Stack>

      {/* ── Summary Cards ── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {SUMMARY_CARDS.map((card) => (
          <Grid key={card.key} size={{ xs: 6, sm: 3 }}>
            <Card
              sx={{
                p: { xs: 2, md: 2.5 },
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                borderRadius: 3,
                boxShadow: 'none',
                border: '1px solid',
                borderColor: 'divider',
                transition: 'transform 0.18s, box-shadow 0.18s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                },
              }}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  background: card.gradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                }}
              >
                <Iconify icon={card.icon} width={22} sx={{ color: 'white' }} />
              </Box>
              <Box>
                <Typography
                  variant="h4"
                  sx={{ lineHeight: 1.1, color: card.numColor, fontWeight: 800 }}
                >
                  {summary[card.key]}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.25, fontSize: 12.5 }}
                >
                  {card.label}
                </Typography>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card>
        <Stack direction="row" spacing={2} sx={{ p: 2.5 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search by name or project..."
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
                      No movement records found.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row, index) => (
                  <TableRow
                    key={row.id}
                    hover
                    sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#f9fafb' } }}
                    onClick={() => router.push(`/dashboard/movement-management/${row.id}`)}
                  >
                    <TableCell>{(page - 1) * PAGE_SIZE + index + 1}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {row.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {row.grade}
                      </Typography>
                    </TableCell>
                    <TableCell>{row.designation}</TableCell>
                    <TableCell>
                      {Array.isArray(row.project_name)
                        ? (row.project_name.length > 0 ? row.project_name.join(', ') : '—')
                        : (row.project_name || '—')}
                    </TableCell>
                    <TableCell>
                      {(row.grand_total ?? 0).toLocaleString('en-BD', {
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell>
                      <StatusChip status={row.status} />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="View">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/dashboard/movement-management/${row.id}`);
                            }}
                          >
                            <Iconify icon="solar:eye-bold" width={18} />
                          </IconButton>
                        </Tooltip>
                        {row.status !== 'approved' && (
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(
                                  `/dashboard/movement-management/create?editId=${row.id}`
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
