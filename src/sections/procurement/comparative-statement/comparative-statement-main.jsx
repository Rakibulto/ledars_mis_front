'use client';

/* eslint-disable perfectionist/sort-named-imports */
import { mutate } from 'swr';
import { toast } from 'sonner';
import { useState, useMemo } from 'react';

import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
  Stack,
  Button,
  Pagination,
  Divider,
} from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';
import MuiAutocomplete from 'src/components/hook-form/mui-autocomplete';

import SummaryCard from 'src/sections/_components/summary-card';

const EP = endpoints.procurement_management;

export function ComparativeStatementMain() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);
  const [expandedStatements, setExpandedStatements] = useState([]);
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  const { data, loading } = useGetRequest(EP.comparative_statements);
  const {
    data: summaryData,
    loading: summaryLoading,
    error: summaryError,
  } = useGetRequest(EP.comparative_statement_summary);

  const statements = useMemo(() => data?.results || data || [], [data]);

  const statusOptions = ['Draft', 'Pending Approval', 'Approved', 'Rejected'];

  const filteredData = useMemo(() => {
    let result = statements;

    if (searchQuery) {
      result = result.filter(
        (item) =>
          item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.rfqNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter) {
      result = result.filter((item) => item.status === statusFilter);
    }

    return result;
  }, [statements, searchQuery, statusFilter]);

  const paginatedData = useMemo(() => {
    const startIndex = (page - 1) * rowsPerPage;
    return filteredData.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredData, page]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const toggleStatementExpansion = (id) => {
    setExpandedStatements((prev) =>
      prev.includes(id) ? prev.filter((statementId) => statementId !== id) : [...prev, id]
    );
  };

  const getStatusColor = (status) => {
    const colors = {
      Draft: 'default',
      'Pending Approval': 'warning',
      Approved: 'success',
      Rejected: 'error',
    };
    return colors[status] || 'default';
  };

  const getApprovalStatusColor = (status) => {
    const colors = {
      Pending: 'warning',
      Approved: 'success',
      Rejected: 'error',
    };
    return colors[status] || 'default';
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 600 }}>
          Comparative Statement
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Compare supplier quotations and select the best offer
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Total Statements"
            value={summaryData?.total ?? statements.length}
            icon="solar:scale-bold-duotone"
            color="#2563eb"
            loading={summaryLoading}
            error={summaryError}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Pending Approval"
            value={
              summaryData?.pending ??
              statements.filter((s) => s.status === 'Pending Approval').length
            }
            icon="solar:clock-circle-bold-duotone"
            color="#eab308"
            loading={summaryLoading}
            error={summaryError}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Approved"
            value={
              summaryData?.approved ?? statements.filter((s) => s.status === 'Approved').length
            }
            icon="solar:check-circle-bold-duotone"
            color="#10b981"
            loading={summaryLoading}
            error={summaryError}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Rejected"
            value={
              summaryData?.rejected ?? statements.filter((s) => s.status === 'Rejected').length
            }
            icon="solar:close-circle-bold-duotone"
            color="#ef4444"
            loading={summaryLoading}
            error={summaryError}
          />
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <MuiAutocomplete
                freeSolo
                options={[]}
                value={searchQuery}
                onInputChange={(event, newValue) => setSearchQuery(newValue)}
                renderInput={(params) => (
                  <Box ref={params.InputProps.ref}>
                    <input
                      {...params.inputProps}
                      placeholder="Search by RFQ Number, ID, or Title..."
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none',
                      }}
                    />
                  </Box>
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <MuiAutocomplete
                options={statusOptions}
                value={statusFilter}
                onChange={(event, newValue) => setStatusFilter(newValue)}
                renderInput={(params) => (
                  <Box ref={params.InputProps.ref}>
                    <input
                      {...params.inputProps}
                      placeholder="Status"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none',
                      }}
                    />
                  </Box>
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Typography variant="body2" color="text.secondary">
                {filteredData.length} statement(s) found
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Statements List */}
      <Stack spacing={3}>
        {paginatedData.map((statement) => {
          const isExpanded = expandedStatements.includes(statement.id);
          const lowestAmount = Math.min(...statement.suppliers.map((s) => s.totalAmount));

          return (
            <Card
              key={statement.id}
              sx={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)', borderRadius: 3 }}
            >
              {/* Card Header */}
              <Box
                sx={{
                  bgcolor: 'grey.100',
                  px: 3,
                  py: 2,
                  borderBottom: '1px solid',
                  borderColor: 'grey.300',
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <IconButton
                      size="small"
                      onClick={() => toggleStatementExpansion(statement.id)}
                      sx={{ mr: 1 }}
                    >
                      <Iconify
                        icon={
                          isExpanded
                            ? 'solar:alt-arrow-up-bold-duotone'
                            : 'solar:alt-arrow-down-bold-duotone'
                        }
                        width={20}
                      />
                    </IconButton>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {statement.id} - {statement.title}
                    </Typography>
                    <Chip
                      label={statement.status}
                      color={getStatusColor(statement.status)}
                      size="small"
                      sx={{ fontWeight: 500 }}
                    />
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    RFQ: {statement.rfqNumber} • {new Date(statement.date).toLocaleDateString()}
                  </Typography>
                </Stack>
              </Box>

              {/* Collapsible Content */}
              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                <CardContent sx={{ p: 3 }}>
                  {/* Supplier Comparison Table */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                      Supplier Comparison
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'grey.50' }}>
                            <TableCell sx={{ fontWeight: 600 }}>Supplier</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600 }}>
                              Total Amount
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Delivery Time</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Payment Terms</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Warranty</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 600 }}>
                              Rating
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {statement.suppliers.map((supplier, index) => {
                            const isLowest = supplier.totalAmount === lowestAmount;
                            const isRecommended = supplier.name === statement.recommendedSupplier;

                            return (
                              <TableRow
                                key={index}
                                sx={{
                                  bgcolor: isRecommended ? 'success.lighter' : 'transparent',
                                  '&:hover': {
                                    bgcolor: isRecommended ? 'success.lighter' : 'grey.50',
                                  },
                                }}
                              >
                                <TableCell>
                                  <Stack direction="row" spacing={1} alignItems="center">
                                    <Typography variant="body2">{supplier.name}</Typography>
                                    {isRecommended && (
                                      <Chip
                                        label="Recommended"
                                        color="success"
                                        size="small"
                                        sx={{ height: 20, fontSize: '0.7rem' }}
                                      />
                                    )}
                                  </Stack>
                                </TableCell>
                                <TableCell align="right">
                                  <Stack
                                    direction="row"
                                    spacing={0.5}
                                    justifyContent="flex-end"
                                    alignItems="center"
                                  >
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        color: isLowest ? 'success.main' : 'text.primary',
                                        fontWeight: isLowest ? 600 : 400,
                                      }}
                                    >
                                      UGX {supplier.totalAmount.toLocaleString()}
                                    </Typography>
                                    {isLowest && (
                                      <Iconify
                                        icon="solar:arrow-down-bold-duotone"
                                        width={16}
                                        sx={{ color: 'success.main' }}
                                      />
                                    )}
                                  </Stack>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2" color="text.secondary">
                                    {supplier.deliveryTime}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2" color="text.secondary">
                                    {supplier.paymentTerms}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2" color="text.secondary">
                                    {supplier.warranty}
                                  </Typography>
                                </TableCell>
                                <TableCell align="center">
                                  <Stack
                                    direction="row"
                                    spacing={0.5}
                                    justifyContent="center"
                                    alignItems="center"
                                  >
                                    <Iconify
                                      icon="solar:star-bold"
                                      width={16}
                                      sx={{ color: 'warning.main' }}
                                    />
                                    <Typography variant="body2" color="text.secondary">
                                      {supplier.rating}/5
                                    </Typography>
                                  </Stack>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>

                  <Divider sx={{ my: 3 }} />

                  {/* Approval Workflow */}
                  <Box sx={{ bgcolor: 'grey.50', borderRadius: 2, p: 2 }}>
                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                      Approval Workflow
                    </Typography>
                    <Stack spacing={1.5}>
                      {statement.approvals.map((approval, index) => (
                        <Card
                          key={index}
                          sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'grey.200' }}
                        >
                          <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                            <Stack
                              direction="row"
                              justifyContent="space-between"
                              alignItems="center"
                            >
                              <Stack direction="row" spacing={1.5} alignItems="center">
                                <Iconify
                                  icon={
                                    approval.status === 'Approved'
                                      ? 'solar:check-circle-bold-duotone'
                                      : approval.status === 'Rejected'
                                        ? 'solar:close-circle-bold-duotone'
                                        : 'solar:clock-circle-bold-duotone'
                                  }
                                  width={20}
                                  sx={{
                                    color:
                                      approval.status === 'Approved'
                                        ? 'success.main'
                                        : approval.status === 'Rejected'
                                          ? 'error.main'
                                          : 'warning.main',
                                  }}
                                />
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {approval.level}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {approval.approver}
                                  </Typography>
                                </Box>
                              </Stack>
                              <Box sx={{ textAlign: 'right' }}>
                                <Chip
                                  label={approval.status}
                                  color={getApprovalStatusColor(approval.status)}
                                  size="small"
                                  sx={{ mb: 0.5 }}
                                />
                                {approval.date && (
                                  <Typography
                                    variant="caption"
                                    display="block"
                                    color="text.secondary"
                                  >
                                    {new Date(approval.date).toLocaleDateString()}
                                  </Typography>
                                )}
                              </Box>
                            </Stack>
                          </CardContent>
                        </Card>
                      ))}
                    </Stack>
                  </Box>

                  {/* Actions */}
                  {statement.status === 'Pending Approval' && (
                    <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<Iconify icon="solar:close-circle-bold-duotone" />}
                        onClick={async () => {
                          try {
                            await axiosInstance.patch(
                              `${EP.comparative_statements}${statement.id}/`,
                              { status: 'Rejected' }
                            );
                            mutate(EP.comparative_statements);
                            mutate(EP.comparative_statement_summary);
                            toast.success('Statement rejected');
                          } catch (err) {
                            toast.error(err.message || 'Failed to reject');
                          }
                        }}
                      >
                        Reject
                      </Button>
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<Iconify icon="solar:check-circle-bold-duotone" />}
                        onClick={async () => {
                          try {
                            await axiosInstance.patch(
                              `${EP.comparative_statements}${statement.id}/`,
                              { status: 'Approved' }
                            );
                            mutate(EP.comparative_statements);
                            mutate(EP.comparative_statement_summary);
                            toast.success('Statement approved');
                          } catch (err) {
                            toast.error(err.message || 'Failed to approve');
                          }
                        }}
                      >
                        Approve
                      </Button>
                    </Stack>
                  )}
                </CardContent>
              </Collapse>
            </Card>
          );
        })}
      </Stack>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            shape="rounded"
            showFirstButton
            showLastButton
          />
        </Box>
      )}
    </Box>
  );
}
