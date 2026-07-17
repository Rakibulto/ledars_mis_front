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
  Switch,
  Button,
  Avatar,
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
} from '@mui/material';

import { paths } from 'src/routes/paths';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

const EP = endpoints.pm;

const TRIGGER_TYPES = [
  { value: 'status_change', label: 'Status Change' },
  { value: 'task_created', label: 'Task Created' },
  { value: 'task_assigned', label: 'Task Assigned' },
  { value: 'due_date_passed', label: 'Due Date Passed' },
  { value: 'priority_change', label: 'Priority Change' },
];

const ACTION_TYPES = [
  { value: 'change_status', label: 'Change Status' },
  { value: 'assign_user', label: 'Assign User' },
  { value: 'add_tag', label: 'Add Tag' },
  { value: 'send_notification', label: 'Send Notification' },
  { value: 'move_to_list', label: 'Move to List' },
];

export function AutomationsList() {
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    trigger_type: 'status_change',
    action_type: 'change_status',
    is_active: true,
  });
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ id: null, name: '', description: '' });
  const [deleteId, setDeleteId] = useState(null);

  const { data: rawAutomations } = useGetRequest(EP.automations);
  const AUTOMATIONS = Array.isArray(rawAutomations)
    ? rawAutomations
    : rawAutomations?.results || [];

  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    setSaving(true);
    try {
      await axiosInstance.post(EP.automations, {
        name: createForm.name,
        description: createForm.description,
        trigger_type: createForm.trigger_type,
        action_type: createForm.action_type,
        is_active: createForm.is_active,
      });
      mutate(EP.automations);
      toast.success('Automation created');
      setCreateOpen(false);
      setCreateForm({
        name: '',
        description: '',
        trigger_type: 'status_change',
        action_type: 'change_status',
        is_active: true,
      });
    } catch (err) {
      toast.error(err?.message || 'Failed to create automation');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    setSaving(true);
    try {
      await axiosInstance.patch(EP.automation_by_id(editForm.id), {
        name: editForm.name,
        description: editForm.description,
      });
      mutate(EP.automations);
      toast.success('Automation updated');
      setEditOpen(false);
    } catch (err) {
      toast.error(err?.message || 'Failed to update automation');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await axiosInstance.delete(EP.automation_by_id(deleteId));
      mutate(EP.automations);
      toast.success('Automation deleted');
      setDeleteId(null);
    } catch (err) {
      toast.error(err?.message || 'Failed to delete automation');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      await axiosInstance.post(EP.automation_toggle(id));
      mutate(EP.automations);
      toast.success('Automation toggled');
    } catch {
      toast.error('Failed to toggle automation');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Automations
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Automate your workflows
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<Icon icon="solar:add-circle-bold" />}
            onClick={() => setCreateOpen(true)}
          >
            Quick Create
          </Button>
          <Button
            variant="outlined"
            startIcon={<Icon icon="solar:add-circle-bold" />}
            component={Link}
            href={paths.dashboard.projectManagement.automations.create}
          >
            Advanced
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {AUTOMATIONS.map((auto) => (
          <Grid key={auto.id} size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    mb: 2,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar
                      sx={{
                        bgcolor: auto.is_active ? '#3b82f620' : '#9ca3af20',
                        color: auto.is_active ? '#3b82f6' : '#9ca3af',
                        width: 40,
                        height: 40,
                      }}
                    >
                      <Icon icon="solar:bolt-circle-bold-duotone" width={22} />
                    </Avatar>
                    <Box>
                      <Typography fontWeight={700}>{auto.name}</Typography>
                      <Chip
                        label={auto.is_active ? 'Active' : 'Inactive'}
                        size="small"
                        color={auto.is_active ? 'success' : 'default'}
                        sx={{ height: 20, fontSize: 10, mt: 0.3 }}
                      />
                    </Box>
                  </Box>
                  <Switch
                    checked={auto.is_active}
                    size="small"
                    onChange={() => handleToggle(auto.id)}
                  />
                </Box>

                <Box sx={{ mb: 1.5 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>
                    TRIGGER
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.3 }}>
                    <Icon icon="solar:play-circle-linear" width={16} style={{ color: '#3b82f6' }} />
                    <Typography variant="body2">{auto.trigger}</Typography>
                  </Box>
                </Box>

                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                  ACTIONS
                </Typography>
                {auto.actions.map((action, i) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.3 }}>
                    <Icon icon="solar:arrow-right-linear" width={14} style={{ color: '#22c55e' }} />
                    <Typography variant="body2">{action}</Typography>
                  </Box>
                ))}

                <Divider sx={{ my: 1.5 }} />
                <Box
                  sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <Typography variant="caption" color="text.secondary">
                    <Icon
                      icon="solar:refresh-linear"
                      width={12}
                      style={{ verticalAlign: 'middle' }}
                    />{' '}
                    {auto.runs} runs
                  </Typography>
                  <Box>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setEditForm({
                          id: auto.id,
                          name: auto.name,
                          description: auto.description || '',
                        });
                        setEditOpen(true);
                      }}
                    >
                      <Icon icon="solar:pen-bold" width={16} />
                    </IconButton>
                    <IconButton size="small" onClick={() => setDeleteId(auto.id)}>
                      <Icon icon="solar:trash-bin-trash-bold" width={16} color="#ef4444" />
                    </IconButton>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Automation</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label="Name"
            fullWidth
            value={createForm.name}
            onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
          />
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={2}
            value={createForm.description}
            onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
          />
          <TextField
            select
            label="Trigger Type"
            fullWidth
            value={createForm.trigger_type}
            onChange={(e) => setCreateForm({ ...createForm, trigger_type: e.target.value })}
          >
            {TRIGGER_TYPES.map((t) => (
              <MenuItem key={t.value} value={t.value}>
                {t.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Action Type"
            fullWidth
            value={createForm.action_type}
            onChange={(e) => setCreateForm({ ...createForm, action_type: e.target.value })}
          >
            {ACTION_TYPES.map((a) => (
              <MenuItem key={a.value} value={a.value}>
                {a.label}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={saving}>
            {saving ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Automation</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label="Name"
            fullWidth
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
          />
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={2}
            value={editForm.description}
            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEdit} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Automation</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this automation? This action cannot be undone.
          </Typography>
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
