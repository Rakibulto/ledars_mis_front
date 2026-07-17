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
import TableBody from '@mui/material/TableBody';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Pagination from '@mui/material/Pagination';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';

import { useBoolean } from 'src/hooks/use-boolean';

import { endpoints } from 'src/utils/axios';
import { fDate } from 'src/utils/format-time';

import { DashboardContent } from 'src/layouts/dashboard';
import StatusChip from 'src/_components/final-settlement/StatusChip';
import { useGetRequest, useDeleteRequest } from 'src/actions/ledars-hook';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import {
  useTable,
  emptyRows,
  TableNoData,
  getComparator,
  TableEmptyRows,
  TableHeadCustom,
} from 'src/components/table';

const TABLE_HEAD = [
  { id: 'sn', label: '#', width: 40 },
  { id: 'name_of_staff', label: 'Staff Name' },
  { id: 'project_name', label: 'Project' },
  { id: 'designation', label: 'Designation' },
  { id: 'date', label: 'Date' },
  { id: 'status', label: 'Status', width: 140 },
  { id: '', label: 'Actions', width: 120 },
];

export default function SettlementListView() {
  const router = useRouter();
  const table = useTable();
  const confirm = useBoolean();

  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteId, setDeleteId] = useState(null);

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (search) params.set('search', search);
    return `${endpoints.finalSettlement.list}?${params.toString()}`;
  }, [search, statusFilter]);

  const { data: apiData = [], loading } = useGetRequest(apiUrl, {
    refreshKey: apiUrl,
  });

  const data = useMemo(() => {
    const arr = Array.isArray(apiData) ? apiData : apiData.results || [];
    return arr;
  }, [apiData]);

  const totalItems = Array.isArray(apiData) ? apiData.length : apiData.count || 0;
  const pageSize = Array.isArray(apiData) ? 10 : apiData.page_size || 10;

  const dataFiltered = applyFilter({
    inputData: data,
    comparator: getComparator(table.order, table.orderBy),
  });

  const notFound = !dataFiltered.length;

  const deleteItem = useDeleteRequest;

  const handleDelete = useCallback(async () => {
    if (!deleteId) return;
    try {
      await deleteItem(endpoints.finalSettlement.byId(deleteId));
      toast.success('Settlement deleted successfully!');
      setDeleteId(null);
      confirm.onFalse();
      mutate(apiUrl);
    } catch (error) {
      toast.error('Failed to delete settlement.');
    }
  }, [deleteId, deleteItem, confirm, apiUrl]);

  const totalPages = useMemo(() => Math.ceil(totalItems / pageSize) || 1, [totalItems, pageSize]);

  return (
    <DashboardContent>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h4">Final Settlements</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Iconify icon="solar:add-circle-bold-duotone" />}
          onClick={() => router.push(paths.dashboard.finalSettlement.create)}
        >
          Add New
        </Button>
      </Stack>

      <Card>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ p: 2 }}>
          <TextField
            size="small"
            placeholder="Search by staff name or project..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="solar:magnifer-line-duotone" />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 280 }}
          />
          <TextField
            select
            size="small"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            label="Status"
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="Draft">Draft</MenuItem>
            <MenuItem value="Submitted">Submitted</MenuItem>
            <MenuItem value="Under_Review">Under Review</MenuItem>
            <MenuItem value="Approved">Approved</MenuItem>
            <MenuItem value="Rejected">Rejected</MenuItem>
            <MenuItem value="Payment_Pending">Payment Pending</MenuItem>
            <MenuItem value="Completed">Completed</MenuItem>
          </TextField>
        </Stack>

        <Scrollbar>
          <Table sx={{ minWidth: 800 }}>
            <TableHeadCustom
              order={table.order}
              orderBy={table.orderBy}
              headLabel={TABLE_HEAD}
              onSort={table.onSort}
            />

            <TableBody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={7} style={{ padding: 8 }}>
                        <Skeleton variant="rectangular" height={36} sx={{ borderRadius: 1 }} />
                      </td>
                    </tr>
                  ))
                : dataFiltered.map((row, index) => (
                    <tr key={row.id}>
                      <td style={{ padding: '8px 16px' }}>{page * pageSize + index + 1}</td>
                      <td style={{ padding: '8px 16px' }}>{row.name_of_staff}</td>
                      <td style={{ padding: '8px 16px' }}>{row.project_name}</td>
                      <td style={{ padding: '8px 16px' }}>{row.designation}</td>
                      <td style={{ padding: '8px 16px' }}>{row.date ? fDate(row.date) : '-'}</td>
                      <td style={{ padding: '8px 16px' }}>
                        <StatusChip status={row.status} />
                      </td>
                      <td style={{ padding: '8px 16px' }}>
                        <Stack direction="row" spacing={0.5}>
                          <Tooltip title="View">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => router.push(`/dashboard/final-settlement/${row.id}`)}
                            >
                              <Iconify icon="solar:eye-bold-duotone" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              color="secondary"
                              onClick={() =>
                                router.push(`/dashboard/final-settlement/create?editId=${row.id}`)
                              }
                            >
                              <Iconify icon="solar:pen-bold-duotone" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => {
                                setDeleteId(row.id);
                                confirm.onTrue();
                              }}
                            >
                              <Iconify icon="solar:trash-bin-trash-bold-duotone" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </td>
                    </tr>
                  ))}

              <TableEmptyRows
                emptyRows={emptyRows(table.page, table.rowsPerPage, dataFiltered.length)}
              />

              {!loading && notFound && <TableNoData notFound />}
            </TableBody>
          </Table>
        </Scrollbar>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            py: 2,
            px: 2,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Total: {totalItems} settlements
          </Typography>
          <Pagination
            count={totalPages}
            page={page + 1}
            onChange={(event, newPage) => {
              setPage(newPage - 1);
            }}
          />
        </Box>
      </Card>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete Settlement"
        content="Are you sure you want to delete this settlement? This action cannot be undone."
        action={
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        }
      />
    </DashboardContent>
  );
}

function applyFilter({ inputData, comparator }) {
  const stabilizedThis = inputData.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}
