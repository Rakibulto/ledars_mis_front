'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useState } from 'react';

import {
  Box,
  Card,
  Table,
  Alert,
  Button,
  Rating,
  Dialog,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  Typography,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
  CircularProgress,
} from '@mui/material';

import { endpoints } from 'src/utils/axios';

import { useGetRequest, usePatchRequest } from 'src/actions/ledars-hook';

const EP = endpoints.procurement_management;

export function VendorEvaluation() {
  const [open, setOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [rating, setRating] = useState(0);
  const [remarks, setRemarks] = useState('');

  const { data: vendors, loading, error } = useGetRequest(EP.vendors);
  const list = Array.isArray(vendors) ? vendors : [];

  const { patchRequest } = usePatchRequest();

  const handleSubmit = async () => {
    try {
      await patchRequest(`${EP.vendors}${selectedVendor.id}/`, {
        rating,
        evaluation_remarks: remarks,
      });
      toast.success('Evaluation saved');
      setOpen(false);
      setRating(0);
      setRemarks('');
      mutate(EP.vendors);
    } catch {
      toast.error('Failed');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">Failed to load vendors.</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Vendor Evaluation
      </Typography>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Vendor</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Current Rating</TableCell>
                <TableCell align="center">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {list.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>
                    <Typography fontWeight={600}>{v.company_name || v.name}</Typography>
                  </TableCell>
                  <TableCell>{v.category_name || '\u2014'}</TableCell>
                  <TableCell>
                    <Rating value={v.rating || 0} readOnly size="small" />
                  </TableCell>
                  <TableCell align="center">
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        setSelectedVendor(v);
                        setRating(v.rating || 0);
                        setOpen(true);
                      }}
                    >
                      Evaluate
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {list.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="body2" color="text.secondary">
              No vendors found.
            </Typography>
          </Box>
        )}
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Evaluate {selectedVendor?.company_name || selectedVendor?.name}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1, mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Rating
            </Typography>
            <Rating value={rating} onChange={(_, v) => setRating(v)} />
          </Box>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Remarks"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
