'use client';

import React, { useMemo, useState } from 'react';

import { alpha, useTheme } from '@mui/material/styles';
import {
  Box,
  Card,
  Grid,
  Alert,
  Stack,
  Table,
  Button,
  Dialog,
  MenuItem,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  Typography,
  CardContent,
  DialogTitle,
  DialogActions,
  DialogContent,
  TableContainer,
} from '@mui/material';

import { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';

const mockCountSessions = [
  {
    id: 'CC-2026-001',
    warehouseId: 1,
    warehouseName: 'Main Warehouse - Dhaka',
    countType: 'ABC Cycle Count',
    scheduledDate: '2026-03-26',
    status: 'In Progress',
    progress: 58,
    itemsPlanned: 24,
    itemsCounted: 14,
    variances: 3,
    owner: 'Store Supervisor',
  },
  {
    id: 'CC-2026-002',
    warehouseId: 2,
    warehouseName: "Regional Office - Cox's Bazar",
    countType: 'Expiry Review',
    scheduledDate: '2026-03-28',
    status: 'Scheduled',
    progress: 0,
    itemsPlanned: 18,
    itemsCounted: 0,
    variances: 0,
    owner: 'Field Warehouse Lead',
  },
  {
    id: 'CC-2026-003',
    warehouseId: 1,
    warehouseName: 'Main Warehouse - Dhaka',
    countType: 'High Value Audit',
    scheduledDate: '2026-03-18',
    status: 'Completed',
    progress: 100,
    itemsPlanned: 12,
    itemsCounted: 12,
    variances: 1,
    owner: 'Internal Audit',
  },
];

const mockCountLines = {
  'CC-2026-001': [
    {
      id: 1,
      itemCode: 'MED-001',
      itemName: 'First Aid Kit',
      systemQty: 240,
      countedQty: 236,
      variance: -4,
      location: 'A-01-03',
    },
    {
      id: 2,
      itemCode: 'WAT-002',
      itemName: 'Water Purification Tablets',
      systemQty: 500,
      countedQty: 500,
      variance: 0,
      location: 'B-03-01',
    },
    {
      id: 3,
      itemCode: 'LOG-011',
      itemName: 'Tarpaulin Roll',
      systemQty: 80,
      countedQty: 82,
      variance: 2,
      location: 'C-02-04',
    },
  ],
  'CC-2026-002': [
    {
      id: 1,
      itemCode: 'NUT-101',
      itemName: 'Nutrition Pack',
      systemQty: 120,
      countedQty: null,
      variance: null,
      location: 'TEMP-01',
    },
    {
      id: 2,
      itemCode: 'HYG-210',
      itemName: 'Hygiene Kit',
      systemQty: 95,
      countedQty: null,
      variance: null,
      location: 'TEMP-02',
    },
  ],
  'CC-2026-003': [
    {
      id: 1,
      itemCode: 'IT-500',
      itemName: 'Barcode Scanner',
      systemQty: 12,
      countedQty: 12,
      variance: 0,
      location: 'SEC-VAULT',
    },
    {
      id: 2,
      itemCode: 'MED-450',
      itemName: 'Portable Cooler',
      systemQty: 6,
      countedQty: 5,
      variance: -1,
      location: 'COOL-02',
    },
  ],
};

const countTypeOptions = [
  'ABC Cycle Count',
  'High Value Audit',
  'Expiry Review',
  'Full Physical Count',
];

export default function CycleCountingMain() {
  const theme = useTheme();
  const EP = endpoints.storeInventory;

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [newSession, setNewSession] = useState({
    warehouseId: '',
    countType: 'ABC Cycle Count',
    scheduledDate: '',
    scope: 'A Items',
  });

  const { data: rawProducts } = useGetRequest(EP.products);
  const { data: rawWarehouses } = useGetRequest(EP.warehouses);
  const { data: rawMoves } = useGetRequest(EP.stock_moves);

  const products = Array.isArray(rawProducts) ? rawProducts : rawProducts?.results || [];
  const warehouses = Array.isArray(rawWarehouses) ? rawWarehouses : rawWarehouses?.results || [];
  const stockMoves = Array.isArray(rawMoves) ? rawMoves : rawMoves?.results || [];

  const sessions = mockCountSessions;
  const usingMock = true;

  const filteredSessions = useMemo(
    () =>
      sessions.filter((session) => {
        const matchesSearch =
          !searchTerm ||
          [session.id, session.warehouseName, session.countType, session.owner]
            .join(' ')
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || session.status === statusFilter;
        const matchesWarehouse =
          warehouseFilter === 'all' || String(session.warehouseId) === warehouseFilter;
        return matchesSearch && matchesStatus && matchesWarehouse;
      }),
    [sessions, searchTerm, statusFilter, warehouseFilter]
  );

  const stats = {
    total: sessions.length,
    open: sessions.filter((item) => item.status === 'In Progress' || item.status === 'Scheduled')
      .length,
    completed: sessions.filter((item) => item.status === 'Completed').length,
    variances: sessions.reduce((sum, item) => sum + Number(item.variances || 0), 0),
  };

  const reviewLines = selectedSession ? mockCountLines[selectedSession.id] || [] : [];

  const suggestedItems = useMemo(
    () =>
      products.slice(0, 5).map((item, index) => ({
        id: item.id || index,
        name: item.item_name || item.name || 'Unnamed Item',
        code: item.item_code || item.code || `ITEM-${index + 1}`,
        stock: item.current_stock || item.on_hand || 0,
      })),
    [products]
  );

  const statusColor = (status) => {
    switch (status) {
      case 'Completed':
        return {
          bgcolor: alpha(theme.palette.success.main, 0.12),
          color: theme.palette.success.dark,
        };
      case 'In Progress':
        return {
          bgcolor: alpha(theme.palette.warning.main, 0.15),
          color: theme.palette.warning.dark,
        };
      default:
        return { bgcolor: alpha(theme.palette.info.main, 0.12), color: theme.palette.info.dark };
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', md: 'center' }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Cycle Counting
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Plan recurring stock counts, review variances, and improve warehouse accuracy without
            full shutdown counts.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:add-circle-bold" />}
          onClick={() => setCreateDialogOpen(true)}
        >
          New Count Session
        </Button>
      </Stack>

      {usingMock && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Showing mock cycle count sessions. Products and warehouses use live API data when
          available.
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {[
          {
            title: 'Total Sessions',
            value: stats.total,
            icon: 'solar:clipboard-list-bold-duotone',
            color: theme.palette.primary.main,
          },
          {
            title: 'Open Counts',
            value: stats.open,
            icon: 'solar:clock-circle-bold-duotone',
            color: theme.palette.warning.main,
          },
          {
            title: 'Completed',
            value: stats.completed,
            icon: 'solar:check-circle-bold-duotone',
            color: theme.palette.success.main,
          },
          {
            title: 'Variance Flags',
            value: stats.variances,
            icon: 'solar:danger-triangle-bold-duotone',
            color: theme.palette.error.main,
          },
        ].map((item) => (
          <Grid key={item.title} item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: 2,
                    display: 'grid',
                    placeItems: 'center',
                    bgcolor: alpha(item.color, 0.12),
                    color: item.color,
                  }}
                >
                  <Iconify icon={item.icon} width={26} />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {item.title}
                  </Typography>
                  <Typography variant="h5" fontWeight={700}>
                    {item.value}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="Search count sessions"
                  placeholder="Session, warehouse, owner"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
                <TextField
                  select
                  size="small"
                  label="Status"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  sx={{ minWidth: 160 }}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="Scheduled">Scheduled</MenuItem>
                  <MenuItem value="In Progress">In Progress</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
                </TextField>
                <TextField
                  select
                  size="small"
                  label="Warehouse"
                  value={warehouseFilter}
                  onChange={(event) => setWarehouseFilter(event.target.value)}
                  sx={{ minWidth: 200 }}
                >
                  <MenuItem value="all">All Warehouses</MenuItem>
                  {warehouses.map((warehouse, index) => (
                    <MenuItem key={warehouse.id || index} value={String(warehouse.id || '')}>
                      {warehouse.name || warehouse.warehouse_name || `Warehouse ${index + 1}`}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Session</TableCell>
                    <TableCell>Warehouse</TableCell>
                    <TableCell>Count Type</TableCell>
                    <TableCell>Scheduled</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Progress</TableCell>
                    <TableCell align="right">Variances</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredSessions.map((session) => (
                    <TableRow key={session.id} hover>
                      <TableCell>
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          sx={{ fontFamily: 'monospace' }}
                        >
                          {session.id}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Owner: {session.owner}
                        </Typography>
                      </TableCell>
                      <TableCell>{session.warehouseName}</TableCell>
                      <TableCell>{session.countType}</TableCell>
                      <TableCell>{new Date(session.scheduledDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Box
                          sx={{
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 99,
                            display: 'inline-flex',
                            alignItems: 'center',
                            ...statusColor(session.status),
                          }}
                        >
                          <Typography variant="caption" fontWeight={700}>
                            {session.status}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={600}>
                          {session.itemsCounted}/{session.itemsPlanned}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {session.progress}% complete
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{session.variances}</TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => setSelectedSession(session)}
                        >
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Odoo-Style Count Controls
              </Typography>
              <Stack spacing={1.5}>
                {[
                  'Recurring ABC-based count planning',
                  'Warehouse-scoped count sessions',
                  'Variance visibility before adjustment posting',
                  'Review queue for approval-driven inventory accuracy',
                ].map((item) => (
                  <Stack key={item} direction="row" spacing={1.25} alignItems="flex-start">
                    <Iconify
                      icon="solar:check-circle-bold"
                      width={18}
                      sx={{ color: 'success.main', mt: 0.25 }}
                    />
                    <Typography variant="body2">{item}</Typography>
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Suggested Count Items
              </Typography>
              <Stack spacing={1.5}>
                {suggestedItems.map((item) => (
                  <Box
                    key={item.id}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                    }}
                  >
                    <Typography variant="body2" fontWeight={700}>
                      {item.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.code} · On hand: {item.stock}
                    </Typography>
                  </Box>
                ))}
                {!suggestedItems.length && (
                  <Typography variant="body2" color="text.secondary">
                    Product recommendations will appear when the products API returns items.
                  </Typography>
                )}
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                Stock move records loaded: {stockMoves.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>New Cycle Count Session</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              select
              fullWidth
              label="Warehouse"
              value={newSession.warehouseId}
              onChange={(event) =>
                setNewSession((prev) => ({ ...prev, warehouseId: event.target.value }))
              }
            >
              {warehouses.map((warehouse, index) => (
                <MenuItem key={warehouse.id || index} value={warehouse.id || ''}>
                  {warehouse.name || warehouse.warehouse_name || `Warehouse ${index + 1}`}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              fullWidth
              label="Count Type"
              value={newSession.countType}
              onChange={(event) =>
                setNewSession((prev) => ({ ...prev, countType: event.target.value }))
              }
            >
              {countTypeOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              type="date"
              label="Scheduled Date"
              InputLabelProps={{ shrink: true }}
              value={newSession.scheduledDate}
              onChange={(event) =>
                setNewSession((prev) => ({ ...prev, scheduledDate: event.target.value }))
              }
            />
            <TextField
              fullWidth
              label="Scope"
              value={newSession.scope}
              onChange={(event) =>
                setNewSession((prev) => ({ ...prev, scope: event.target.value }))
              }
              placeholder="A Items, cold chain items, expiry candidates"
            />
            <Alert severity="info">
              Count session creation currently uses frontend mock workflow because no dedicated
              cycle count endpoint exists yet.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setCreateDialogOpen(false)}>
            Save Draft
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!selectedSession}
        onClose={() => setSelectedSession(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{selectedSession?.id} Review</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Alert severity="warning">
              Review count variances before converting them into stock adjustments or approval
              actions.
            </Alert>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Item</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell align="right">System Qty</TableCell>
                    <TableCell align="right">Counted Qty</TableCell>
                    <TableCell align="right">Variance</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reviewLines.map((line) => (
                    <TableRow key={line.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700}>
                          {line.itemName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {line.itemCode}
                        </Typography>
                      </TableCell>
                      <TableCell>{line.location}</TableCell>
                      <TableCell align="right">{line.systemQty}</TableCell>
                      <TableCell align="right">{line.countedQty ?? 'Pending'}</TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          color={
                            line.variance === null
                              ? 'text.secondary'
                              : line.variance === 0
                                ? 'success.main'
                                : 'error.main'
                          }
                        >
                          {line.variance === null ? 'Pending' : line.variance}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedSession(null)}>Close</Button>
          <Button variant="contained" onClick={() => setSelectedSession(null)}>
            Mark Reviewed
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
