'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useState } from 'react';
import { Icon } from '@iconify/react';

import {
  Box,
  Card,
  Grid,
  Chip,
  Table,
  Button,
  Switch,
  Dialog,
  Divider,
  MenuItem,
  TableRow,
  TextField,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  IconButton,
  CardContent,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
} from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

const EP = endpoints.pm;

const INTEGRATIONS = [
  {
    id: 1,
    name: 'GitHub',
    description: 'Link commits and PRs to tasks',
    icon: 'mdi:github',
    color: '#24292e',
    connected: true,
    category: 'Development',
  },
  {
    id: 2,
    name: 'Slack',
    description: 'Get notifications in Slack channels',
    icon: 'mdi:slack',
    color: '#4a154b',
    connected: true,
    category: 'Communication',
  },
  {
    id: 3,
    name: 'Google Drive',
    description: 'Attach files from Google Drive',
    icon: 'mdi:google-drive',
    color: '#4285f4',
    connected: false,
    category: 'Storage',
  },
  {
    id: 4,
    name: 'Google Calendar',
    description: 'Sync tasks with Google Calendar',
    icon: 'mdi:google',
    color: '#4285f4',
    connected: true,
    category: 'Calendar',
  },
  {
    id: 5,
    name: 'Microsoft Teams',
    description: 'Channel notifications and task creation',
    icon: 'mdi:microsoft-teams',
    color: '#6264a7',
    connected: false,
    category: 'Communication',
  },
  {
    id: 6,
    name: 'Figma',
    description: 'Embed Figma designs in tasks',
    icon: 'solar:figma-bold',
    color: '#f24e1e',
    connected: false,
    category: 'Design',
  },
  {
    id: 7,
    name: 'GitLab',
    description: 'Track issues and merge requests',
    icon: 'mdi:gitlab',
    color: '#fc6d26',
    connected: false,
    category: 'Development',
  },
  {
    id: 8,
    name: 'Zapier',
    description: 'Connect 5000+ apps',
    icon: 'simple-icons:zapier',
    color: '#ff4a00',
    connected: false,
    category: 'Automation',
  },
  {
    id: 9,
    name: 'Dropbox',
    description: 'Attach files from Dropbox',
    icon: 'mdi:dropbox',
    color: '#0061ff',
    connected: false,
    category: 'Storage',
  },
  {
    id: 10,
    name: 'Outlook Calendar',
    description: 'Sync tasks with Outlook',
    icon: 'mdi:microsoft-outlook',
    color: '#0078d4',
    connected: false,
    category: 'Calendar',
  },
];

const TRIGGER_TYPES = [
  { value: 'task_created', label: 'Task Created' },
  { value: 'task_updated', label: 'Task Updated' },
  { value: 'task_completed', label: 'Task Completed' },
  { value: 'task_assigned', label: 'Task Assigned' },
  { value: 'comment_added', label: 'Comment Added' },
  { value: 'status_changed', label: 'Status Changed' },
];

const ACTION_TYPES = [
  { value: 'send_notification', label: 'Send Notification' },
  { value: 'update_field', label: 'Update Field' },
  { value: 'assign_user', label: 'Assign User' },
  { value: 'move_status', label: 'Move Status' },
  { value: 'webhook', label: 'Webhook' },
];

export function SettingsIntegrations() {
  const { data: rawAutomations } = useGetRequest(EP.automations);
  const AUTOMATIONS = Array.isArray(rawAutomations)
    ? rawAutomations
    : rawAutomations?.results || [];

  // Automation CRUD state
  const [createOpen, setCreateOpen] = useState(false);
  const [newAutomation, setNewAutomation] = useState({
    name: '',
    trigger_type: '',
    action_type: '',
    description: '',
    is_active: true,
  });
  const [creating, setCreating] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editAutomation, setEditAutomation] = useState({
    id: null,
    name: '',
    trigger_type: '',
    action_type: '',
    description: '',
    is_active: true,
  });
  const [editing, setEditing] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const connected = INTEGRATIONS.filter((i) => i.connected);
  const available = INTEGRATIONS.filter((i) => !i.connected);
  const categories = [...new Set(INTEGRATIONS.map((i) => i.category))];

  const handleCreateAutomation = async () => {
    if (!newAutomation.name) {
      toast.error('Automation name is required');
      return;
    }
    setCreating(true);
    try {
      await axiosInstance.post(EP.automations, newAutomation);
      toast.success(`Automation "${newAutomation.name}" created`);
      setCreateOpen(false);
      setNewAutomation({
        name: '',
        trigger_type: '',
        action_type: '',
        description: '',
        is_active: true,
      });
      mutate(EP.automations);
    } catch (err) {
      toast.error(err?.message || 'Failed to create automation');
    } finally {
      setCreating(false);
    }
  };

  const handleEditAutomation = async () => {
    if (!editAutomation.name) {
      toast.error('Automation name is required');
      return;
    }
    setEditing(true);
    try {
      await axiosInstance.patch(EP.automation_by_id(editAutomation.id), {
        name: editAutomation.name,
        trigger_type: editAutomation.trigger_type,
        action_type: editAutomation.action_type,
        description: editAutomation.description,
        is_active: editAutomation.is_active,
      });
      toast.success(`Automation "${editAutomation.name}" updated`);
      setEditOpen(false);
      mutate(EP.automations);
    } catch (err) {
      toast.error(err?.message || 'Failed to update automation');
    } finally {
      setEditing(false);
    }
  };

  const handleDeleteAutomation = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await axiosInstance.delete(EP.automation_by_id(deleteTarget.id));
      toast.success(`Automation "${deleteTarget.name}" deleted`);
      setDeleteOpen(false);
      setDeleteTarget(null);
      mutate(EP.automations);
    } catch (err) {
      toast.error(err?.message || 'Failed to delete automation');
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleAutomation = async (automation) => {
    try {
      await axiosInstance.patch(EP.automation_by_id(automation.id), {
        is_active: !automation.is_active,
      });
      toast.success(`Automation ${!automation.is_active ? 'enabled' : 'disabled'}`);
      mutate(EP.automations);
    } catch (err) {
      toast.error(err?.message || 'Failed to toggle automation');
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>
          Integrations & Automations
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Connect your favorite tools and automate workflows
        </Typography>
      </Box>

      {/* Connected */}
      {connected.length > 0 && (
        <>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            Connected ({connected.length})
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {connected.map((i) => (
              <Grid key={i.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card sx={{ borderLeft: `4px solid ${i.color}` }}>
                  <CardContent>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                      }}
                    >
                      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                        <Icon icon={i.icon} width={32} style={{ color: i.color }} />
                        <Box>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {i.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {i.description}
                          </Typography>
                        </Box>
                      </Box>
                      <Switch checked />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                      <Chip label="Connected" color="success" size="small" />
                      <Button size="small">Configure</Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {/* Available */}
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        Available Integrations
      </Typography>
      {categories.map((cat) => {
        const items = available.filter((i) => i.category === cat);
        if (items.length === 0) return null;
        return (
          <Box key={cat} sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              {cat}
            </Typography>
            <Grid container spacing={3}>
              {items.map((i) => (
                <Grid key={i.id} size={{ xs: 12, sm: 6, md: 4 }}>
                  <Card sx={{ '&:hover': { boxShadow: 4 }, transition: 'box-shadow 0.2s' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 2 }}>
                        <Icon icon={i.icon} width={32} style={{ color: i.color }} />
                        <Box>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {i.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {i.description}
                          </Typography>
                        </Box>
                      </Box>
                      <Button variant="outlined" fullWidth>
                        Connect
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        );
      })}

      {/* Automations Section */}
      <Divider sx={{ my: 4 }} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h6" fontWeight={600}>
            Automations
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Automate repetitive tasks with trigger-action rules
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Icon icon="solar:bolt-bold" />}
          onClick={() => setCreateOpen(true)}
        >
          Create Automation
        </Button>
      </Box>

      {AUTOMATIONS.length > 0 ? (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Trigger</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell align="center">Active</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {AUTOMATIONS.map((a) => (
                  <TableRow key={a.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {a.name}
                        </Typography>
                        {a.description && (
                          <Typography variant="caption" color="text.secondary">
                            {a.description}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={
                          TRIGGER_TYPES.find((t) => t.value === a.trigger_type)?.label ||
                          a.trigger_type ||
                          '—'
                        }
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={
                          ACTION_TYPES.find((t) => t.value === a.action_type)?.label ||
                          a.action_type ||
                          '—'
                        }
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Switch
                        checked={!!a.is_active}
                        size="small"
                        onChange={() => handleToggleAutomation(a)}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        title="Edit"
                        onClick={() => {
                          setEditAutomation({
                            id: a.id,
                            name: a.name,
                            trigger_type: a.trigger_type || '',
                            action_type: a.action_type || '',
                            description: a.description || '',
                            is_active: !!a.is_active,
                          });
                          setEditOpen(true);
                        }}
                      >
                        <Icon icon="solar:pen-bold" width={18} />
                      </IconButton>
                      <IconButton
                        size="small"
                        title="Delete"
                        color="error"
                        onClick={() => {
                          setDeleteTarget(a);
                          setDeleteOpen(true);
                        }}
                      >
                        <Icon icon="solar:trash-bin-trash-bold" width={18} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      ) : (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Icon icon="solar:bolt-bold" width={48} style={{ color: '#9ca3af' }} />
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
              No automations configured yet. Create one to automate your workflow.
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Create Automation Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Automation</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label="Name"
            fullWidth
            value={newAutomation.name}
            onChange={(e) => setNewAutomation({ ...newAutomation, name: e.target.value })}
          />
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={2}
            value={newAutomation.description}
            onChange={(e) => setNewAutomation({ ...newAutomation, description: e.target.value })}
          />
          <TextField
            select
            label="Trigger"
            fullWidth
            value={newAutomation.trigger_type}
            onChange={(e) => setNewAutomation({ ...newAutomation, trigger_type: e.target.value })}
          >
            {TRIGGER_TYPES.map((t) => (
              <MenuItem key={t.value} value={t.value}>
                {t.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Action"
            fullWidth
            value={newAutomation.action_type}
            onChange={(e) => setNewAutomation({ ...newAutomation, action_type: e.target.value })}
          >
            {ACTION_TYPES.map((t) => (
              <MenuItem key={t.value} value={t.value}>
                {t.label}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateAutomation} disabled={creating}>
            {creating ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Automation Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Automation</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label="Name"
            fullWidth
            value={editAutomation.name}
            onChange={(e) => setEditAutomation({ ...editAutomation, name: e.target.value })}
          />
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={2}
            value={editAutomation.description}
            onChange={(e) => setEditAutomation({ ...editAutomation, description: e.target.value })}
          />
          <TextField
            select
            label="Trigger"
            fullWidth
            value={editAutomation.trigger_type}
            onChange={(e) => setEditAutomation({ ...editAutomation, trigger_type: e.target.value })}
          >
            {TRIGGER_TYPES.map((t) => (
              <MenuItem key={t.value} value={t.value}>
                {t.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Action"
            fullWidth
            value={editAutomation.action_type}
            onChange={(e) => setEditAutomation({ ...editAutomation, action_type: e.target.value })}
          >
            {ACTION_TYPES.map((t) => (
              <MenuItem key={t.value} value={t.value}>
                {t.label}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditAutomation} disabled={editing}>
            {editing ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Automation Confirmation */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Automation</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the automation <strong>{deleteTarget?.name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteAutomation}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
