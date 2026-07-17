'use client';

import { toast } from 'sonner';
import { useState } from 'react';
import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';

import {
  Box,
  Card,
  Grid,
  Button,
  Switch,
  Avatar,
  MenuItem,
  TextField,
  Typography,
  CardContent,
  FormControlLabel,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

const EP = endpoints.pm;

const COLORS = [
  '#3b82f6',
  '#22c55e',
  '#ef4444',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#6366f1',
];
const ICON_OPTIONS = [
  'solar:folder-with-files-bold-duotone',
  'solar:code-bold-duotone',
  'solar:users-group-rounded-bold-duotone',
  'solar:wallet-money-bold-duotone',
  'solar:monitor-bold-duotone',
  'solar:smartphone-bold-duotone',
  'solar:server-bold-duotone',
  'solar:chart-square-bold-duotone',
];

export function SpaceCreate() {
  const router = useRouter();
  const { data: rawWorkspaces } = useGetRequest(EP.workspaces);
  const WORKSPACES = Array.isArray(rawWorkspaces) ? rawWorkspaces : rawWorkspaces?.results || [];
  const [form, setForm] = useState({
    name: '',
    description: '',
    workspace_id: 1,
    color: '#3b82f6',
    icon: ICON_OPTIONS[0],
    is_private: false,
  });

  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.name) {
      toast.error('Space name is required');
      return;
    }
    setSaving(true);
    try {
      await axiosInstance.post(EP.spaces, {
        name: form.name,
        description: form.description,
        workspace: form.workspace_id,
        color: form.color,
        icon: form.icon,
        is_private: form.is_private,
      });
      toast.success(`Space "${form.name}" created successfully!`);
      router.push(paths.dashboard.projectManagement.spaces.root);
    } catch (err) {
      toast.error(err?.message || 'Failed to create space');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>
        Create Space
      </Typography>
      <Card>
        <CardContent>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Space Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                select
                label="Workspace"
                value={form.workspace_id}
                onChange={(e) => setForm({ ...form, workspace_id: e.target.value })}
              >
                {WORKSPACES.map((w) => (
                  <MenuItem key={w.id} value={w.id}>
                    {w.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Color
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {COLORS.map((c) => (
                  <Box
                    key={c}
                    onClick={() => setForm({ ...form, color: c })}
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      bgcolor: c,
                      cursor: 'pointer',
                      border: form.color === c ? '3px solid #1976d2' : '3px solid transparent',
                    }}
                  />
                ))}
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Icon
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {ICON_OPTIONS.map((ic) => (
                  <Avatar
                    key={ic}
                    onClick={() => setForm({ ...form, icon: ic })}
                    sx={{
                      width: 36,
                      height: 36,
                      cursor: 'pointer',
                      bgcolor: form.icon === ic ? `${form.color}20` : 'transparent',
                      color: form.icon === ic ? form.color : 'text.secondary',
                      border:
                        form.icon === ic ? `2px solid ${form.color}` : '2px solid transparent',
                    }}
                  >
                    <Icon icon={ic} width={20} />
                  </Avatar>
                ))}
              </Box>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.is_private}
                    onChange={(e) => setForm({ ...form, is_private: e.target.checked })}
                  />
                }
                label="Private Space (only invited members can access)"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={saving}
                  startIcon={<Icon icon="solar:check-circle-bold" />}
                >
                  {saving ? 'Creating...' : 'Create Space'}
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
