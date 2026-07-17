'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useState } from 'react';
import { Icon } from '@iconify/react';

import {
  Box,
  Tab,
  Card,
  Chip,
  Tabs,
  Table,
  Alert,
  Avatar,
  Button,
  Dialog,
  TableRow,
  MenuItem,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  Typography,
  IconButton,
  AvatarGroup,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
  InputAdornment,
} from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

const EP = endpoints.pm;

export function ListDetail({ id }) {
  const { data: rawLists } = useGetRequest(EP.lists);
  const { data: rawTasks } = useGetRequest(EP.tasks);
  const { data: rawStatuses } = useGetRequest(EP.statuses);
  const { data: rawSpaces } = useGetRequest(EP.spaces);
  const { data: rawUsers } = useGetRequest('/api/employees/');

  const LISTS = Array.isArray(rawLists) ? rawLists : rawLists?.results || [];
  const ALL_TASKS = Array.isArray(rawTasks) ? rawTasks : rawTasks?.results || [];
  const STATUSES = Array.isArray(rawStatuses) ? rawStatuses : rawStatuses?.results || [];
  const SPACES = Array.isArray(rawSpaces) ? rawSpaces : rawSpaces?.results || [];
  const USERS = Array.isArray(rawUsers) ? rawUsers : rawUsers?.results || [];

  const getUserById = (uid) => USERS.find((u) => u.id === uid);
  const getStatusById = (sid) => STATUSES.find((s) => s.id === sid);
  const getSpaceById = (sid) => SPACES.find((s) => s.id === sid);

  const list = LISTS.find((l) => l.id === Number(id));

  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState('');

  // Edit / Delete state
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!list) return <Alert severity="error">List not found.</Alert>;

  const space = getSpaceById(list.space_id || list.space);
  const tasks = ALL_TASKS.filter((t) => (t.list_id || t.list) === list.id);

  // Handlers
  const openEditDialog = () => {
    setEditForm({ name: list.name, space: list.space_id || list.space });
    setEditOpen(true);
  };
  const handleEdit = async () => {
    setSaving(true);
    try {
      await axiosInstance.patch(EP.list_by_id(list.id), editForm);
      mutate(EP.lists);
      toast.success('List updated');
      setEditOpen(false);
    } catch {
      toast.error('Update failed');
    } finally {
      setSaving(false);
    }
  };
  const handleDelete = async () => {
    setSaving(true);
    try {
      await axiosInstance.delete(EP.list_by_id(list.id));
      mutate(EP.lists);
      toast.success('List deleted');
      setDeleteOpen(false);
      window.history.back();
    } catch {
      toast.error('Delete failed');
    } finally {
      setSaving(false);
    }
  };

  const filtered = tasks.filter((t) => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase());
    if (tab === 0) return matchSearch;
    const sid = t.status_id || t.status;
    if (tab === 1) return matchSearch && (sid === 1 || sid === 2 || sid === 3);
    if (tab === 2) return matchSearch && sid === 4;
    return matchSearch;
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Chip
          label={space?.name}
          size="small"
          sx={{ bgcolor: `${space?.color}20`, color: space?.color }}
        />
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <Typography variant="h4" fontWeight={700} sx={{ flex: 1 }}>
          {list.name}
        </Typography>
        <IconButton onClick={openEditDialog}>
          <Icon icon="solar:pen-bold" width={20} />
        </IconButton>
        <IconButton color="error" onClick={() => setDeleteOpen(true)}>
          <Icon icon="solar:trash-bin-trash-bold" width={20} />
        </IconButton>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {tasks.length} tasks
      </Typography>

      <Card>
        <Box sx={{ px: 2, pt: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)}>
            <Tab label={`All (${tasks.length})`} />
            <Tab label={`Active (${tasks.filter((t) => (t.status_id || t.status) < 4).length})`} />
            <Tab label={`Done (${tasks.filter((t) => (t.status_id || t.status) === 4).length})`} />
          </Tabs>
          <Box sx={{ flex: 1 }} />
          <TextField
            size="small"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Icon icon="solar:magnifer-linear" width={18} />
                </InputAdornment>
              ),
            }}
            sx={{ width: 200 }}
          />
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Assignee(s)</TableCell>
                <TableCell>Due</TableCell>
                <TableCell align="center">Points</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((t) => {
                const st = getStatusById(t.status_id || t.status);
                return (
                  <TableRow key={t.id} hover sx={{ cursor: 'pointer' }}>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace" color="text.secondary">
                        {t.task_id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {t.title}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={st?.name}
                        size="small"
                        sx={{ bgcolor: `${st?.color}20`, color: st?.color, fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell sx={{ textTransform: 'capitalize' }}>{t.priority}</TableCell>
                    <TableCell>
                      <AvatarGroup max={3}>
                        {(t.assignees || []).map((uid) => {
                          const u = getUserById(uid);
                          return (
                            <Avatar
                              key={uid}
                              sx={{ width: 24, height: 24, fontSize: 10, bgcolor: '#3b82f6' }}
                            >
                              {u?.name?.charAt(0)}
                            </Avatar>
                          );
                        })}
                      </AvatarGroup>
                    </TableCell>
                    <TableCell>{t.due_date}</TableCell>
                    <TableCell align="center">
                      {t.story_points && (
                        <Chip label={t.story_points} size="small" variant="outlined" />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        {filtered.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="body2" color="text.secondary">
              No tasks found.
            </Typography>
          </Box>
        )}
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit List</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Name"
            fullWidth
            value={editForm.name || ''}
            onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
          />
          <TextField
            label="Space"
            select
            fullWidth
            value={editForm.space || ''}
            onChange={(e) => setEditForm((f) => ({ ...f, space: e.target.value }))}
          >
            {SPACES.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.name}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEdit} disabled={saving || !editForm.name}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>Delete List</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete &quot;{list.name}&quot;? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={saving}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
