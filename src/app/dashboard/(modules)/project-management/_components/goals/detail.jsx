'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useState } from 'react';
import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';

import {
  Box,
  Card,
  Grid,
  Chip,
  Button,
  Dialog,
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

export function GoalDetail({ id }) {
  const router = useRouter();
  const { data: rawGoals } = useGetRequest(EP.goals);
  const { data: rawUsers } = useGetRequest('/api/employees/');

  const GOALS = Array.isArray(rawGoals) ? rawGoals : rawGoals?.results || [];
  const USERS = Array.isArray(rawUsers) ? rawUsers : rawUsers?.results || [];

  const getUserById = (uid) => USERS.find((u) => u.id === uid);

  const goal = GOALS.find((g) => g.id === Number(id));

  const [saving, setSaving] = useState(false);

  // --- Edit Goal Dialog ---
  const [editGoalOpen, setEditGoalOpen] = useState(false);
  const [editGoalForm, setEditGoalForm] = useState({
    name: '',
    description: '',
    target_date: '',
    status: 'on_track',
  });
  const setEG = (f) => (e) => setEditGoalForm({ ...editGoalForm, [f]: e.target.value });

  const openEditGoal = () => {
    setEditGoalForm({
      name: goal.name || '',
      description: goal.description || '',
      target_date: goal.end_date?.slice(0, 10) || '',
      status: goal.status || 'on_track',
    });
    setEditGoalOpen(true);
  };
  const handleEditGoal = async () => {
    setSaving(true);
    try {
      await axiosInstance.patch(EP.goal_by_id(goal.id), {
        name: editGoalForm.name,
        description: editGoalForm.description,
        end_date: editGoalForm.target_date || null,
        status: editGoalForm.status,
      });
      toast.success('Goal updated');
      mutate(EP.goals);
      setEditGoalOpen(false);
    } catch (err) {
      toast.error(err?.message || 'Failed to update goal');
    } finally {
      setSaving(false);
    }
  };

  // --- Delete Goal Dialog ---
  const [deleteGoalOpen, setDeleteGoalOpen] = useState(false);
  const handleDeleteGoal = async () => {
    setSaving(true);
    try {
      await axiosInstance.delete(EP.goal_by_id(goal.id));
      toast.success('Goal deleted');
      mutate(EP.goals);
      router.push(paths.dashboard.projectManagement.goals.root);
    } catch (err) {
      toast.error(err?.message || 'Failed to delete goal');
    } finally {
      setSaving(false);
    }
  };

  // --- Create KR Dialog ---
  const [createKROpen, setCreateKROpen] = useState(false);
  const [createKRForm, setCreateKRForm] = useState({
    name: '',
    target_value: '',
    current_value: '0',
    unit: '',
  });
  const setCKR = (f) => (e) => setCreateKRForm({ ...createKRForm, [f]: e.target.value });

  const handleCreateKR = async () => {
    if (!createKRForm.name) {
      toast.error('Key result name is required');
      return;
    }
    setSaving(true);
    try {
      await axiosInstance.post(EP.key_results, {
        goal: goal.id,
        name: createKRForm.name,
        target: createKRForm.target_value || 0,
        current: createKRForm.current_value || 0,
        unit: createKRForm.unit,
      });
      toast.success('Key result created');
      mutate(EP.goals);
      setCreateKROpen(false);
      setCreateKRForm({ name: '', target_value: '', current_value: '0', unit: '' });
    } catch (err) {
      toast.error(err?.message || 'Failed to create key result');
    } finally {
      setSaving(false);
    }
  };

  // --- Edit KR Dialog ---
  const [editKROpen, setEditKROpen] = useState(false);
  const [editKRForm, setEditKRForm] = useState({
    name: '',
    target_value: '',
    current_value: '',
    unit: '',
  });
  const [editKRId, setEditKRId] = useState(null);
  const setEKR = (f) => (e) => setEditKRForm({ ...editKRForm, [f]: e.target.value });

  const openEditKR = (kr) => {
    setEditKRId(kr.id);
    setEditKRForm({
      name: kr.name || '',
      target_value: kr.target || '',
      current_value: kr.current || '',
      unit: kr.unit || '',
    });
    setEditKROpen(true);
  };
  const handleEditKR = async () => {
    setSaving(true);
    try {
      await axiosInstance.patch(EP.key_result_by_id(editKRId), {
        name: editKRForm.name,
        target: editKRForm.target_value || 0,
        current: editKRForm.current_value || 0,
        unit: editKRForm.unit,
      });
      toast.success('Key result updated');
      mutate(EP.goals);
      setEditKROpen(false);
    } catch (err) {
      toast.error(err?.message || 'Failed to update key result');
    } finally {
      setSaving(false);
    }
  };

  // --- Delete KR Dialog ---
  const [deleteKROpen, setDeleteKROpen] = useState(false);
  const [deleteKRId, setDeleteKRId] = useState(null);
  const [deleteKRName, setDeleteKRName] = useState('');

  const openDeleteKR = (kr) => {
    setDeleteKRId(kr.id);
    setDeleteKRName(kr.name);
    setDeleteKROpen(true);
  };
  const handleDeleteKR = async () => {
    setSaving(true);
    try {
      await axiosInstance.delete(EP.key_result_by_id(deleteKRId));
      toast.success('Key result deleted');
      mutate(EP.goals);
      setDeleteKROpen(false);
    } catch (err) {
      toast.error(err?.message || 'Failed to delete key result');
    } finally {
      setSaving(false);
    }
  };

  // --- Update KR Progress ---
  const handleUpdateKRProgress = async (kr) => {
    const val = prompt(`Update progress for "${kr.name}" (current: ${kr.current}):`, kr.current);
    if (val === null) return;
    try {
      await axiosInstance.post(EP.key_result_update_progress(kr.id), {
        current_value: Number(val),
      });
      toast.success('Progress updated');
      mutate(EP.goals);
    } catch (err) {
      toast.error(err?.message || 'Failed to update progress');
    }
  };

  if (!goal) return <Typography color="error">Goal not found.</Typography>;

  const progress = Math.round((goal.current_value / goal.target_value) * 100);
  const owner = getUserById(goal.owner_id);
  const color = STATUS_COLORS[goal.status] || '#6b7280';

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Typography variant="h4" fontWeight={700}>
            {goal.name}
          </Typography>
          <Chip
            label={STATUS_LABELS[goal.status]}
            size="small"
            sx={{ bgcolor: `${color}15`, color, fontWeight: 700 }}
          />
          <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<Icon icon="solar:pen-bold" width={16} />}
              onClick={openEditGoal}
            >
              Edit
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={<Icon icon="solar:trash-bin-trash-bold" width={16} />}
              onClick={() => setDeleteGoalOpen(true)}
            >
              Delete
            </Button>
          </Box>
        </Box>
        <Typography variant="body1" color="text.secondary">
          {goal.description}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Overall Progress
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    {goal.current_value} / {goal.target_value}
                  </Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {progress}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(progress, 100)}
                  sx={{ height: 12, borderRadius: 6 }}
                />
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Typography variant="h6">Key Results</Typography>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<Icon icon="solar:add-circle-bold" width={16} />}
                  onClick={() => {
                    setCreateKRForm({ name: '', target_value: '', current_value: '0', unit: '' });
                    setCreateKROpen(true);
                  }}
                >
                  Add Key Result
                </Button>
              </Box>
              {(goal.key_results || []).map((kr) => {
                const krProgress = Math.round((kr.current / kr.target) * 100);
                return (
                  <Card key={kr.id} variant="outlined" sx={{ p: 2, mb: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography fontWeight={600}>{kr.name}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography fontWeight={700}>{krProgress}%</Typography>
                        <IconButton
                          size="small"
                          title="Update Progress"
                          onClick={() => handleUpdateKRProgress(kr)}
                        >
                          <Icon icon="solar:refresh-bold" width={16} />
                        </IconButton>
                        <IconButton size="small" onClick={() => openEditKR(kr)}>
                          <Icon icon="solar:pen-bold" width={16} />
                        </IconButton>
                        <IconButton size="small" onClick={() => openDeleteKR(kr)}>
                          <Icon icon="solar:trash-bin-trash-bold" width={16} color="#ef4444" />
                        </IconButton>
                      </Box>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(krProgress, 100)}
                      sx={{ height: 8, borderRadius: 4, mb: 0.5 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {kr.current} / {kr.target}
                      {kr.unit ? ` ${kr.unit}` : ''}
                    </Typography>
                  </Card>
                );
              })}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>
                Details
              </Typography>
              {[
                ['Type', goal.goal_type],
                ['Owner', owner?.name],
                ['Start', new Date(goal.start_date).toLocaleDateString()],
                ['End', new Date(goal.end_date).toLocaleDateString()],
                ['Target', `${goal.target_value} (${goal.target_type})`],
              ].map(([label, value]) => (
                <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {label}
                  </Typography>
                  <Typography variant="body2" fontWeight={600} sx={{ textTransform: 'capitalize' }}>
                    {value}
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ===== Edit Goal Dialog ===== */}
      <Dialog open={editGoalOpen} onClose={() => setEditGoalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Goal</DialogTitle>
        <DialogContent
          sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}
        >
          <TextField fullWidth label="Name" value={editGoalForm.name} onChange={setEG('name')} />
          <TextField
            fullWidth
            label="Description"
            multiline
            rows={3}
            value={editGoalForm.description}
            onChange={setEG('description')}
          />
          <TextField
            fullWidth
            type="date"
            label="Target Date"
            value={editGoalForm.target_date}
            onChange={setEG('target_date')}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            select
            label="Status"
            value={editGoalForm.status}
            onChange={setEG('status')}
          >
            <MenuItem value="on_track">On Track</MenuItem>
            <MenuItem value="at_risk">At Risk</MenuItem>
            <MenuItem value="behind">Behind</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditGoalOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditGoal} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== Delete Goal Dialog ===== */}
      <Dialog
        open={deleteGoalOpen}
        onClose={() => setDeleteGoalOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Goal</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{goal.name}</strong>? This action cannot be
            undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteGoalOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteGoal} disabled={saving}>
            {saving ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== Create KR Dialog ===== */}
      <Dialog open={createKROpen} onClose={() => setCreateKROpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Key Result</DialogTitle>
        <DialogContent
          sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}
        >
          <TextField fullWidth label="Name" value={createKRForm.name} onChange={setCKR('name')} />
          <TextField
            fullWidth
            type="number"
            label="Target Value"
            value={createKRForm.target_value}
            onChange={setCKR('target_value')}
          />
          <TextField
            fullWidth
            type="number"
            label="Current Value"
            value={createKRForm.current_value}
            onChange={setCKR('current_value')}
          />
          <TextField
            fullWidth
            label="Unit"
            value={createKRForm.unit}
            onChange={setCKR('unit')}
            placeholder="e.g. %, users, tasks"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateKROpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateKR} disabled={saving}>
            {saving ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== Edit KR Dialog ===== */}
      <Dialog open={editKROpen} onClose={() => setEditKROpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Key Result</DialogTitle>
        <DialogContent
          sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}
        >
          <TextField fullWidth label="Name" value={editKRForm.name} onChange={setEKR('name')} />
          <TextField
            fullWidth
            type="number"
            label="Target Value"
            value={editKRForm.target_value}
            onChange={setEKR('target_value')}
          />
          <TextField
            fullWidth
            type="number"
            label="Current Value"
            value={editKRForm.current_value}
            onChange={setEKR('current_value')}
          />
          <TextField
            fullWidth
            label="Unit"
            value={editKRForm.unit}
            onChange={setEKR('unit')}
            placeholder="e.g. %, users, tasks"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditKROpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditKR} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== Delete KR Dialog ===== */}
      <Dialog open={deleteKROpen} onClose={() => setDeleteKROpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Key Result</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{deleteKRName}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteKROpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteKR} disabled={saving}>
            {saving ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
