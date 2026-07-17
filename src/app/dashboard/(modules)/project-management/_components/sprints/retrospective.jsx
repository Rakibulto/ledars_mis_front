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
  Button,
  Dialog,
  TextField,
  Typography,
  IconButton,
  CardContent,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

const EP = endpoints.pm;

const RETRO_COLUMN_CONFIG = [
  { key: 'went_well', label: 'What Went Well', icon: 'solar:like-bold-duotone', color: '#22c55e' },
  {
    key: 'to_improve',
    label: 'What to Improve',
    icon: 'solar:arrow-up-bold-duotone',
    color: '#f59e0b',
  },
  {
    key: 'action_items',
    label: 'Action Items',
    icon: 'solar:checklist-bold-duotone',
    color: '#3b82f6',
  },
];

export function SprintRetrospective() {
  const [newItems, setNewItems] = useState({ went_well: '', to_improve: '', action_items: '' });
  const [editItem, setEditItem] = useState(null); // { key, index, text }
  const [deleteItem, setDeleteItem] = useState(null); // { key, index }

  const { data: rawSprints, loading: sprintsLoading } = useGetRequest(EP.sprints);
  const { data: rawUsers } = useGetRequest('/api/employees/');

  const SPRINTS = Array.isArray(rawSprints) ? rawSprints : rawSprints?.results || [];
  const USERS = Array.isArray(rawUsers) ? rawUsers : rawUsers?.results || [];

  const getUserById = (id) => USERS.find((u) => u.id === id);
  const completedSprint = SPRINTS.find((s) => s.status === 'completed') || SPRINTS[0];

  // Parse retrospective items from sprint data fields
  const parseItems = (text) => {
    if (!text) return [];
    return text
      .split('\n')
      .filter(Boolean)
      .map((line, i) => ({
        id: i + 1,
        text: line.replace(/^[-•*]\s*/, ''),
      }));
  };

  const addRetroItem = async (key) => {
    const text = newItems[key]?.trim();
    if (!text || !completedSprint) return;
    const existing = completedSprint[key] || '';
    const updated = existing ? `${existing}\n${text}` : text;
    try {
      await axiosInstance.patch(EP.sprint_retrospective(completedSprint.id), { [key]: updated });
      mutate(EP.sprints);
      toast.success('Item added');
      setNewItems({ ...newItems, [key]: '' });
    } catch (err) {
      toast.error(err?.message || 'Failed to add item');
    }
  };

  const handleEditRetroItem = async () => {
    if (!editItem || !completedSprint) return;
    const { key, index, text } = editItem;
    const items = parseItems(completedSprint[key]);
    items[index] = { ...items[index], text };
    const updated = items.map((i) => i.text).join('\n');
    try {
      await axiosInstance.patch(EP.sprint_retrospective(completedSprint.id), { [key]: updated });
      mutate(EP.sprints);
      toast.success('Item updated');
      setEditItem(null);
    } catch (err) {
      toast.error(err?.message || 'Failed to update item');
    }
  };

  const handleDeleteRetroItem = async () => {
    if (!deleteItem || !completedSprint) return;
    const { key, index } = deleteItem;
    const items = parseItems(completedSprint[key]);
    items.splice(index, 1);
    const updated = items.map((i) => i.text).join('\n');
    try {
      await axiosInstance.patch(EP.sprint_retrospective(completedSprint.id), { [key]: updated });
      mutate(EP.sprints);
      toast.success('Item deleted');
      setDeleteItem(null);
    } catch (err) {
      toast.error(err?.message || 'Failed to delete item');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Retrospective
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {completedSprint
              ? `${completedSprint.name} — ${completedSprint.goal}`
              : 'Review past sprints'}
          </Typography>
        </Box>
      </Box>

      {/* Sprint summary */}
      {completedSprint && (
        <Card sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Velocity
              </Typography>
              <Typography variant="h5" fontWeight={700}>
                {completedSprint.velocity} SP
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Duration
              </Typography>
              <Typography variant="h5" fontWeight={700}>
                2 weeks
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Completed
              </Typography>
              <Typography variant="h5" fontWeight={700} color="success.main">
                100%
              </Typography>
            </Box>
          </Box>
        </Card>
      )}

      <Grid container spacing={3}>
        {RETRO_COLUMN_CONFIG.map((col) => {
          const items = completedSprint ? parseItems(completedSprint[col.key]) : [];
          return (
            <Grid key={col.key} size={{ xs: 12, md: 4 }}>
              <Card sx={{ height: '100%' }}>
                <Box
                  sx={{ p: 2, bgcolor: `${col.color}08`, borderBottom: `2px solid ${col.color}` }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Icon icon={col.icon} width={24} style={{ color: col.color }} />
                    <Typography fontWeight={700}>{col.label}</Typography>
                    <Chip label={items.length} size="small" sx={{ height: 20, fontSize: 11 }} />
                  </Box>
                </Box>
                <CardContent>
                  {items.map((item, idx) => (
                    <Card key={item.id} variant="outlined" sx={{ p: 1.5, mb: 1.5 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                        }}
                      >
                        <Typography variant="body2" sx={{ flex: 1 }}>
                          {item.text}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.25, ml: 1, flexShrink: 0 }}>
                          <IconButton
                            size="small"
                            onClick={() =>
                              setEditItem({ key: col.key, index: idx, text: item.text })
                            }
                          >
                            <Icon icon="solar:pen-bold" width={14} />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeleteItem({ key: col.key, index: idx })}
                          >
                            <Icon icon="solar:trash-bin-trash-bold" width={14} />
                          </IconButton>
                        </Box>
                      </Box>
                    </Card>
                  ))}
                  {items.length === 0 && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ py: 2, textAlign: 'center' }}
                    >
                      No items yet
                    </Typography>
                  )}
                  {/* Add new item */}
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <TextField
                      size="small"
                      fullWidth
                      placeholder="Add item..."
                      value={newItems[col.key]}
                      onChange={(e) => setNewItems({ ...newItems, [col.key]: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && addRetroItem(col.key)}
                    />
                    <IconButton size="small" color="primary" onClick={() => addRetroItem(col.key)}>
                      <Icon icon="solar:add-circle-bold" width={20} />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Edit Retro Item Dialog */}
      <Dialog open={!!editItem} onClose={() => setEditItem(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Item</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={editItem?.text || ''}
            onChange={(e) => setEditItem({ ...editItem, text: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditItem(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditRetroItem}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Retro Item Confirmation */}
      <Dialog open={!!deleteItem} onClose={() => setDeleteItem(null)}>
        <DialogTitle>Delete Item?</DialogTitle>
        <DialogContent>
          <Typography>This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteItem(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteRetroItem}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
