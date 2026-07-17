'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useState } from 'react';
import { Icon } from '@iconify/react';

import {
  Box,
  Card,
  Chip,
  Table,
  Avatar,
  Button,
  Dialog,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  Typography,
  IconButton,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
} from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

const EP = endpoints.pm;

export function TimeTimesheets() {
  const { data: rawEntries } = useGetRequest(EP.time_entries);
  const TIME_ENTRIES = Array.isArray(rawEntries) ? rawEntries : rawEntries?.results || [];
  const { data: rawUsers } = useGetRequest('/api/employees/');
  const USERS = Array.isArray(rawUsers) ? rawUsers : rawUsers?.results || [];

  // CRUD state
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleEdit = async () => {
    setSaving(true);
    try {
      await axiosInstance.patch(EP.time_entry_by_id(editId), editForm);
      mutate(EP.time_entries);
      toast.success('Entry updated');
      setEditId(null);
    } catch (err) {
      toast.error(err?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };
  const handleDelete = async () => {
    setSaving(true);
    try {
      await axiosInstance.delete(EP.time_entry_by_id(deleteId));
      mutate(EP.time_entries);
      toast.success('Entry deleted');
      setDeleteId(null);
    } catch (err) {
      toast.error(err?.message || 'Delete failed');
    } finally {
      setSaving(false);
    }
  };

  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const userHours = USERS.slice(0, 6).map((user) => {
    const entries = TIME_ENTRIES.filter((e) => (e.user_id || e.user) === user.id);
    const total = entries.reduce((s, e) => s + (e.duration || 0), 0);
    const daily = DAYS.map((_, i) => {
      const dayEntries = entries.filter((_entry, idx) => idx % 7 === i);
      return dayEntries.reduce((s, e) => s + e.duration, 0);
    });
    return { ...user, total, daily };
  });

  const weekTotal = userHours.reduce((s, u) => s + u.total, 0);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Timesheets
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Weekly time overview by team member
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<Icon icon="solar:alt-arrow-left-bold" width={16} />}
          >
            Prev
          </Button>
          <Chip label="This Week" color="primary" size="small" />
          <Button
            size="small"
            variant="outlined"
            endIcon={<Icon icon="solar:alt-arrow-right-bold" width={16} />}
          >
            Next
          </Button>
        </Box>
      </Box>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Team Member</TableCell>
                {DAYS.map((d) => (
                  <TableCell key={d} align="center" sx={{ fontWeight: 700 }}>
                    {d}
                  </TableCell>
                ))}
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  Total
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {userHours.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 28, height: 28, fontSize: 11 }}>
                        {user.name.charAt(0)}
                      </Avatar>
                      <Typography variant="body2" fontWeight={600}>
                        {user.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  {user.daily.map((h, i) => (
                    <TableCell key={i} align="center">
                      <Typography
                        variant="body2"
                        sx={{
                          color: h >= 8 ? 'success.main' : h > 0 ? 'text.primary' : 'text.disabled',
                        }}
                      >
                        {h > 0 ? `${h}h` : '—'}
                      </Typography>
                    </TableCell>
                  ))}
                  <TableCell align="center">
                    <Typography variant="body2" fontWeight={700}>
                      {user.total}h
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    {TIME_ENTRIES.filter((e) => (e.user_id || e.user) === user.id)
                      .slice(0, 1)
                      .map((entry) => (
                        <Box key={entry.id} sx={{ display: 'inline-flex' }}>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setEditId(entry.id);
                              setEditForm({
                                description: entry.description || '',
                                duration_minutes: entry.duration ? entry.duration * 60 : '',
                                date: entry.date || '',
                              });
                            }}
                          >
                            <Icon icon="solar:pen-bold" width={16} />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeleteId(entry.id)}
                          >
                            <Icon icon="solar:trash-bin-trash-bold" width={16} />
                          </IconButton>
                        </Box>
                      ))}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell>
                  <Typography variant="body2" fontWeight={700}>
                    Total
                  </Typography>
                </TableCell>
                {DAYS.map((_, i) => (
                  <TableCell key={i} align="center">
                    <Typography variant="body2" fontWeight={700}>
                      {userHours.reduce((s, u) => s + u.daily[i], 0)}h
                    </Typography>
                  </TableCell>
                ))}
                <TableCell align="center">
                  <Typography variant="body2" fontWeight={700} color="primary.main">
                    {weekTotal}h
                  </Typography>
                </TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editId} onClose={() => setEditId(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Time Entry</DialogTitle>
        <DialogContent
          sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}
        >
          <TextField
            label="Description"
            value={editForm.description || ''}
            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            fullWidth
            multiline
            rows={2}
          />
          <TextField
            label="Duration (minutes)"
            type="number"
            value={editForm.duration_minutes || ''}
            onChange={(e) => setEditForm({ ...editForm, duration_minutes: e.target.value })}
            fullWidth
          />
          <TextField
            label="Date"
            type="date"
            value={editForm.date || ''}
            onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditId(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleEdit} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle>Delete Time Entry</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this time entry?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={saving}>
            {saving ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
