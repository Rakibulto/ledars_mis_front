'use client';

import { mutate } from 'swr';
import { useState, useCallback } from 'react';

import {
  Box,
  Card,
  Chip,
  Grid,
  Stack,
  Table,
  Switch,
  Button,
  Dialog,
  Select,
  TableRow,
  MenuItem,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  Typography,
  InputLabel,
  DialogTitle,
  FormControl,
  DialogContent,
  DialogActions,
  TableContainer,
} from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import SummaryCard from '../../_components/summary-card';

const EP = endpoints.beneficiaries;

export default function BeneficiarySettingsMain() {
  const { data: rawData, loading } = useGetRequest(EP.beneficiary_settings);
  const settings = Array.isArray(rawData) ? rawData : rawData?.results || [];

  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const handleToggle = useCallback(async (setting) => {
    try {
      const newValue = setting.value === 'true' ? 'false' : 'true';
      await axiosInstance.patch(`${EP.beneficiary_settings}${setting.id}/`, { value: newValue });
      mutate(EP.beneficiary_settings);
      toast.success('Setting updated');
    } catch (err) {
      toast.error(err.message || 'Failed to update setting');
    }
  }, []);

  const handleEdit = (setting) => {
    setEditItem({ ...setting });
    setEditOpen(true);
  };

  const handleSave = useCallback(async () => {
    try {
      await axiosInstance.patch(`${EP.beneficiary_settings}${editItem.id}/`, {
        value: editItem.value,
      });
      mutate(EP.beneficiary_settings);
      setEditOpen(false);
      setEditItem(null);
      toast.success('Setting saved successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to save setting');
    }
  }, [editItem]);

  const categoryColor = (cat) => {
    const map = {
      General: 'primary',
      Registration: 'info',
      'Case Management': 'warning',
      Protection: 'error',
      Reporting: 'success',
    };
    return map[cat] || 'default';
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography variant="h4" sx={{ mb: 0.5 }}>
        Beneficiary Settings
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Configure beneficiary module preferences and defaults
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Total Settings"
            value={settings.length}
            icon="solar:settings-bold"
            color="primary"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Categories"
            value={[...new Set(settings.map((s) => s.category))].length}
            icon="solar:folder-bold"
            color="info"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Boolean Settings"
            value={settings.filter((s) => s.type === 'boolean').length}
            icon="solar:toggle-on-bold"
            color="success"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Text/Number Settings"
            value={settings.filter((s) => s.type !== 'boolean').length}
            icon="solar:text-field-bold"
            color="warning"
          />
        </Grid>
      </Grid>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Setting</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="center">Value</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {settings.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Typography fontWeight="bold">{row.key}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={row.category} size="small" color={categoryColor(row.category)} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {row.description}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    {row.type === 'boolean' ? (
                      <Switch checked={row.value === 'true'} onChange={() => handleToggle(row)} />
                    ) : (
                      <Chip label={row.value} size="small" variant="outlined" />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {row.type !== 'boolean' && (
                      <Button
                        size="small"
                        startIcon={<Iconify icon="solar:pen-bold" />}
                        onClick={() => handleEdit(row)}
                      >
                        Edit
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Setting</DialogTitle>
        <DialogContent>
          {editItem && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField label="Key" value={editItem.key} disabled fullWidth />
              <TextField label="Description" value={editItem.description} disabled fullWidth />
              {editItem.type === 'select' ? (
                <FormControl fullWidth>
                  <InputLabel>Value</InputLabel>
                  <Select
                    value={editItem.value}
                    label="Value"
                    onChange={(e) => setEditItem({ ...editItem, value: e.target.value })}
                  >
                    {(editItem.options || [editItem.value]).map((opt) => (
                      <MenuItem key={opt} value={opt}>
                        {opt}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : (
                <TextField
                  label="Value"
                  value={editItem.value}
                  type={editItem.type === 'number' ? 'number' : 'text'}
                  onChange={(e) => setEditItem({ ...editItem, value: e.target.value })}
                  fullWidth
                />
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
