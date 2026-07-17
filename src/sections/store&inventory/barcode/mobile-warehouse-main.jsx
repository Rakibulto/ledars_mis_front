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
  Button,
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

import { Iconify } from 'src/components/iconify';

const normalizeText = (value) =>
  String(value || '')
    .trim()
    .toLowerCase();

const devices = [
  {
    id: 1,
    device_name: 'Zebra TC52 - Unit 1',
    assigned_to: 'Md. Rafiq Hasan',
    warehouse: 'Central Warehouse - Dhaka',
    status: 'Online',
    battery: '85%',
    last_sync: '2025-03-15 14:30',
  },
  {
    id: 2,
    device_name: 'Zebra TC52 - Unit 2',
    assigned_to: 'Anika Sultana',
    warehouse: 'Regional Warehouse - Chittagong',
    status: 'Online',
    battery: '72%',
    last_sync: '2025-03-15 13:15',
  },
  {
    id: 3,
    device_name: 'Honeywell CT60 - Unit 1',
    assigned_to: 'Kamal Uddin',
    warehouse: "Field Store - Cox's Bazar",
    status: 'Offline',
    battery: '15%',
    last_sync: '2025-03-14 18:00',
  },
];

const initialTasks = [
  {
    id: 1,
    task: 'Receive hygiene kits',
    operator: 'Md. Rafiq Hasan',
    warehouse: 'Central Warehouse - Dhaka',
    operation: 'receive',
    status: 'Pending',
    device: 'Zebra TC52 - Unit 1',
    quantity: 24,
  },
  {
    id: 2,
    task: 'Pick education packs',
    operator: 'Anika Sultana',
    warehouse: 'Regional Warehouse - Chittagong',
    operation: 'pick',
    status: 'In Progress',
    device: 'Zebra TC52 - Unit 2',
    quantity: 18,
  },
  {
    id: 3,
    task: 'Transfer medical cartons',
    operator: 'Kamal Uddin',
    warehouse: "Field Store - Cox's Bazar",
    operation: 'transfer',
    status: 'Offline Queue',
    device: 'Honeywell CT60 - Unit 1',
    quantity: 12,
  },
  {
    id: 4,
    task: 'Count nutrition items',
    operator: 'Anika Sultana',
    warehouse: 'Regional Warehouse - Chittagong',
    operation: 'count',
    status: 'Pending',
    device: 'Zebra TC52 - Unit 2',
    quantity: 43,
  },
];

export default function MobileWarehouseMain() {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [dense, setDense] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [tasks, setTasks] = useState(initialTasks);
  const rowsPerPage = 10;

  const filtered = useMemo(() => {
    if (!searchTerm) return tasks;
    return tasks.filter((row) =>
      Object.values(row).some((val) => normalizeText(val).includes(normalizeText(searchTerm)))
    );
  }, [searchTerm, tasks]);

  const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const selectedTask = filtered.find((row) => row.id === selectedTaskId) || filtered[0] || null;

  const taskControls = useMemo(
    () => ({
      pending: tasks.filter((row) => normalizeText(row.status) === 'pending').length,
      inProgress: tasks.filter((row) => normalizeText(row.status) === 'in progress').length,
      offline: tasks.filter((row) => normalizeText(row.status) === 'offline queue').length,
      onlineDevices: devices.filter((row) => normalizeText(row.status) === 'online').length,
    }),
    [tasks]
  );

  const updateTaskStatus = (status) => {
    if (!selectedTask) return;
    setTasks((prev) => prev.map((row) => (row.id === selectedTask.id ? { ...row, status } : row)));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Mobile Warehouse
      </Typography>

      <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
        The mobile warehouse desk should show operator task queues, offline risk, and quick
        execution status changes for receiving, picking, transfer, and count work.
      </Alert>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <Iconify
              icon="solar:smartphone-bold-duotone"
              width={40}
              sx={{ mb: 1, color: 'primary.main' }}
            />
            <Typography variant="h4">{devices.length}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Devices
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <Iconify
              icon="solar:check-circle-bold-duotone"
              width={40}
              sx={{ mb: 1, color: 'success.main' }}
            />
            <Typography variant="h4">{taskControls.onlineDevices}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Online Devices
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <Iconify
              icon="solar:clock-circle-bold-duotone"
              width={40}
              sx={{ mb: 1, color: 'warning.main' }}
            />
            <Typography variant="h4">{taskControls.pending}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Pending Tasks
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <Iconify
              icon="solar:cloud-cross-bold-duotone"
              width={40}
              sx={{ mb: 1, color: 'error.main' }}
            />
            <Typography variant="h4">{taskControls.offline}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Offline Queue
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
                placeholder="Search mobile tasks..."
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
                sx={{ width: 320 }}
              />
            </Stack>

            <TableContainer>
              <Table size={dense ? 'small' : 'medium'}>
                <TableHead>
                  <TableRow>
                    <TableCell>Task</TableCell>
                    <TableCell>Operator</TableCell>
                    <TableCell>Warehouse</TableCell>
                    <TableCell>Operation</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Qty</TableCell>
                    <TableCell>Device</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginated.map((row) => (
                    <TableRow
                      key={row.id}
                      hover
                      selected={row.id === selectedTask?.id}
                      onClick={() => setSelectedTaskId(row.id)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>{row.task}</TableCell>
                      <TableCell>{row.operator}</TableCell>
                      <TableCell>{row.warehouse}</TableCell>
                      <TableCell sx={{ textTransform: 'capitalize' }}>{row.operation}</TableCell>
                      <TableCell>
                        <Chip
                          label={row.status}
                          size="small"
                          sx={{
                            bgcolor:
                              normalizeText(row.status) === 'offline queue'
                                ? '#fee2e2'
                                : normalizeText(row.status) === 'in progress'
                                  ? '#dbeafe'
                                  : '#fef3c7',
                            color:
                              normalizeText(row.status) === 'offline queue'
                                ? '#991b1b'
                                : normalizeText(row.status) === 'in progress'
                                  ? '#1e40af'
                                  : '#92400e',
                            fontWeight: 700,
                          }}
                        />
                      </TableCell>
                      <TableCell>{row.quantity}</TableCell>
                      <TableCell>{row.device}</TableCell>
                    </TableRow>
                  ))}
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
                  onChange={(event, value) => setPage(value)}
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
                  Selected Task Review
                </Typography>
                {selectedTask ? (
                  <Stack spacing={1.5}>
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#f9fafb' }}>
                      <Typography variant="body2" fontWeight={700}>
                        {selectedTask.task}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {selectedTask.operator} | {selectedTask.device}
                      </Typography>
                    </Box>
                    <Chip
                      label={selectedTask.status}
                      size="small"
                      sx={{
                        width: 'fit-content',
                        bgcolor:
                          normalizeText(selectedTask.status) === 'offline queue'
                            ? '#fee2e2'
                            : normalizeText(selectedTask.status) === 'in progress'
                              ? '#dbeafe'
                              : '#fef3c7',
                        color:
                          normalizeText(selectedTask.status) === 'offline queue'
                            ? '#991b1b'
                            : normalizeText(selectedTask.status) === 'in progress'
                              ? '#1e40af'
                              : '#92400e',
                        fontWeight: 700,
                      }}
                    />
                    <Grid container spacing={1.5}>
                      <Grid item xs={6}>
                        <Alert severity="info" sx={{ borderRadius: 2 }}>
                          Qty: {selectedTask.quantity}
                        </Alert>
                      </Grid>
                      <Grid item xs={6}>
                        <Alert severity="warning" sx={{ borderRadius: 2 }}>
                          {selectedTask.operation}
                        </Alert>
                      </Grid>
                    </Grid>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700}>
                        Next control action
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {normalizeText(selectedTask.status) === 'offline queue'
                          ? 'Restore device connectivity or manually reconcile the queued mobile task before closing it.'
                          : normalizeText(selectedTask.status) === 'in progress'
                            ? 'Keep scanning until the warehouse task is confirmed complete on device.'
                            : 'Release this task to the operator and start execution from the handheld workflow.'}
                      </Typography>
                    </Box>
                    <Divider />
                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="outlined"
                        onClick={() => updateTaskStatus('In Progress')}
                        sx={{ textTransform: 'none' }}
                      >
                        Start
                      </Button>
                      <Button
                        variant="contained"
                        onClick={() => updateTaskStatus('Completed')}
                        sx={{ textTransform: 'none' }}
                      >
                        Complete
                      </Button>
                    </Stack>
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Select a mobile task to review operator, device, and execution next step.
                  </Typography>
                )}
              </Box>
            </Card>

            <Card sx={{ borderRadius: 3, border: '1px solid #e5e7eb' }}>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Mobile Control Queue
                </Typography>
                <Stack spacing={1.5}>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#fff7ed' }}>
                    <Typography variant="body2" fontWeight={700}>
                      Pending Tasks
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {taskControls.pending} tasks are waiting for assignment or start.
                    </Typography>
                  </Box>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#eff6ff' }}>
                    <Typography variant="body2" fontWeight={700}>
                      In Progress
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {taskControls.inProgress} tasks are being executed on handheld devices.
                    </Typography>
                  </Box>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#fef2f2' }}>
                    <Typography variant="body2" fontWeight={700}>
                      Offline Queue
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {taskControls.offline} tasks need sync recovery before closeout.
                    </Typography>
                  </Box>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#ecfdf5' }}>
                    <Typography variant="body2" fontWeight={700}>
                      Online Devices
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {taskControls.onlineDevices} devices are currently available for execution.
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
