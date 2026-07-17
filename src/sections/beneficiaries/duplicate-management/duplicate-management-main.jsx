'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useState, useCallback } from 'react';

import {
  Box,
  Card,
  Grid,
  Chip,
  Stack,
  Table,
  Button,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  IconButton,
  Typography,
  TableContainer,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import axios, { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

import SummaryCard from '../../_components/summary-card';

const EP = endpoints.beneficiaries;

export default function DuplicateManagementMain() {
  const { data: rawData, loading } = useGetRequest(EP.duplicate_records);
  const { data: summary } = useGetRequest(`${EP.duplicate_records}summary/`);

  // console.log('Duplicate Records:', summary);
  const DUPLICATE_RECORDS = Array.isArray(rawData) ? rawData : rawData?.results || [];

  const confirmDelete = useBoolean();
  const [deleteId, setDeleteId] = useState(null);

  const pending = DUPLICATE_RECORDS.filter((r) => r.status === 'Pending Review').length;
  const merged = DUPLICATE_RECORDS.filter((r) => r.status === 'Merged').length;

  const handleMerge = useCallback(async (id) => {
    try {
      await axios.patch(`${EP.duplicate_records}${id}/`, { status: 'Merged' });
      mutate(EP.duplicate_records);
      toast.success('Records merged successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to merge records');
    }
  }, []);

  const handleDismiss = useCallback(async (id) => {
    try {
      await axios.patch(`${EP.duplicate_records}${id}/`, { status: 'Not Duplicate' });
      mutate(EP.duplicate_records);
      toast.info('Duplicate dismissed');
    } catch (err) {
      toast.error(err.message || 'Failed to dismiss');
    }
  }, []);

  const handleOpenDelete = useCallback(
    (id) => {
      setDeleteId(id);
      confirmDelete.onTrue();
    },
    [confirmDelete]
  );

  const handleDeleteConfirm = useCallback(async () => {
    try {
      await axios.delete(`${EP.duplicate_records}${deleteId}/`);
      mutate(EP.duplicate_records);
      toast.success('Record deleted');
      confirmDelete.onFalse();
    } catch (err) {
      toast.error(err.message || 'Failed to delete');
    }
  }, [deleteId, confirmDelete]);

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" sx={{ mb: 0.5 }}>
            Duplicate Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Detect and resolve duplicate beneficiary records
          </Typography>
        </Box>
      </Stack>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SummaryCard
            title="Total Detected"
            value={summary?.total_detected || '0'}
            icon="solar:copy-bold"
            color="warning"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SummaryCard
            title="Pending Review"
            value={summary?.pending_review || 0}
            icon="solar:clock-circle-bold"
            color="error"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SummaryCard
            title="Merged"
            value={summary?.merged || 0}
            icon="solar:check-circle-bold"
            color="success"
          />
        </Grid>
      </Grid>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Record A</TableCell>
                <TableCell>Record B</TableCell>
                <TableCell>Name A</TableCell>
                <TableCell>Name B</TableCell>
                <TableCell>NID Match</TableCell>
                <TableCell>Similarity</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {DUPLICATE_RECORDS.map((row) => (
                <TableRow key={row.id}>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 13 }}>
                    {row.record_a}
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 13 }}>
                    {row.record_b}
                  </TableCell>
                  <TableCell>{row.name_a}</TableCell>
                  <TableCell>{row.name_b}</TableCell>
                  <TableCell>
                    <Iconify
                      icon={row.nid_match ? 'solar:check-circle-bold' : 'solar:close-circle-bold'}
                      color={row.nid_match ? 'success.main' : 'error.main'}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={`${row.similarity_score}%`}
                      size="small"
                      color={row.similarity_score >= 90 ? 'error' : 'warning'}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={row.status}
                      size="small"
                      color={
                        row.status === 'Merged'
                          ? 'success'
                          : row.status === 'Dismissed'
                            ? 'default'
                            : 'warning'
                      }
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={0.5} justifyContent="center">
                      {row.status === 'Pending Review' && (
                        <>
                          <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            onClick={() => handleMerge(row.id)}
                          >
                            Merge
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="inherit"
                            onClick={() => handleDismiss(row.id)}
                          >
                            Dismiss
                          </Button>
                        </>
                      )}
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleOpenDelete(row.id)}
                      >
                        <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <ConfirmDialog
        open={confirmDelete.value}
        onClose={confirmDelete.onFalse}
        title="Delete Record"
        content="Are you sure you want to delete this duplicate record?"
        action={
          <Button variant="contained" color="error" onClick={handleDeleteConfirm}>
            Delete
          </Button>
        }
      />
    </Box>
  );
}
