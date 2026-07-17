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
  Button,
  Divider,
  MenuItem,
  TextField,
  Typography,
  IconButton,
  CardContent,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

const EP = endpoints.pm;

export function GoalCreate() {
  const router = useRouter();

  const { data: rawUsers } = useGetRequest('/api/employees/');
  const USERS = Array.isArray(rawUsers) ? rawUsers : rawUsers?.results || [];
  const [form, setForm] = useState({
    name: '',
    description: '',
    goal_type: 'team',
    target_type: 'number',
    target_value: '',
    owner_id: 1,
    start_date: '',
    end_date: '',
  });
  const [keyResults, setKeyResults] = useState([{ name: '', target: '' }]);

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  const addKeyResult = () => setKeyResults([...keyResults, { name: '', target: '' }]);
  const removeKeyResult = (i) => setKeyResults(keyResults.filter((_, idx) => idx !== i));
  const updateKR = (i, field, value) => {
    const updated = [...keyResults];
    updated[i][field] = value;
    setKeyResults(updated);
  };

  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.name) {
      toast.error('Goal name is required');
      return;
    }
    setSaving(true);
    try {
      const goalRes = await axiosInstance.post(EP.goals, {
        name: form.name,
        description: form.description,
        goal_type: form.goal_type,
        target_type: form.target_type,
        target_value: form.target_value || 0,
        current_value: 0,
        owner: form.owner_id,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        status: 'on_track',
      });
      // Create key results
      await Promise.all(
        keyResults
          .filter((k) => k.name)
          .map((kr) =>
            axiosInstance.post(EP.key_results, {
              goal: goalRes.data.id,
              name: kr.name,
              target: kr.target || 0,
              current: 0,
            })
          )
      );
      toast.success(`Goal "${form.name}" created successfully!`);
      mutate(EP.goals);
      router.push(paths.dashboard.projectManagement.goals.root);
    } catch (err) {
      toast.error(err?.message || 'Failed to create goal');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>
        Create Goal
      </Typography>
      <Card>
        <CardContent>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth label="Goal Name" value={form.name} onChange={set('name')} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={form.description}
                onChange={set('description')}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                select
                label="Goal Type"
                value={form.goal_type}
                onChange={set('goal_type')}
              >
                <MenuItem value="company">Company</MenuItem>
                <MenuItem value="team">Team</MenuItem>
                <MenuItem value="personal">Personal</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                select
                label="Target Type"
                value={form.target_type}
                onChange={set('target_type')}
              >
                <MenuItem value="number">Number</MenuItem>
                <MenuItem value="percentage">Percentage</MenuItem>
                <MenuItem value="task">Task Completion</MenuItem>
                <MenuItem value="currency">Currency</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                type="number"
                label="Target Value"
                value={form.target_value}
                onChange={set('target_value')}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                select
                label="Owner"
                value={form.owner_id}
                onChange={set('owner_id')}
              >
                {USERS.map((u) => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                type="date"
                label="Start Date"
                value={form.start_date}
                onChange={set('start_date')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                type="date"
                label="End Date"
                value={form.end_date}
                onChange={set('end_date')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Key Results */}
            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 1 }} />
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Typography variant="subtitle1" fontWeight={700}>
                  Key Results
                </Typography>
                <Button
                  size="small"
                  startIcon={<Icon icon="solar:add-circle-linear" />}
                  onClick={addKeyResult}
                >
                  Add Key Result
                </Button>
              </Box>
              {keyResults.map((kr, idx) => (
                <Box key={idx} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                  <TextField
                    fullWidth
                    size="small"
                    label={`Key Result ${idx + 1}`}
                    value={kr.name}
                    onChange={(e) => updateKR(idx, 'name', e.target.value)}
                  />
                  <TextField
                    size="small"
                    label="Target"
                    type="number"
                    sx={{ width: 120 }}
                    value={kr.target}
                    onChange={(e) => updateKR(idx, 'target', e.target.value)}
                  />
                  <IconButton
                    size="small"
                    onClick={() => removeKeyResult(idx)}
                    disabled={keyResults.length === 1}
                  >
                    <Icon icon="solar:trash-bin-trash-bold" width={18} />
                  </IconButton>
                </Box>
              ))}
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={saving}
                  startIcon={<Icon icon="solar:check-circle-bold" />}
                >
                  {saving ? 'Creating...' : 'Create Goal'}
                </Button>
                <Button variant="outlined" onClick={() => router.back()}>
                  Cancel
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}
