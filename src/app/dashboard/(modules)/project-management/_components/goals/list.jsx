'use client';

import Link from 'next/link';
import { mutate } from 'swr';
import { toast } from 'sonner';
import { useState } from 'react';
import { Icon } from '@iconify/react';

import {
  Box,
  Card,
  Grid,
  Chip,
  Avatar,
  Button,
  Dialog,
  Divider,
  MenuItem,
  TextField,
  Typography,
  IconButton,
  CardContent,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

const EP = endpoints.pm;

const STATUS_COLORS = {
  on_track: '#22c55e',
  at_risk: '#f59e0b',
  behind: '#ef4444',
  completed: '#3b82f6',
};
const STATUS_LABELS = {
  on_track: 'On Track',
  at_risk: 'At Risk',
  behind: 'Behind',
  completed: 'Completed',
};

const EMPTY_FORM = { name: '', description: '', target_date: '', status: 'on_track' };

export function GoalsList() {
  const { data: rawGoals } = useGetRequest(EP.goals);
  const { data: rawUsers } = useGetRequest('/api/employees/');

  const GOALS = Array.isArray(rawGoals) ? rawGoals : rawGoals?.results || [];
  const USERS = Array.isArray(rawUsers) ? rawUsers : rawUsers?.results || [];

  const getUserById = (id) => USERS.find((u) => u.id === id);

  // --- Create Dialog ---
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const setC = (f) => (e) => setCreateForm({ ...createForm, [f]: e.target.value });

  const handleCreate = async () => {
    if (!createForm.name) {
      toast.error('Goal name is required');
      return;
    }
    setSaving(true);
    try {
      await axiosInstance.post(EP.goals, {
        name: createForm.name,
        description: createForm.description,
        end_date: createForm.target_date || null,
        status: createForm.status,
      });
      toast.success('Goal created');
      mutate(EP.goals);
      setCreateOpen(false);
      setCreateForm(EMPTY_FORM);
    } catch (err) {
      toast.error(err?.message || 'Failed to create goal');
    } finally {
      setSaving(false);
    }
  };

  // --- Edit Dialog ---
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const setE = (f) => (e) => setEditForm({ ...editForm, [f]: e.target.value });

  const openEdit = (goal, e) => {
    e.preventDefault();
    e.stopPropagation();
    setEditId(goal.id);
    setEditForm({
      name: goal.name || '',
      description: goal.description || '',
      target_date: goal.end_date?.slice(0, 10) || '',
      status: goal.status || 'on_track',
    });
    setEditOpen(true);
  };
  const handleEdit = async () => {
    setSaving(true);
    try {
      await axiosInstance.patch(EP.goal_by_id(editId), {
        name: editForm.name,
        description: editForm.description,
        end_date: editForm.target_date || null,
        status: editForm.status,
      });
      toast.success('Goal updated');
      mutate(EP.goals);
      setEditOpen(false);
    } catch (err) {
      toast.error(err?.message || 'Failed to update goal');
    } finally {
      setSaving(false);
    }
  };

  // --- Delete Dialog ---
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteName, setDeleteName] = useState('');

  const openDelete = (goal, e) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteId(goal.id);
    setDeleteName(goal.name);
    setDeleteOpen(true);
  };
  const handleDelete = async () => {
    setSaving(true);
    try {
      await axiosInstance.delete(EP.goal_by_id(deleteId));
      toast.success('Goal deleted');
      mutate(EP.goals);
      setDeleteOpen(false);
    } catch (err) {
      toast.error(err?.message || 'Failed to delete goal');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Goals & OKRs
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track objectives and key results
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Icon icon="solar:add-circle-bold" />}
          onClick={() => {
            setCreateForm(EMPTY_FORM);
            setCreateOpen(true);
          }}
        >
          New Goal
        </Button>
      </Box>

      <Grid container spacing={3}>
        {GOALS.map((goal) => {
          const progress = Math.round((goal.current_value / goal.target_value) * 100);
          const owner = getUserById(goal.owner_id);
          const color = STATUS_COLORS[goal.status] || '#6b7280';
          return (
            <Grid key={goal.id} size={{ xs: 12, md: 6 }}>
              <Card
                sx={{
                  height: '100%',
                  cursor: 'pointer',
                  '&:hover': { boxShadow: 6 },
                  transition: 'box-shadow 0.2s',
                }}
                component={Link}
                href={paths.dashboard.projectManagement.goals.detail(goal.id)}
                style={{ textDecoration: 'none' }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Chip
                      label={goal.goal_type === 'company' ? 'Company' : 'Team'}
                      size="small"
                      sx={{ height: 20, fontSize: 10, textTransform: 'capitalize' }}
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Chip
                        label={STATUS_LABELS[goal.status]}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: 10,
                          bgcolor: `${color}15`,
                          color,
                          fontWeight: 700,
                        }}
                      />
                      <IconButton size="small" onClick={(e) => openEdit(goal, e)}>
                        <Icon icon="solar:pen-bold" width={16} />
                      </IconButton>
                      <IconButton size="small" onClick={(e) => openDelete(goal, e)}>
                        <Icon icon="solar:trash-bin-trash-bold" width={16} color="#ef4444" />
                      </IconButton>
                    </Box>
                  </Box>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
                    {goal.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {goal.description}
                  </Typography>

                  {/* Progress */}
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        Progress
                      </Typography>
                      <Typography variant="caption" fontWeight={700}>
                        {progress}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(progress, 100)}
                      sx={{ height: 8, borderRadius: 4 }}
                      color={
                        goal.status === 'at_risk'
                          ? 'warning'
                          : goal.status === 'behind'
                            ? 'error'
                            : 'primary'
                      }
                    />
                  </Box>

                  {/* Key Results */}
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    color="text.secondary"
                    sx={{ mb: 1, display: 'block' }}
                  >
                    Key Results ({goal.key_results?.length || 0})
                  </Typography>
                  {(goal.key_results || []).slice(0, 3).map((kr) => {
                    const krProgress = Math.round((kr.current / kr.target) * 100);
                    return (
                      <Box
                        key={kr.id}
                        sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.8 }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="caption">{kr.name}</Typography>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(krProgress, 100)}
                            sx={{ height: 4, borderRadius: 2 }}
                          />
                        </Box>
                        <Typography
                          variant="caption"
                          fontWeight={600}
                          sx={{ minWidth: 35, textAlign: 'right' }}
                        >
                          {krProgress}%
                        </Typography>
                      </Box>
                    );
                  })}

                  <Divider sx={{ my: 1.5 }} />
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Avatar sx={{ width: 22, height: 22, fontSize: 9 }}>
                        {owner?.name?.charAt(0)}
                      </Avatar>
                      <Typography variant="caption" color="text.secondary">
                        {owner?.name}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(goal.end_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* ===== Create Goal Dialog ===== */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Goal</DialogTitle>
        <DialogContent
          sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}
        >
          <TextField fullWidth label="Name" value={createForm.name} onChange={setC('name')} />
          <TextField
            fullWidth
            label="Description"
            multiline
            rows={3}
            value={createForm.description}
            onChange={setC('description')}
          />
          <TextField
            fullWidth
            type="date"
            label="Target Date"
            value={createForm.target_date}
            onChange={setC('target_date')}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            select
            label="Status"
            value={createForm.status}
            onChange={setC('status')}
          >
            <MenuItem value="on_track">On Track</MenuItem>
            <MenuItem value="at_risk">At Risk</MenuItem>
            <MenuItem value="behind">Behind</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={saving}>
            {saving ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== Edit Goal Dialog ===== */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Goal</DialogTitle>
        <DialogContent
          sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}
        >
          <TextField fullWidth label="Name" value={editForm.name} onChange={setE('name')} />
          <TextField
            fullWidth
            label="Description"
            multiline
            rows={3}
            value={editForm.description}
            onChange={setE('description')}
          />
          <TextField
            fullWidth
            type="date"
            label="Target Date"
            value={editForm.target_date}
            onChange={setE('target_date')}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            select
            label="Status"
            value={editForm.status}
            onChange={setE('status')}
          >
            <MenuItem value="on_track">On Track</MenuItem>
            <MenuItem value="at_risk">At Risk</MenuItem>
            <MenuItem value="behind">Behind</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEdit} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== Delete Goal Dialog ===== */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Goal</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{deleteName}</strong>? This action cannot be
            undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={saving}>
            {saving ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
