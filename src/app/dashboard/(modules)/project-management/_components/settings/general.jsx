'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

import {
  Box,
  Card,
  Grid,
  Button,
  Switch,
  Avatar,
  Divider,
  MenuItem,
  TextField,
  Typography,
  CardContent,
  CircularProgress,
} from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

const EP = endpoints.pm;

export function SettingsGeneral() {
  const { data: rawWorkspaces, loading } = useGetRequest(EP.workspaces);
  const WORKSPACES = Array.isArray(rawWorkspaces) ? rawWorkspaces : rawWorkspaces?.results || [];
  const workspace = WORKSPACES[0]; // Primary workspace

  const [settings, setSettings] = useState({
    workspace_name: '',
    description: '',
    timezone: 'Asia/Dhaka',
    language: 'en',
    date_format: 'DD/MM/YYYY',
    start_of_week: 'sunday',
    notifications_email: true,
    notifications_push: true,
    notifications_digest: 'daily',
    task_id_prefix: 'LDR',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (workspace) {
      setSettings((prev) => ({
        ...prev,
        workspace_name: workspace.name || '',
        description: workspace.description || '',
      }));
    }
  }, [workspace]);

  const update = (key, value) => setSettings({ ...settings, [key]: value });

  const handleSave = async () => {
    if (!workspace) {
      toast.error('No workspace found');
      return;
    }
    setSaving(true);
    try {
      await axiosInstance.patch(EP.workspace_by_id(workspace.id), {
        name: settings.workspace_name,
        description: settings.description,
      });
      mutate(EP.workspaces);
      toast.success('Settings saved successfully!');
    } catch (err) {
      toast.error(err?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>
        General Settings
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            Workspace
          </Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 2 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ width: 80, height: 80, bgcolor: '#3b82f6', fontSize: 32 }}>L</Avatar>
                <Button size="small">Change Logo</Button>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 10 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Workspace Name"
                    value={settings.workspace_name}
                    onChange={(e) => update('workspace_name', e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Task ID Prefix"
                    value={settings.task_id_prefix}
                    onChange={(e) => update('task_id_prefix', e.target.value)}
                    helperText="Tasks will be numbered as LDR-001, LDR-002..."
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Description"
                    value={settings.description}
                    onChange={(e) => update('description', e.target.value)}
                    multiline
                    rows={2}
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            Regional
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                select
                fullWidth
                label="Timezone"
                value={settings.timezone}
                onChange={(e) => update('timezone', e.target.value)}
              >
                <MenuItem value="Asia/Dhaka">Asia/Dhaka (UTC+6)</MenuItem>
                <MenuItem value="UTC">UTC</MenuItem>
                <MenuItem value="America/New_York">America/New York (UTC-5)</MenuItem>
                <MenuItem value="Europe/London">Europe/London (UTC+0)</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                select
                fullWidth
                label="Date Format"
                value={settings.date_format}
                onChange={(e) => update('date_format', e.target.value)}
              >
                <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                select
                fullWidth
                label="Start of Week"
                value={settings.start_of_week}
                onChange={(e) => update('start_of_week', e.target.value)}
              >
                <MenuItem value="sunday">Sunday</MenuItem>
                <MenuItem value="monday">Monday</MenuItem>
                <MenuItem value="saturday">Saturday</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            Notifications
          </Typography>
          {[
            {
              key: 'notifications_email',
              label: 'Email Notifications',
              desc: 'Receive task updates via email',
            },
            {
              key: 'notifications_push',
              label: 'Push Notifications',
              desc: 'Browser and mobile push notifications',
            },
          ].map((item) => (
            <Box
              key={item.key}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                py: 1.5,
              }}
            >
              <Box>
                <Typography variant="body1" fontWeight={500}>
                  {item.label}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {item.desc}
                </Typography>
              </Box>
              <Switch
                checked={settings[item.key]}
                onChange={(e) => update(item.key, e.target.checked)}
              />
            </Box>
          ))}
          <Divider sx={{ my: 1 }} />
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5 }}
          >
            <Box>
              <Typography variant="body1" fontWeight={500}>
                Email Digest
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Summary of activity
              </Typography>
            </Box>
            <TextField
              select
              size="small"
              value={settings.notifications_digest}
              onChange={(e) => update('notifications_digest', e.target.value)}
              sx={{ width: 140 }}
            >
              <MenuItem value="off">Off</MenuItem>
              <MenuItem value="daily">Daily</MenuItem>
              <MenuItem value="weekly">Weekly</MenuItem>
            </TextField>
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
        <Button
          variant="outlined"
          onClick={() =>
            workspace &&
            setSettings((prev) => ({
              ...prev,
              workspace_name: workspace.name || '',
              description: workspace.description || '',
            }))
          }
        >
          Reset
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </Box>
    </Box>
  );
}
